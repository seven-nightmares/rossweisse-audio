import { error } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { emptyCatalogPage, loadCatalogPage } from '#lib/catalog/catalog-page.ts';
import type { PageLoad } from './$types';

/** See /shop: the static demo searches in the browser. */
export const ssr = !__DEMO__;

export const load: PageLoad = async ({ url, data }) => {
	if (__DEMO__) {
		// SvelteKit still calls this while prerendering the shell (the layout has server data to
		// prerender), but the query string only exists in the browser, which runs the real search.
		if (import.meta.env.SSR) return emptyCatalogPage({ availability: 'sold' });
		const { catalog } = await import('#lib/catalog/index.ts');
		return loadCatalogPage(catalog, url, resolve('/sold'), { availability: 'sold' });
	}
	if (!data.page) error(500, 'Catalog unavailable');
	return data.page;
};
