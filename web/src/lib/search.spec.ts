import { describe, expect, it } from 'vitest';
import {
	DEFAULT_SEARCH,
	hasActiveFilters,
	parseSearch,
	searchHref,
	toSearchParams
} from './search.ts';

const parse = (qs: string, fixed = {}) => parseSearch(new URLSearchParams(qs), fixed);

describe('parseSearch', () => {
	it('returns defaults for an empty query', () => {
		expect(parse('')).toEqual(DEFAULT_SEARCH);
	});

	it('reads every known filter', () => {
		expect(
			parse(
				'q=tube+amp&category=amplifiers&brand=kestrel&condition=pre-owned&era=vintage&tech=tube&voltage=120v&min=100&max=5000&sort=price-asc&page=2'
			)
		).toEqual({
			q: 'tube amp',
			category: 'amplifiers',
			brand: 'kestrel',
			newOrUsed: 'pre-owned',
			era: 'vintage',
			technology: 'tube',
			voltage: '120v',
			min: 100,
			max: 5000,
			availability: 'available',
			sort: 'price-asc',
			page: 2
		});
	});

	it('drops invalid values instead of passing them on', () => {
		const s = parse(
			'category=Bad Slug&brand=../x&condition=used&era=future&tech=laser&voltage=9v&min=-5&max=abc&sort=random&page=0&availability=maybe'
		);
		expect(s).toEqual(DEFAULT_SEARCH);
	});

	it('cleans the search text', () => {
		expect(parse('q=%20%20mc%0A%0A240%20%20').q).toBe('mc 240');
		expect(parse(`q=${'x'.repeat(300)}`).q).toHaveLength(100);
	});

	it('swaps a reversed price range', () => {
		const s = parse('min=900&max=100');
		expect([s.min, s.max]).toEqual([100, 900]);
	});

	it('ignores price filters and price sorts when sold items are included', () => {
		const s = parse('availability=sold&min=1&max=2&sort=price-desc');
		expect(s).toMatchObject({ min: null, max: null, sort: 'newest' });
		expect(parse('availability=all&sort=name').sort).toBe('name');
	});

	it('lets the page fix values', () => {
		expect(parse('availability=all', { availability: 'sold' }).availability).toBe('sold');
	});
});

describe('toSearchParams / searchHref', () => {
	it('omits defaults, so the canonical URL is short', () => {
		expect(toSearchParams(DEFAULT_SEARCH).toString()).toBe('');
		expect(searchHref('/shop', DEFAULT_SEARCH)).toBe('/shop');
	});

	it('round-trips through parseSearch', () => {
		const qs = 'q=amp&brand=kestrel&condition=new&tech=tube&min=10&sort=name&page=3';
		const state = parse(qs);
		expect(parse(toSearchParams(state).toString())).toEqual(state);
	});

	it('leaves out fixed values', () => {
		const state = parse('', { availability: 'sold' });
		expect(searchHref('/sold', state, ['availability'])).toBe('/sold');
	});
});

describe('hasActiveFilters', () => {
	it('is false for defaults and true for any filter', () => {
		expect(hasActiveFilters(DEFAULT_SEARCH)).toBe(false);
		expect(hasActiveFilters(parse('voltage=240v'))).toBe(true);
		expect(hasActiveFilters(parse('availability=all'))).toBe(true);
		expect(hasActiveFilters(parse('', { availability: 'sold' }), { availability: 'sold' })).toBe(
			false
		);
	});
});
