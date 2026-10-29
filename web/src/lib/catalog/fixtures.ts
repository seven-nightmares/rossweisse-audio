/**
 * Catalog implementation over bundled content (the demo's content.json).
 * Pure and synchronous underneath, so it runs the same on the server, during prerendering,
 * and in the browser (the static demo filters the shop client-side).
 */
import { PAGE_SIZE, pricesApply, type SearchState } from '#lib/search.ts';
import type { ProductCard, Term } from '#lib/types.ts';
import type { BrandWithCount, Catalog } from './api.ts';
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
} from './present.ts';
import type { RawContent } from './raw.ts';

const bySortOrder = <T extends { sortOrder: number; name?: string; title?: string }>(a: T, b: T) =>
	a.sortOrder - b.sortOrder || (a.name ?? a.title ?? '').localeCompare(b.name ?? b.title ?? '');

const newestFirst = (a: ResolvedProduct, b: ResolvedProduct) =>
	b.arrivedOn.localeCompare(a.arrivedOn) || a.sku.localeCompare(b.sku);

const SORTERS: Record<SearchState['sort'], (a: ResolvedProduct, b: ResolvedProduct) => number> = {
	newest: newestFirst,
	'price-asc': (a, b) => a.price - b.price || a.sku.localeCompare(b.sku),
	'price-desc': (a, b) => b.price - a.price || a.sku.localeCompare(b.sku),
	name: (a, b) => a.title.localeCompare(b.title) || a.sku.localeCompare(b.sku)
};

const normalize = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function createFixtureCatalog(content: RawContent, ctx: PresentContext): Catalog {
	const term = (t: { name: string; slug: string } | undefined): Term | null =>
		t ? { name: t.name, slug: t.slug } : null;
	const brandsBySlug = new Map(content.brands.map((b) => [b.slug, b]));
	const categoriesBySlug = new Map(content.categories.map((c) => [c.slug, c]));

	const products: ResolvedProduct[] = content.products
		.filter((p) => {
			if (isPresentable(p)) return true;
			console.warn(`Skipping product ${p.sku}: invalid field values`);
			return false;
		})
		.map((p) => ({
			...p,
			brand: term(p.brand ? brandsBySlug.get(p.brand) : undefined),
			category: term(p.category ? categoriesBySlug.get(p.category) : undefined)
		}));
	const bySku = new Map(products.map((p) => [p.sku, p]));
	const bySlug = new Map(products.map((p) => [p.slug, p]));
	const forSale = (p: ResolvedProduct) => p.availability !== 'sold';
	const card = (p: ResolvedProduct): ProductCard => toCard(p, ctx);

	/** Every search word must appear in one of the searchable fields. */
	function matchesQuery(p: ResolvedProduct, q: string): boolean {
		const haystack = normalize(
			[p.title, p.summary, p.sku, p.modelNumber, p.brand?.name, p.category?.name]
				.filter(Boolean)
				.join(' ')
		);
		return normalize(q)
			.split(' ')
			.filter(Boolean)
			.every((word) => haystack.includes(word));
	}

	function matches(p: ResolvedProduct, s: SearchState): boolean {
		if (s.availability === 'available' && !forSale(p)) return false;
		if (s.availability === 'sold' && forSale(p)) return false;
		if (s.q && !matchesQuery(p, s.q)) return false;
		if (s.category && p.category?.slug !== s.category) return false;
		if (s.brand && p.brand?.slug !== s.brand) return false;
		if (s.newOrUsed && p.newOrUsed !== s.newOrUsed) return false;
		if (s.era && p.era !== s.era) return false;
		if (s.technology && p.technology !== s.technology) return false;
		if (s.voltage && p.voltage !== s.voltage) return false;
		if (pricesApply(s)) {
			if (s.min !== null && p.price < s.min) return false;
			if (s.max !== null && p.price > s.max) return false;
		}
		return true;
	}

	return {
		async searchProducts(state) {
			const found = products.filter((p) => matches(p, state)).sort(SORTERS[state.sort]);
			const start = (state.page - 1) * PAGE_SIZE;
			return {
				items: found.slice(start, start + PAGE_SIZE).map(card),
				total: found.length,
				page: state.page,
				pageCount: Math.ceil(found.length / PAGE_SIZE)
			};
		},

		async listProducts({ limit, featured }) {
			return products
				.filter((p) => forSale(p) && (!featured || p.featured === true))
				.sort(newestFirst)
				.slice(0, limit)
				.map(card);
		},

		async getProduct(slug) {
			const p = bySlug.get(slug);
			if (!p) return null;
			const explicit = (p.recommendedWith ?? [])
				.map((sku) => bySku.get(sku))
				.filter((r): r is ResolvedProduct => r !== undefined && r !== p && forSale(r));
			const similar = products
				.filter((r) => r !== p && forSale(r) && r.category?.slug === p.category?.slug)
				.sort(newestFirst);
			const recommended = (explicit.length ? explicit : similar).slice(0, 4).map(card);
			return toDetail(p, recommended, ctx);
		},

		async productSlugs() {
			return products.map((p) => p.slug);
		},

		async productOptions() {
			return products
				.filter(forSale)
				.map((p) => ({ sku: p.sku, title: p.title }))
				.sort((a, b) => a.title.localeCompare(b.title));
		},

		async getTaxonomies() {
			return {
				categories: [...content.categories].sort(bySortOrder).map((c) => toCategory(c, ctx)),
				brands: [...content.brands].sort(bySortOrder).map(toBrand)
			};
		},

		async getCategories() {
			return [...content.categories].sort(bySortOrder).map((c) => toCategory(c, ctx));
		},

		async getBrands(): Promise<BrandWithCount[]> {
			return [...content.brands].sort(bySortOrder).map((b) => ({
				...toBrand(b),
				available: products.filter((p) => forSale(p) && p.brand?.slug === b.slug).length
			}));
		},

		async getInfoPages() {
			return [...content.infoPages].sort(bySortOrder).map(toInfoPageLink);
		},

		async getInfoPage(slug) {
			const page = content.infoPages.find((p) => p.slug === slug);
			return page ? toInfoPage(page) : null;
		},

		async getWantedItems() {
			return [...content.wantedItems]
				.sort((a, b) => a.sortOrder - b.sortOrder || a.brand.localeCompare(b.brand))
				.map(toWantedItem);
		},

		async getSiteSettings() {
			return toSettings(content.siteSettings, ctx);
		}
	};
}
