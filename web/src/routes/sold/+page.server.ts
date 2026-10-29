import { resolve } from '$app/paths';
import { loadCatalogPage } from '#lib/catalog/catalog-page.ts';
import { getCatalog } from '#lib/server/catalog.ts';
import type { PageServerLoad } from './$types';

/** See /shop: the static demo searches in the browser instead (+page.ts). */
export const load: PageServerLoad = async (event) => {
	// The demo must not touch the request URL at all while prerendering.
	if (__DEMO__) return { page: null };
	return {
		page: await loadCatalogPage(getCatalog(), event.url, resolve('/sold'), { availability: 'sold' })
	};
};
