import { describe, expect, it } from 'vitest';
import { DEFAULT_SEARCH, type SearchState } from '#lib/search.ts';
import { buildProductFilters } from './strapi-query.ts';

const filters = (s: Partial<SearchState>) => buildProductFilters({ ...DEFAULT_SEARCH, ...s });

describe('buildProductFilters', () => {
	it('shows pieces for sale (on hold included) by default', () => {
		expect(filters({})).toEqual({ $and: [{ availability: { $ne: 'sold' } }] });
	});

	it('has no availability filter for "all", and only sold for the archive', () => {
		expect(filters({ availability: 'all' })).toBeUndefined();
		expect(filters({ availability: 'sold' })).toEqual({
			$and: [{ availability: { $eq: 'sold' } }]
		});
	});

	it('requires every search word, in any searchable field', () => {
		const and = filters({ q: 'marlowe amp' })!.$and as object[];
		expect(and).toHaveLength(3);
		expect(and[1]).toMatchObject({
			$or: expect.arrayContaining([{ title: { $containsi: 'marlowe' } }])
		});
		expect(and[2]).toMatchObject({
			$or: expect.arrayContaining([{ brand: { name: { $containsi: 'amp' } } }])
		});
	});

	it('translates facet keys to CMS values', () => {
		const and = filters({ newOrUsed: 'nos', voltage: '240v', technology: 'tube' })!.$and;
		expect(and).toEqual(
			expect.arrayContaining([
				{ newOrUsed: { $eq: 'new-old-stock' } },
				{ voltage: { $eq: 'intl-220-240v' } },
				{ technology: { $eq: 'tube' } }
			])
		);
	});

	it('filters relations by slug and applies prices only to pieces for sale', () => {
		expect(filters({ brand: 'kestrel', category: 'amplifiers', min: 100, max: 900 })!.$and).toEqual(
			expect.arrayContaining([
				{ brand: { slug: { $eq: 'kestrel' } } },
				{ category: { slug: { $eq: 'amplifiers' } } },
				{ price: { $gte: 100 } },
				{ price: { $lte: 900 } }
			])
		);
		const sold = filters({ availability: 'sold', min: 100 })!.$and;
		expect(JSON.stringify(sold)).not.toContain('price');
	});
});
