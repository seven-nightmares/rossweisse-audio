import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONDITION_GRADES, NEW_OR_USED, VOLTAGES } from '#lib/facets.ts';
import { INQUIRY_TYPES } from '#lib/inquiry.ts';
import { GRADE_FROM_CMS, NEW_OR_USED_FROM_CMS, VOLTAGE_FROM_CMS } from './cms-values.ts';

/** The CMS schemas live in the sibling cms/ package; these tests keep both sides in sync. */
const cmsApi = path.resolve(import.meta.dirname, '../../../../cms/src/api');
const schema = (name: string) =>
	JSON.parse(
		fs.readFileSync(path.join(cmsApi, name, 'content-types', name, 'schema.json'), 'utf8')
	) as { attributes: Record<string, { enum?: string[] }> };

const product = schema('product').attributes;
const sorted = (values: Iterable<string>) => [...values].sort();

describe('CMS enumeration values', () => {
	it('maps every condition grade both ways', () => {
		expect(sorted(product.conditionGrade.enum!)).toEqual(sorted(Object.keys(GRADE_FROM_CMS)));
		expect(sorted(Object.values(GRADE_FROM_CMS))).toEqual(sorted(Object.keys(CONDITION_GRADES)));
	});

	it('maps new/used and voltage both ways', () => {
		expect(sorted(product.newOrUsed.enum!)).toEqual(sorted(Object.keys(NEW_OR_USED_FROM_CMS)));
		expect(sorted(Object.values(NEW_OR_USED_FROM_CMS))).toEqual(sorted(Object.keys(NEW_OR_USED)));
		expect(sorted(product.voltage.enum!)).toEqual(sorted(Object.keys(VOLTAGE_FROM_CMS)));
		expect(sorted(Object.values(VOLTAGE_FROM_CMS))).toEqual(sorted(Object.keys(VOLTAGES)));
	});

	it('uses the storefront keys directly where Strapi allows them', () => {
		expect(sorted(product.availability.enum!)).toEqual(['available', 'on-hold', 'sold']);
		expect(sorted(product.era.enum!)).toEqual(['modern', 'vintage']);
		expect(sorted(product.technology.enum!)).toEqual(['hybrid', 'solid-state', 'tube']);
		expect(sorted(schema('inquiry').attributes.type.enum!)).toEqual(
			sorted(Object.keys(INQUIRY_TYPES))
		);
	});

	it('only uses values Strapi accepts (no leading digit)', () => {
		for (const attr of Object.values(product)) {
			for (const value of attr.enum ?? []) expect(value).toMatch(/^[a-z][a-z0-9-]*$/);
		}
	});
});
