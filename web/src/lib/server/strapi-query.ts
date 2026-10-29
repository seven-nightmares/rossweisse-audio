/** Strapi REST filters for catalog searches. Pure, so it is unit-tested without a server. */
import { NEW_OR_USED_TO_CMS, VOLTAGE_TO_CMS } from '#lib/catalog/cms-values.ts';
import { pricesApply, type SearchState } from '#lib/search.ts';
import type { QueryObject } from './strapi.ts';

export const FOR_SALE = { availability: { $ne: 'sold' } };

export function buildProductFilters(s: SearchState): QueryObject | undefined {
	const and: QueryObject[] = [];
	if (s.availability === 'available') and.push(FOR_SALE);
	if (s.availability === 'sold') and.push({ availability: { $eq: 'sold' } });
	for (const word of s.q.split(' ').filter(Boolean)) {
		and.push({
			$or: [
				{ title: { $containsi: word } },
				{ summary: { $containsi: word } },
				{ sku: { $containsi: word } },
				{ modelNumber: { $containsi: word } },
				{ brand: { name: { $containsi: word } } },
				{ category: { name: { $containsi: word } } }
			]
		});
	}
	if (s.category) and.push({ category: { slug: { $eq: s.category } } });
	if (s.brand) and.push({ brand: { slug: { $eq: s.brand } } });
	if (s.newOrUsed) and.push({ newOrUsed: { $eq: NEW_OR_USED_TO_CMS[s.newOrUsed] } });
	if (s.era) and.push({ era: { $eq: s.era } });
	if (s.technology) and.push({ technology: { $eq: s.technology } });
	if (s.voltage) and.push({ voltage: { $eq: VOLTAGE_TO_CMS[s.voltage] } });
	if (pricesApply(s)) {
		if (s.min !== null) and.push({ price: { $gte: s.min } });
		if (s.max !== null) and.push({ price: { $lte: s.max } });
	}
	return and.length ? { $and: and } : undefined;
}
