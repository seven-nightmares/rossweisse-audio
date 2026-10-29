/**
 * The storefront's catalog. Routes import `catalog` from here and nothing else.
 * M1: bundled demo content. M2: chosen at build time between this and the Strapi adapter.
 */
import { asset } from '$app/paths';
import content from '#lib/demo/content.json';
import type { Catalog } from './api.ts';
import { createFixtureCatalog } from './fixtures.ts';
import type { RawContent } from './raw.ts';

export type { BrandWithCount, Catalog } from './api.ts';

export const catalog: Catalog = createFixtureCatalog(content as RawContent, {
	// Media paths are stored without a leading slash; asset() prefixes the base path.
	asset: (path) => asset(path as Parameters<typeof asset>[0])
});
