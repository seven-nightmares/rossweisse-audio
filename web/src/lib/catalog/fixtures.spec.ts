import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import content from '#lib/demo/content.json';
import { DEFAULT_SEARCH, PAGE_SIZE, type SearchState } from '#lib/search.ts';
import { createFixtureCatalog } from './fixtures.ts';
import { isPresentable } from './present.ts';
import type { RawContent, RawProduct } from './raw.ts';

const raw = content as RawContent;
const catalog = createFixtureCatalog(raw, { asset: (p) => `/base/${p}` });
const search = (s: Partial<SearchState>) => catalog.searchProducts({ ...DEFAULT_SEARCH, ...s });

describe('demo content integrity', () => {
	it('has valid field values for every product', () => {
		const invalid = raw.products.filter((p) => !isPresentable(p)).map((p) => p.sku);
		expect(invalid).toEqual([]);
	});

	it('has unique SKUs and slugs', () => {
		const skus = raw.products.map((p) => p.sku);
		const slugs = raw.products.map((p) => p.slug);
		expect(new Set(skus).size).toBe(skus.length);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('only references existing brands, categories and products', () => {
		const brands = new Set(raw.brands.map((b) => b.slug));
		const categories = new Set(raw.categories.map((c) => c.slug));
		const skus = new Set(raw.products.map((p) => p.sku));
		for (const p of raw.products) {
			expect(brands.has(p.brand ?? ''), `${p.sku} brand`).toBe(true);
			expect(categories.has(p.category ?? ''), `${p.sku} category`).toBe(true);
			for (const r of p.recommendedWith ?? []) expect(skus.has(r), `${p.sku} → ${r}`).toBe(true);
		}
	});

	it('has an image file for every photo', () => {
		const staticDir = path.resolve(import.meta.dirname, '../../../static');
		const urls = [
			...raw.products.flatMap((p: RawProduct) => (p.photos ?? []).map((m) => m.url)),
			...raw.categories.map((c) => c.image?.url ?? ''),
			raw.siteSettings.heroImage?.url ?? ''
		];
		const missing = urls.filter((u) => !fs.existsSync(path.join(staticDir, u)));
		expect(missing).toEqual([]);
	});

	it('includes the info pages the storefront links to', () => {
		const slugs = raw.infoPages.map((p) => p.slug);
		for (const s of ['rating-scale', 'testing-process', 'warranty', 'contact', 'consignment']) {
			expect(slugs).toContain(s);
		}
	});
});

describe('searchProducts', () => {
	it('lists pieces for sale by default (on hold included, sold excluded)', async () => {
		const r = await search({});
		const statuses = new Set(r.items.map((p) => p.status));
		expect(statuses.has('sold')).toBe(false);
		expect(statuses.has('on-hold')).toBe(true);
		expect(r.total).toBe(raw.products.filter((p) => p.availability !== 'sold').length);
	});

	it('lists only sold pieces in the archive, without prices', async () => {
		const r = await search({ availability: 'sold' });
		expect(r.total).toBeGreaterThan(0);
		for (const p of r.items) {
			expect(p.sold).toBe(true);
			expect('price' in p).toBe(false);
		}
	});

	it('filters by brand, category and facets', async () => {
		const r = await search({ brand: 'kestrel', category: 'amplifiers' });
		expect(r.items.length).toBeGreaterThan(0);
		for (const p of r.items) {
			expect(p.brand?.slug).toBe('kestrel');
			expect(p.category?.slug).toBe('amplifiers');
		}
		const tubes = await search({ technology: 'tube', era: 'vintage' });
		expect(tubes.items.every((p) => p.technology === 'tube' && p.era === 'vintage')).toBe(true);
		const intl = await search({ voltage: '240v' });
		expect(intl.items.map((p) => p.sku)).toEqual(['RA-1009']);
	});

	it('matches every search word across title, brand and model', async () => {
		const r = await search({ q: 'marlowe preamp' });
		expect(r.items.map((p) => p.sku)).toEqual(['RA-1011']);
		expect((await search({ q: 'MF-40' })).items.map((p) => p.sku)).toContain('RA-1001');
		expect((await search({ q: 'zzzz' })).total).toBe(0);
	});

	it('applies the price range', async () => {
		const r = await search({ min: 1000, max: 2000 });
		expect(r.items.every((p) => !p.sold && p.price >= 1000 && p.price <= 2000)).toBe(true);
	});

	it('sorts by newest, price and name', async () => {
		const newest = (await search({})).items.map((p) => p.arrivedOn);
		expect(newest).toEqual([...newest].sort().reverse());
		const prices = (await search({ sort: 'price-asc' })).items.map((p) => (p.sold ? 0 : p.price));
		expect(prices).toEqual([...prices].sort((a, b) => a - b));
		const names = (await search({ sort: 'name' })).items.map((p) => p.title);
		expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
	});

	it('paginates', async () => {
		const all = await search({ availability: 'all' });
		expect(all.pageCount).toBe(Math.ceil(all.total / PAGE_SIZE));
		const page2 = await search({ availability: 'all', page: 2 });
		expect(page2.items.length).toBe(all.total - PAGE_SIZE);
		expect((await search({ page: 99 })).items).toEqual([]);
	});

	it('prefixes media URLs through the asset helper', async () => {
		const [first] = (await search({})).items;
		expect(first.image?.src).toMatch(/^\/base\/demo\/products\/.+\.svg$/);
	});
});

describe('product details', () => {
	it('returns null for an unknown slug', async () => {
		expect(await catalog.getProduct('nope')).toBeNull();
	});

	it('strips the price from sold pieces', async () => {
		const sold = raw.products.find((p) => p.availability === 'sold')!;
		const d = await catalog.getProduct(sold.slug);
		expect(d?.sold).toBe(true);
		expect(d && 'price' in d).toBe(false);
	});

	it('recommends only pieces for sale', async () => {
		for (const p of raw.products) {
			const d = await catalog.getProduct(p.slug);
			expect(d?.recommended.every((r) => !r.sold && r.sku !== p.sku)).toBe(true);
		}
	});

	it('offers only pieces for sale in the inquiry picker', async () => {
		const options = await catalog.productOptions();
		const sold = new Set(raw.products.filter((p) => p.availability === 'sold').map((p) => p.sku));
		expect(options.some((o) => sold.has(o.sku))).toBe(false);
	});
});
