import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

/*
 * All optional: without STRAPI_URL the storefront serves the bundled sample content
 * (`npm run dev` without Docker, and the static demo build). With it, both tokens are required;
 * hooks.server.ts refuses to start if one is missing.
 */
export const variables = defineEnvVars({
	STRAPI_URL: {
		description: 'Base URL of the Strapi server, as reachable from the storefront server.',
		schema: v.optional(
			v.pipe(
				v.string(),
				v.url(),
				v.transform((s) => s.replace(/\/+$/, ''))
			)
		)
	},
	STRAPI_API_TOKEN: {
		description: 'Read-only Strapi API token. Server-side only; never sent to browsers.',
		schema: v.optional(v.pipe(v.string(), v.minLength(1)))
	},
	STRAPI_INQUIRY_TOKEN: {
		description: 'Custom Strapi API token allowed only to create inquiries. Server-side only.',
		schema: v.optional(v.pipe(v.string(), v.minLength(1)))
	}
});
