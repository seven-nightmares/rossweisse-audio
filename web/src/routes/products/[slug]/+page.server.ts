import { error } from '@sveltejs/kit';
import { getCatalog } from '#lib/server/catalog.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

/** Lists every product page for the static demo, sold ones included. */
export const entries: EntryGenerator = async () =>
	(await getCatalog().productSlugs()).map((slug) => ({ slug }));

export const load: PageServerLoad = async ({ params }) => {
	const product = await getCatalog().getProduct(params.slug);
	if (!product) error(404, 'Not found');
	return { product };
};
