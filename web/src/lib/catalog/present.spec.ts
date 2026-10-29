import { describe, expect, it } from 'vitest';
import {
	safeHttps,
	toCard,
	toDetail,
	toImage,
	toSettings,
	type ResolvedProduct
} from './present.ts';

const ctx = { asset: (p: string) => `/b/${p}` };

const product: ResolvedProduct = {
	sku: 'RA-9999',
	slug: 'test',
	title: 'Test Amp',
	summary: 'x',
	brand: null,
	category: null,
	price: 1200,
	availability: 'available',
	arrivedOn: '2026-01-01',
	newOrUsed: 'pre-owned',
	era: 'vintage',
	conditionGrade: '7'
};

describe('toImage', () => {
	const media = { url: 'demo/x.svg', alternativeText: null, width: 10, height: 5 };

	it('builds a base-path URL and falls back to the given alt text', () => {
		expect(toImage(media, 'fallback', ctx)).toEqual({
			src: '/b/demo/x.svg',
			srcset: '/b/demo/x.svg 10w',
			width: 10,
			height: 5,
			alt: 'fallback'
		});
	});

	it('rejects external, traversal and non-image paths', () => {
		for (const url of [
			'https://evil.example/x.svg',
			'../x.svg',
			'demo/../../x.svg',
			'x.html',
			'/x.svg'
		]) {
			expect(toImage({ ...media, url }, '', ctx), url).toBeNull();
		}
		expect(toImage({ ...media, width: 0 }, '', ctx)).toBeNull();
	});
});

describe('toImage with renditions', () => {
	it('builds a srcset from smaller formats and picks a medium src', () => {
		const img = toImage(
			{
				url: 'uploads/amp.jpg',
				alternativeText: 'Amp',
				width: 1600,
				height: 1200,
				formats: [
					{ url: 'uploads/large_amp.jpg', width: 1000, height: 750 },
					{ url: 'uploads/small_amp.jpg', width: 500, height: 375 },
					{ url: 'https://evil.example/x.jpg', width: 750, height: 500 }
				]
			},
			'',
			ctx
		);
		expect(img?.src).toBe('/b/uploads/large_amp.jpg');
		expect(img?.srcset).toBe(
			'/b/uploads/small_amp.jpg 500w, /b/uploads/large_amp.jpg 1000w, /b/uploads/amp.jpg 1600w'
		);
	});
});

describe('toCard', () => {
	it('keeps the price for pieces for sale and on hold', () => {
		expect(toCard(product, ctx)).toMatchObject({ sold: false, price: 1200, status: 'available' });
		expect(toCard({ ...product, availability: 'on-hold' }, ctx)).toMatchObject({
			sold: false,
			price: 1200,
			status: 'on-hold'
		});
	});

	it('drops the price for sold pieces', () => {
		const card = toCard({ ...product, availability: 'sold' }, ctx);
		expect(card.sold).toBe(true);
		expect('price' in card).toBe(false);
	});

	it('refuses unknown enumeration values', () => {
		expect(() => toCard({ ...product, conditionGrade: '11' }, ctx)).toThrow();
		expect(() => toCard({ ...product, availability: 'gone' }, ctx)).toThrow();
	});
});

describe('manuals', () => {
	it('accepts https links and uploaded PDFs only', () => {
		const detail = (p: Partial<ResolvedProduct>) =>
			toDetail({ ...product, ...p }, [], ctx).manualUrl;
		expect(detail({ manualUrl: 'https://example.com/m.pdf' })).toBe('https://example.com/m.pdf');
		expect(detail({ manualFile: 'uploads/mc240.pdf' })).toBe('/b/uploads/mc240.pdf');
		expect(detail({ manualFile: 'uploads/../secret.pdf' })).toBeNull();
		expect(detail({ manualFile: 'uploads/x.exe' })).toBeNull();
		expect(detail({ manualUrl: 'http://example.com/m.pdf' })).toBeNull();
	});
});

describe('safeHttps', () => {
	it('allows only https', () => {
		expect(safeHttps('https://example.com/manual.pdf')).toBe('https://example.com/manual.pdf');
		expect(safeHttps('http://example.com')).toBeNull();
		expect(safeHttps('javascript:alert(1)')).toBeNull();
		expect(safeHttps('')).toBeNull();
	});
});

describe('toSettings', () => {
	it('drops invalid emails and non-https social links', () => {
		const s = toSettings(
			{
				shopName: ' ',
				email: 'not-an-email',
				social: [
					{ label: 'Insta', url: 'https://instagram.example/shop' },
					{ label: 'Bad', url: 'javascript:alert(1)' }
				]
			},
			ctx
		);
		expect(s.shopName).toBe('Rossweisse Audio');
		expect(s.email).toBeNull();
		expect(s.social).toEqual([{ label: 'Insta', url: 'https://instagram.example/shop' }]);
	});
});
