import { error } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { emptyCatalogPage, loadCatalogPage } from '#lib/catalog/catalog-page.ts';
import type { PageLoad } from './$types';

/**
 * Filters live in the query string, which a prerendered page can't read at build time.
 * The static demo therefore ships this page as a shell and runs the search in the browser over
 * the bundled sample catalog (loaded only in that build). The real site uses the server's result.
 */
export const ssr = !__DEMO__;

export const load: PageLoad = async ({ url, data }) => {
	if (__DEMO__) {
		// SvelteKit still calls this while prerendering the shell (the layout has server data to
		// prerender), but the query string only exists in the browser, which runs the real search.
		if (import.meta.env.SSR) return emptyCatalogPage();
		const { catalog } = await import('#lib/catalog/index.ts');
		return loadCatalogPage(catalog, url, resolve('/shop'));
	}
	if (!data.page) error(500, 'Catalog unavailable');
	return data.page;
};
