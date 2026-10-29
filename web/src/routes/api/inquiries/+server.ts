import { json, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { validateInquiry } from '#lib/inquiry.ts';
import { getCatalog } from '#lib/server/catalog.ts';
import { createInquiry, inquiriesConfigured } from '#lib/server/strapi.ts';
import type { RequestHandler } from './$types';

/** Saves website inquiries to the CMS. Not part of the static demo, whose forms don't send. */
export const prerender = false;

/** At most LIMIT inquiries per visitor (IP) per WINDOW, to slow down spam. */
const WINDOW_MS = 10 * 60_000;
const LIMIT = 5;
const recent = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
	const now = Date.now();
	const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
	if (hits.length >= LIMIT) {
		recent.set(ip, hits);
		return true;
	}
	hits.push(now);
	recent.set(ip, hits);
	if (recent.size > 5000) {
		for (const [key, times] of recent) {
			if (times.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
		}
	}
	return false;
}

const FALLBACK_PAGE = (message: string) =>
	`<!doctype html><meta charset="utf-8"><title>Inquiry not sent</title>` +
	`<p>${message}</p><p>Please go back and try again.</p>`;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	// The form posts with fetch (JSON reply); without JavaScript it is a plain form post.
	const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
	const reply = (status: number, body: { ok: boolean; message?: string; errors?: object }) => {
		if (wantsJson) return json(body, { status });
		if (body.ok) redirect(303, resolve('/thanks'));
		return new Response(FALLBACK_PAGE(body.message ?? 'Please check the form.'), {
			status,
			headers: { 'content-type': 'text/html; charset=utf-8' }
		});
	};

	if (!inquiriesConfigured()) {
		return reply(503, { ok: false, message: 'Inquiries are not connected on this site.' });
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return reply(400, { ok: false, message: 'The form could not be read.' });
	}

	const result = validateInquiry(form);
	if (!result.ok) {
		return reply(400, { ok: false, message: 'Please check the form.', errors: result.errors });
	}
	if (rateLimited(getClientAddress())) {
		return reply(429, {
			ok: false,
			message:
				'You’ve sent several messages in a short time. Please wait a few minutes, or call us.'
		});
	}

	const d = result.data;
	let productTitle: string | null = null;
	if (d.type === 'product-question' && d.productSku) {
		const options = await getCatalog().productOptions();
		productTitle = options.find((o) => o.sku === d.productSku)?.title ?? null;
	}

	const saved = await createInquiry({
		type: d.type,
		name: d.name,
		email: d.email,
		phone: d.phone || null,
		message: d.message,
		productSku: d.type === 'product-question' ? d.productSku || null : null,
		productTitle,
		gearDescription: 'gearDescription' in d ? d.gearDescription : null,
		budget: 'budget' in d ? d.budget || null : null,
		roomSize: 'roomSize' in d ? d.roomSize || null : null,
		musicTaste: 'musicTaste' in d ? d.musicTaste || null : null
	});

	return saved
		? reply(200, { ok: true })
		: reply(502, {
				ok: false,
				message: 'Sorry, your message could not be saved just now. Please try again, or call us.'
			});
};
