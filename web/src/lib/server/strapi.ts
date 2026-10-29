import { error } from '@sveltejs/kit';
import { STRAPI_API_TOKEN, STRAPI_INQUIRY_TOKEN, STRAPI_URL } from '$app/env/private';

type QueryValue = string | number | boolean | null | undefined | QueryValue[] | QueryObject;
export interface QueryObject {
	[key: string]: QueryValue;
}

/** Encodes nested objects/arrays in the bracket notation Strapi's REST API expects. */
export function encodeQuery(query: QueryObject): string {
	const parts: string[] = [];
	const walk = (value: QueryValue, key: string) => {
		if (value === undefined || value === null) return;
		if (Array.isArray(value)) {
			value.forEach((v, i) => walk(v, `${key}[${i}]`));
		} else if (typeof value === 'object') {
			for (const [k, v] of Object.entries(value)) walk(v, key ? `${key}[${k}]` : k);
		} else {
			parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
		}
	};
	walk(query, '');
	return parts.join('&');
}

export interface StrapiList<T> {
	data: T[];
	meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
}

export interface StrapiSingle<T> {
	data: T | null;
}

/** True when the storefront is configured to read from Strapi. */
export const strapiConfigured = () => Boolean(STRAPI_URL && STRAPI_API_TOKEN);
/** True when inquiries can be saved to Strapi. */
export const inquiriesConfigured = () => Boolean(STRAPI_URL && STRAPI_INQUIRY_TOKEN);

const UNAVAILABLE = 'The catalog is taking a short break. Please try again in a moment.';

/**
 * GETs a Strapi REST endpoint with the read-only token.
 * Always requests published content: drafts can never reach visitors.
 * Returns null on 404; other failures become a 503 for the visitor.
 */
export async function strapiGet<T>(
	path: `/api/${string}`,
	query: QueryObject = {}
): Promise<T | null> {
	const qs = encodeQuery({ ...query, status: 'published' });
	let res: Response;
	try {
		res = await fetch(`${STRAPI_URL}${path}?${qs}`, {
			headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, Accept: 'application/json' },
			signal: AbortSignal.timeout(5000)
		});
	} catch (e) {
		console.error(`Strapi request failed: ${path}`, e);
		error(503, UNAVAILABLE);
	}

	if (res.status === 404) return null;
	if (!res.ok) {
		console.error(
			`Strapi responded ${res.status} for ${path}: ${await res.text().catch(() => '')}`
		);
		error(503, UNAVAILABLE);
	}
	return (await res.json()) as T;
}

/** GETs every page of a collection (Strapi caps page size at 100). */
export async function strapiGetAll<T>(
	path: `/api/${string}`,
	query: QueryObject = {}
): Promise<T[]> {
	const out: T[] = [];
	for (let page = 1; ; page++) {
		const res = await strapiGet<StrapiList<T>>(path, {
			...query,
			pagination: { page, pageSize: 100, withCount: true }
		});
		out.push(...(res?.data ?? []));
		if (!res || page >= res.meta.pagination.pageCount) return out;
	}
}

/** Creates an inquiry with the create-only inquiry token. Returns false if Strapi refuses. */
export async function createInquiry(data: Record<string, unknown>): Promise<boolean> {
	try {
		const res = await fetch(`${STRAPI_URL}/api/inquiries`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${STRAPI_INQUIRY_TOKEN}`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({ data }),
			signal: AbortSignal.timeout(8000)
		});
		if (!res.ok) {
			console.error(
				`Strapi refused an inquiry (${res.status}): ${await res.text().catch(() => '')}`
			);
		}
		return res.ok;
	} catch (e) {
		console.error('Saving an inquiry failed', e);
		return false;
	}
}

/** Streams a file from Strapi's public uploads folder. */
export function fetchUpload(fileName: string, init: RequestInit = {}) {
	return fetch(`${STRAPI_URL}/uploads/${encodeURIComponent(fileName)}`, {
		...init,
		signal: AbortSignal.timeout(10000)
	});
}
