import { getCatalog } from '#lib/server/catalog.ts';
import { DEFAULT_SEARCH } from '#lib/search.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [justArrived, featured, tubes, brands] = await Promise.all([
		getCatalog().listProducts({ limit: 8 }),
		getCatalog().listProducts({ limit: 8, featured: true }),
		getCatalog().searchProducts({ ...DEFAULT_SEARCH, technology: 'tube' }),
		getCatalog().getBrands()
	]);
	const shown = new Set(justArrived.map((p) => p.sku));
	return {
		justArrived,
		featured: featured.filter((p) => !shown.has(p.sku)).slice(0, 4),
		tubes: tubes.items.slice(0, 4),
		brands: brands.filter((b) => b.available > 0)
	};
};
