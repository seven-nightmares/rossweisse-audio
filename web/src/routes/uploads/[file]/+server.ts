import { error } from '@sveltejs/kit';
import { fetchUpload, strapiConfigured } from '#lib/server/strapi.ts';
import type { RequestHandler } from './$types';

/** Proxies media from Strapi so browsers only ever talk to the storefront. Not in the static demo. */
export const prerender = false;

/** Strapi upload filenames: hashed names with an image or PDF extension. */
const FILE = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,200}\.(?:jpe?g|png|webp|avif|gif|pdf)$/i;

export const GET: RequestHandler = async ({ params, request }) => {
	if (!strapiConfigured() || !FILE.test(params.file)) error(404, 'Not found');

	const etag = request.headers.get('if-none-match');
	const upstream = await fetchUpload(params.file, {
		headers: etag ? { 'if-none-match': etag } : {}
	}).catch(() => null);

	if (!upstream) error(503, 'File temporarily unavailable');
	if (upstream.status === 304) return new Response(null, { status: 304 });
	if (!upstream.ok || !upstream.body) error(upstream.status === 404 ? 404 : 502, 'Not found');

	const type = upstream.headers.get('content-type') ?? '';
	const isPdf = params.file.toLowerCase().endsWith('.pdf');
	if (isPdf ? type !== 'application/pdf' : !type.startsWith('image/')) error(404, 'Not found');

	const headers = new Headers({
		'content-type': type,
		'cache-control': 'public, max-age=86400',
		'x-content-type-options': 'nosniff'
	});
	if (isPdf) headers.set('content-disposition', 'inline');
	for (const h of ['content-length', 'etag']) {
		const v = upstream.headers.get(h);
		if (v) headers.set(h, v);
	}
	return new Response(upstream.body, { headers });
};
