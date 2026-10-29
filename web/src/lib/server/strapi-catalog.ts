/**
 * Catalog implementation backed by Strapi's REST API (read-only token, published content only).
 * Strapi responses are mapped to the raw content shapes and then through the same presenters
 * as the sample catalog, so both render identically.
 */
import type { BrandWithCount, Catalog } from '#lib/catalog/api.ts';
import { GRADE_FROM_CMS, NEW_OR_USED_FROM_CMS, VOLTAGE_FROM_CMS } from '#lib/catalog/cms-values.ts';
import {
	isPresentable,
	toBrand,
	toCard,
	toCategory,
	toDetail,
	toInfoPage,
	toInfoPageLink,
	toSettings,
	toWantedItem,
	type PresentContext,
	type ResolvedProduct
} from '#lib/catalog/present.ts';
import type {
	RawBrand,
	RawCategory,
	RawInfoPage,
	RawMedia,
	RawSiteSettings,
	RawWantedItem
} from '#lib/catalog/raw.ts';
import { PAGE_SIZE, type SearchState } from '#lib/search.ts';
import type { ProductCard, Term } from '#lib/types.ts';
import {
	strapiGet,
	strapiGetAll,
	type QueryObject,
	type StrapiList,
	type StrapiSingle
} from './strapi.ts';
import { FOR_SALE, buildProductFilters } from './strapi-query.ts';

/* ---------- Strapi REST shapes (only the fields we request) ---------- */

interface StrapiFormat {
	url: string;
	width: number;
	height: number;
}
interface StrapiMedia {
	url: string;
	alternativeText: string | null;
	width: number | null;
	height: number | null;
	formats?: Record<string, StrapiFormat> | null;
	ext?: string | null;
}
type StrapiProduct = Omit<
	ResolvedProduct,
	'photos' | 'brand' | 'category' | 'recommendedWith' | 'manualFile'
> & {
	brand?: Term | null;
	category?: Term | null;
	photos?: StrapiMedia[] | null;
	manual?: StrapiMedia | null;
	recommendedWith?: StrapiProduct[] | null;
};
type StrapiCategory = Omit<RawCategory, 'image'> & { image?: StrapiMedia | null };
type StrapiSettings = Omit<RawSiteSettings, 'heroImage' | 'addressLines' | 'hours'> & {
	heroImage?: StrapiMedia | null;
	address?: string | null;
	hours?: string | null;
};

/* ---------- mapping ---------- */

/** "/uploads/x.jpg" → "uploads/x.jpg" (served by the storefront's /uploads proxy). */
const sitePath = (url: string) => url.replace(/^\/+/, '');

function toRawMedia(m: StrapiMedia | null | undefined): RawMedia | null {
	if (!m?.url || !m.width || !m.height) return null;
	return {
		url: sitePath(m.url),
		alternativeText: m.alternativeText,
		width: m.width,
		height: m.height,
		// Skip the tiny "thumbnail" rendition; it only suits the admin.
		formats: Object.values(m.formats ?? {})
			.filter((f) => f.width > 245)
			.map((f) => ({ url: sitePath(f.url), width: f.width, height: f.height }))
	};
}

function toResolved(p: StrapiProduct): ResolvedProduct {
	return {
		...p,
		summary: p.summary ?? '',
		brand: p.brand ? { name: p.brand.name, slug: p.brand.slug } : null,
		category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
		conditionGrade: GRADE_FROM_CMS[p.conditionGrade] ?? p.conditionGrade,
		newOrUsed: NEW_OR_USED_FROM_CMS[p.newOrUsed] ?? p.newOrUsed,
		voltage: p.voltage ? (VOLTAGE_FROM_CMS[p.voltage] ?? p.voltage) : null,
		photos: (p.photos ?? []).map(toRawMedia).filter((m): m is RawMedia => m !== null),
		manualFile: p.manual?.url && p.manual.ext === '.pdf' ? sitePath(p.manual.url) : null,
		recommendedWith: null
	};
}

const MEDIA_FIELDS = ['url', 'alternativeText', 'width', 'height', 'formats'];
const TERM = { fields: ['name', 'slug'] };
const CARD_FIELDS = [
	'sku',
	'slug',
	'title',
	'summary',
	'price',
	'availability',
	'arrivedOn',
	'newOrUsed',
	'era',
	'technology',
	'conditionGrade'
];
const CARD_QUERY = {
	fields: CARD_FIELDS,
	populate: { photos: { fields: MEDIA_FIELDS }, brand: TERM, category: TERM }
} satisfies QueryObject;

const SORT: Record<SearchState['sort'], string[]> = {
	newest: ['arrivedOn:desc', 'sku:asc'],
	'price-asc': ['price:asc', 'sku:asc'],
	'price-desc': ['price:desc', 'sku:asc'],
	name: ['title:asc', 'sku:asc']
};

const lines = (text: string | null | undefined) => (text ?? '').split(/\r?\n/);

