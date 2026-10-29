import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit/hooks';
import { STRAPI_API_TOKEN, STRAPI_INQUIRY_TOKEN, STRAPI_URL } from '$app/env/private';

/** With STRAPI_URL set, both tokens are required; without it the sample catalog is served. */
export const init: ServerInit = () => {
	if (!STRAPI_URL) {
		if (!__DEMO__) console.log('STRAPI_URL is not set: serving the bundled sample catalog.');
		return;
	}
	const missing = [
		!STRAPI_API_TOKEN && 'STRAPI_API_TOKEN',
		!STRAPI_INQUIRY_TOKEN && 'STRAPI_INQUIRY_TOKEN'
	].filter(Boolean);
	if (missing.length) {
		throw new Error(
			`Missing ${missing.join(' and ')}. Run scripts/seed.ps1 to create them in .env.`
		);
	}
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	response.headers.set('x-frame-options', 'DENY');
	response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
	return response;
};

/** Unknown errors keep SvelteKit's generic 500 message for visitors; log them for us. */
export const handleError: HandleServerError = ({ kind, error, event }) => {
	if (kind === 'unknown') console.error(`Unexpected error on ${event.url.pathname}`, error);
};
