import { getCatalog } from '#lib/server/catalog.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ wanted: await getCatalog().getWantedItems() });
