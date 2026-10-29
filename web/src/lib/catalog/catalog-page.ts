import { redirect } from '@sveltejs/kit';
import {
	DEFAULT_SEARCH,
	parseSearch,
	searchHref,
	toSearchParams,
	type SearchState
} from '#lib/search.ts';
import type { Catalog } from './api.ts';

/**
 * Loads a searchable catalog page (/shop, /sold).
 * Non-canonical URLs (empty or invalid params, out-of-range pages) redirect to their clean form,
 * so every result set has exactly one shareable URL.
 *
 * `path` is the resolved route path (base path included).
 */
export async function loadCatalogPage(
	catalog: Catalog,
	url: URL,
	path: string,
	fixed: Partial<SearchState> = {}
) {
	const omit = Object.keys(fixed) as (keyof SearchState)[];
	const state = parseSearch(url.searchParams, fixed);

	const canonical = toSearchParams(state, omit).toString();
	if (canonical !== url.searchParams.toString()) redirect(302, searchHref(path, state, omit));

	const [result, taxonomies] = await Promise.all([
		catalog.searchProducts(state),
		catalog.getTaxonomies()
	]);

	if (result.pageCount > 0 && state.page > result.pageCount) {
		redirect(302, searchHref(path, { ...state, page: result.pageCount }, omit));
	}

	return { state, result, taxonomies, fixed };
}

export type CatalogPageData = Awaited<ReturnType<typeof loadCatalogPage>>;

/** Placeholder result: never shown, the browser replaces it with the real search. */
export function emptyCatalogPage(fixed: Partial<SearchState> = {}): CatalogPageData {
	return {
		state: { ...DEFAULT_SEARCH, ...fixed },
		result: { items: [], total: 0, page: 1, pageCount: 0 },
		taxonomies: { categories: [], brands: [] },
		fixed
	};
}