export function createStrapiCatalog(ctx: PresentContext): Catalog {
	/** Cards for presentable products; anything with bad data is skipped (and logged). */
	const cards = (products: StrapiProduct[] | null | undefined): ProductCard[] =>
		(products ?? []).map(toResolved).flatMap((p) => {
			if (isPresentable(p)) return [toCard(p, ctx)];
			console.warn(`Skipping product ${p.sku}: invalid field values`);
			return [];
		});

	const listCards = async (filters: QueryObject, sort: string[], limit: number) => {
		const res = await strapiGet<StrapiList<StrapiProduct>>('/api/products', {
			...CARD_QUERY,
			filters,
			sort,
			pagination: { page: 1, pageSize: limit, withCount: false }
		});
		return cards(res?.data);
	};

	const getCategories = async () =>
		(
			await strapiGetAll<StrapiCategory>('/api/categories', {
				fields: ['name', 'slug', 'description', 'sortOrder', 'showInMenu', 'showOnHome'],
				populate: { image: { fields: MEDIA_FIELDS } },
				sort: ['sortOrder:asc', 'name:asc']
			})
		).map((c) => toCategory({ ...c, image: toRawMedia(c.image) }, ctx));

	const getRawBrands = () =>
		strapiGetAll<RawBrand>('/api/brands', {
			fields: ['name', 'slug', 'sortOrder', 'country', 'founded', 'blurb', 'authorizedDealer'],
			sort: ['sortOrder:asc', 'name:asc']
		});

	return {
		async searchProducts(state) {
			const res = await strapiGet<StrapiList<StrapiProduct>>('/api/products', {
				...CARD_QUERY,
				filters: buildProductFilters(state),
				sort: SORT[state.sort],
				pagination: { page: state.page, pageSize: PAGE_SIZE, withCount: true }
			});
			const pagination = res?.meta.pagination ?? { page: state.page, pageCount: 0, total: 0 };
			return {
				items: cards(res?.data),
				total: pagination.total,
				page: state.page,
				pageCount: pagination.pageCount
			};
		},

		listProducts({ limit, featured }) {
			const filters = featured ? { ...FOR_SALE, featured: { $eq: true } } : FOR_SALE;
			return listCards(filters, SORT.newest, limit);
		},

		async getProduct(slug) {
			const res = await strapiGet<StrapiList<StrapiProduct>>('/api/products', {
				filters: { slug: { $eq: slug } },
				populate: {
					photos: { fields: MEDIA_FIELDS },
					brand: TERM,
					category: TERM,
					specs: true,
					manual: { fields: ['url', 'ext'] },
					recommendedWith: { ...CARD_QUERY, filters: FOR_SALE }
				},
				pagination: { page: 1, pageSize: 1, withCount: false }
			});
			const raw = res?.data[0];
			if (!raw) return null;
			const product = toResolved(raw);
			if (!isPresentable(product)) return null;

			let recommended = cards(raw.recommendedWith).filter((r) => r.sku !== product.sku);
			if (!recommended.length && product.category) {
				recommended = await listCards(
					{
						...FOR_SALE,
						category: { slug: { $eq: product.category.slug } },
						sku: { $ne: product.sku }
					},
					SORT.newest,
					4
				);
			}
			return toDetail(product, recommended.slice(0, 4), ctx);
		},

		async productSlugs() {
			const all = await strapiGetAll<{ slug: string }>('/api/products', { fields: ['slug'] });
			return all.map((p) => p.slug);
		},

		async productOptions() {
			const all = await strapiGetAll<{ sku: string; title: string }>('/api/products', {
				fields: ['sku', 'title'],
				filters: FOR_SALE,
				sort: ['title:asc']
			});
			return all.map(({ sku, title }) => ({ sku, title }));
		},

		async getTaxonomies() {
			const [categories, brands] = await Promise.all([getCategories(), getRawBrands()]);
			return { categories, brands: brands.map(toBrand) };
		},

		getCategories,

		async getBrands(): Promise<BrandWithCount[]> {
			const [brands, forSale] = await Promise.all([
				getRawBrands(),
				strapiGetAll<{ brand?: Term | null }>('/api/products', {
					fields: ['sku'],
					populate: { brand: { fields: ['slug'] } },
					filters: FOR_SALE
				})
			]);
			const counts = new Map<string, number>();
			for (const p of forSale) {
				if (p.brand) counts.set(p.brand.slug, (counts.get(p.brand.slug) ?? 0) + 1);
			}
			return brands.map((b) => ({ ...toBrand(b), available: counts.get(b.slug) ?? 0 }));
		},

		async getInfoPages() {
			const pages = await strapiGetAll<RawInfoPage>('/api/info-pages', {
				fields: ['title', 'slug', 'menuGroup', 'sortOrder'],
				sort: ['sortOrder:asc', 'title:asc']
			});
			return pages.map(toInfoPageLink);
		},

		async getInfoPage(slug) {
			const res = await strapiGet<StrapiList<RawInfoPage>>('/api/info-pages', {
				filters: { slug: { $eq: slug } },
				pagination: { page: 1, pageSize: 1, withCount: false }
			});
			const page = res?.data[0];
			return page ? toInfoPage(page) : null;
		},

		async getWantedItems() {
			const items = await strapiGetAll<RawWantedItem>('/api/wanted-items', {
				fields: ['brand', 'model', 'note', 'sortOrder'],
				sort: ['sortOrder:asc', 'brand:asc']
			});
			return items.map(toWantedItem);
		},

		async getSiteSettings() {
			const res = await strapiGet<StrapiSingle<StrapiSettings>>('/api/site-setting', {
				populate: { heroImage: { fields: MEDIA_FIELDS }, social: true }
			});
			const s = res?.data;
			return toSettings(
				s && {
					...s,
					heroImage: toRawMedia(s.heroImage),
					addressLines: lines(s.address),
					hours: lines(s.hours)
				},
				ctx
			);
		}
	};
}
