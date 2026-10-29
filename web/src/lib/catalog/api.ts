import type { SearchState } from '#lib/search.ts';
import type {
	Brand,
	Category,
	InfoPage,
	InfoPageLink,
	ProductCard,
	ProductDetail,
	ProductOption,
	SearchResult,
	SiteSettings,
	Taxonomies,
	WantedItem
} from '#lib/types.ts';

export type BrandWithCount = Brand & { available: number };

/**
 * Every catalog read the storefront makes. Routes depend on this interface only.
 * M1 implementation: ./fixtures.ts (bundled demo content). M2 adds a Strapi implementation.
 */
export interface Catalog {
	searchProducts(state: SearchState): Promise<SearchResult>;
	/** Newest pieces for sale (available or on hold). */
	listProducts(options: { limit: number; featured?: boolean }): Promise<ProductCard[]>;
	getProduct(slug: string): Promise<ProductDetail | null>;
	/** Every product slug, sold ones included (sold pages stay reachable). */
	productSlugs(): Promise<string[]>;
	/** Pieces for sale, for the inquiry form's picker. */
	productOptions(): Promise<ProductOption[]>;
	getTaxonomies(): Promise<Taxonomies>;
	getCategories(): Promise<Category[]>;
	getBrands(): Promise<BrandWithCount[]>;
	getInfoPages(): Promise<InfoPageLink[]>;
	getInfoPage(slug: string): Promise<InfoPage | null>;
	getWantedItems(): Promise<WantedItem[]>;
	getSiteSettings(): Promise<SiteSettings>;
}
