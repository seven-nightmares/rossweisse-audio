/**
 * Fixed value lists shared by products, filters and (in M2) the Strapi enumerations.
 * Keys are stored values; labels are what visitors see. Order here is display order.
 */

export const CONDITION_GRADES = {
	new: { label: 'New', short: 'New' },
	nos: { label: 'New old stock', short: 'NOS' },
	'10': { label: '10 · Mint', short: '10/10' },
	'9': { label: '9 · Excellent', short: '9/10' },
	'8': { label: '8 · Very good', short: '8/10' },
	'7': { label: '7 · Good', short: '7/10' },
	'6': { label: '6 · Fair', short: '6/10' },
	'5': { label: '5 · Average', short: '5/10' },
	'4': { label: '4 · Worn', short: '4/10' },
	'3': { label: '3 · Rough', short: '3/10' },
	'2': { label: '2 · Very rough', short: '2/10' },
	'1': { label: '1 · For parts only', short: '1/10' }
} as const;
export type ConditionGrade = keyof typeof CONDITION_GRADES;

export const NEW_OR_USED = {
	new: 'New',
	'pre-owned': 'Pre-owned',
	nos: 'New old stock'
} as const;
export type NewOrUsed = keyof typeof NEW_OR_USED;

export const ERAS = {
	vintage: 'Vintage',
	modern: 'Modern'
} as const;
export type Era = keyof typeof ERAS;

export const TECHNOLOGIES = {
	tube: 'Tube',
	'solid-state': 'Solid state',
	hybrid: 'Hybrid'
} as const;
export type Technology = keyof typeof TECHNOLOGIES;

export const VOLTAGES = {
	'120v': '120V (US)',
	'240v': '220–240V',
	switchable: 'Switchable'
} as const;
export type Voltage = keyof typeof VOLTAGES;

export const AVAILABILITY_STATUS = {
	available: 'Available',
	'on-hold': 'On hold',
	sold: 'Sold'
} as const;
export type AvailabilityStatus = keyof typeof AVAILABILITY_STATUS;

export function isKey<T extends object>(options: T, value: unknown): value is keyof T {
	return typeof value === 'string' && Object.hasOwn(options, value);
}
