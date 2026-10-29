import { error } from '@sveltejs/kit';
import { getCatalog } from '#lib/server/catalog.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () =>
	(await getCatalog().getInfoPages()).map((p) => ({ slug: p.slug }));

export const load: PageServerLoad = async ({ params }) => {
	const page = await getCatalog().getInfoPage(params.slug);
	if (!page) error(404, 'Not found');
	return { page };
};
