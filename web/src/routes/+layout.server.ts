import { getCatalog } from '#lib/server/catalog.ts';
import { inquiriesConfigured } from '#lib/server/strapi.ts';
import type { LayoutServerLoad } from './$types';

/** The demo build prerenders every page; the real site renders per request. */
export const prerender = __DEMO__;

export const load: LayoutServerLoad = async () => {
	const [settings, taxonomies, infoPages] = await Promise.all([
		getCatalog().getSiteSettings(),
		getCatalog().getTaxonomies(),
		getCatalog().getInfoPages()
	]);
	return {
		settings,
		categories: taxonomies.categories,
		brands: taxonomies.brands,
		infoPages,
		/** Whether inquiry forms really send (never in the static demo). */
		inquiriesConnected: !__DEMO__ && inquiriesConfigured()
	};
};
