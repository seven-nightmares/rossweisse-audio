/**
 * The catalog used by server loads: Strapi when STRAPI_URL and its token are set, otherwise the
 * bundled sample content (local `npm run dev` without Docker, and the static demo build).
 */
import { asset } from '$app/paths';
import type { Catalog } from '#lib/catalog/api.ts';
import { catalog as sampleCatalog } from '#lib/catalog/index.ts';
import { createStrapiCatalog } from './strapi-catalog.ts';
import { strapiConfigured } from './strapi.ts';

let strapiCatalog: Catalog | undefined;

export function getCatalog(): Catalog {
	if (!strapiConfigured()) return sampleCatalog;
	strapiCatalog ??= createStrapiCatalog({
		asset: (path) => asset(path as Parameters<typeof asset>[0])
	});
	return strapiCatalog;
}
