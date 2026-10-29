/**
 * The CMS stores enumeration values staff can read (and that Strapi accepts: no leading digit),
 * e.g. "grade-10-mint". These tables translate them to the storefront's facet keys and back.
 * cms/scripts/seed.js holds the reverse mapping for seeding; cms-values.spec.ts keeps both in sync
 * with the Strapi schema.
 */
import type { ConditionGrade, NewOrUsed, Voltage } from '#lib/facets.ts';

export const GRADE_FROM_CMS: Record<string, ConditionGrade> = {
	new: 'new',
	'new-old-stock': 'nos',
	'grade-10-mint': '10',
	'grade-9-excellent': '9',
	'grade-8-very-good': '8',
	'grade-7-good': '7',
	'grade-6-fair': '6',
	'grade-5-average': '5',
	'grade-4-worn': '4',
	'grade-3-rough': '3',
	'grade-2-very-rough': '2',
	'grade-1-for-parts': '1'
};

export const NEW_OR_USED_FROM_CMS: Record<string, NewOrUsed> = {
	new: 'new',
	'pre-owned': 'pre-owned',
	'new-old-stock': 'nos'
};

export const VOLTAGE_FROM_CMS: Record<string, Voltage> = {
	'us-120v': '120v',
	'intl-220-240v': '240v',
	switchable: 'switchable'
};

const invert = <K extends string>(map: Record<string, K>) =>
	Object.fromEntries(Object.entries(map).map(([cms, key]) => [key, cms])) as Record<K, string>;

export const NEW_OR_USED_TO_CMS = invert(NEW_OR_USED_FROM_CMS);
export const VOLTAGE_TO_CMS = invert(VOLTAGE_FROM_CMS);
