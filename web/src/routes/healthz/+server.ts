import type { RequestHandler } from './$types';

/** Liveness check for Docker; does not depend on Strapi. Not part of the static demo. */
export const prerender = false;

export const GET: RequestHandler = () =>
	new Response('ok', { headers: { 'cache-control': 'no-store' } });
