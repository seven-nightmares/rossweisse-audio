import { describe, expect, it } from 'vitest';
import { validateInquiry } from './inquiry.ts';

const form = (fields: Record<string, string>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(fields)) f.append(k, v);
	return f;
};

const contact = {
	name: 'Sam',
	email: 'sam@example.com',
	message: 'Is this still available?'
};

describe('validateInquiry', () => {
	it('accepts a product question', () => {
		const r = validateInquiry(
			form({ type: 'product-question', productSku: 'RA-1001', ...contact })
		);
		expect(r).toMatchObject({
			ok: true,
			data: { type: 'product-question', productSku: 'RA-1001' }
		});
	});

	it('requires a gear description for sell, trade and consign', () => {
		for (const type of ['sell', 'trade', 'consign']) {
			const r = validateInquiry(form({ type, ...contact }));
			expect(r.ok).toBe(false);
			if (!r.ok) expect(r.errors.gearDescription).toBeTruthy();
		}
		expect(
			validateInquiry(form({ type: 'sell', gearDescription: 'Kestrel KA-250', ...contact })).ok
		).toBe(true);
	});

	it('reports missing contact details per field', () => {
		const r = validateInquiry(form({ type: 'concierge', name: '', email: 'nope', message: 'hi' }));
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(Object.keys(r.errors).sort()).toEqual(['email', 'message', 'name']);
		}
	});

	it('rejects bots that fill in the honeypot, and unknown types', () => {
		expect(
			validateInquiry(form({ type: 'concierge', website: 'spam.example', ...contact })).ok
		).toBe(false);
		expect(validateInquiry(form({ type: 'refund', ...contact })).ok).toBe(false);
	});

	it('rejects malformed SKUs', () => {
		expect(
			validateInquiry(form({ type: 'product-question', productSku: '<x>', ...contact })).ok
		).toBe(false);
	});
});
