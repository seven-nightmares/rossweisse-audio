/**
 * Shop search state <-> URL parameters. Values that fail validation are dropped,
 * so only clean, known values ever reach a catalog query.
 */
import {
	ERAS,
	NEW_OR_USED,
	TECHNOLOGIES,
	VOLTAGES,
	type Era,
	type NewOrUsed,
	type Technology,
	type Voltage
} from './facets.ts';

export const PAGE_SIZE = 24;

export const SORTS = {
	newest: 'Just arrived',
	'price-asc': 'Price: low to high',
	'price-desc': 'Price: high to low',
	name: 'Name: A–Z'
} as const;
export type Sort = keyof typeof SORTS;

/** "available" includes pieces on hold: they are not sold yet. */
export const AVAILABILITY = {
	available: 'For sale',
	sold: 'Sold',
	all: 'For sale & sold'
} as const;
export type Availability = keyof typeof AVAILABILITY;

export interface SearchState {
	q: string;
	category: string | null;
	brand: string | null;
	newOrUsed: NewOrUsed | null;
	era: Era | null;
	technology: Technology | null;
	voltage: Voltage | null;
	/** whole dollars */
	min: number | null;
	/** whole dollars */
	max: number | null;
	availability: Availability;
	sort: Sort;
	page: number;
}

export const DEFAULT_SEARCH: SearchState = {
	q: '',
	category: null,
	brand: null,
	newOrUsed: null,
	era: null,
	technology: null,
	voltage: null,
	min: null,
	max: null,
	availability: 'available',
	sort: 'newest',
	page: 1
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_DOLLARS = 10_000_000;

function slug(value: string | null): string | null {
	return value && value.length <= 60 && SLUG.test(value) ? value : null;
}

function dollars(value: string | null): number | null {
	if (!value || !/^\d{1,8}$/.test(value.trim())) return null;
	const n = Number(value.trim());
	return n <= MAX_DOLLARS ? n : null;
}

function oneOf<T extends string>(
	value: string | null,
	options: Record<T, unknown>,
	fallback: T
): T {
	return value !== null && Object.hasOwn(options, value) ? (value as T) : fallback;
}

function maybeOneOf<T extends string>(value: string | null, options: Record<T, unknown>): T | null {
	return value !== null && Object.hasOwn(options, value) ? (value as T) : null;
}

/** Price filters and price sorting only apply to pieces for sale (sold prices are never shown). */
export function pricesApply(state: Pick<SearchState, 'availability'>): boolean {
	return state.availability === 'available';
}

export function parseSearch(
	params: URLSearchParams,
	fixed: Partial<SearchState> = {}
): SearchState {
	const q = (params.get('q') ?? '')
		// eslint-disable-next-line no-control-regex
		.replace(/[\u0000-\u001f\u007f]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 100);

	const pageRaw = params.get('page');
	const page = pageRaw && /^\d{1,4}$/.test(pageRaw) && Number(pageRaw) >= 1 ? Number(pageRaw) : 1;

	const state: SearchState = {
		q,
		category: slug(params.get('category')),
		brand: slug(params.get('brand')),
		newOrUsed: maybeOneOf(params.get('condition'), NEW_OR_USED),
		era: maybeOneOf(params.get('era'), ERAS),
		technology: maybeOneOf(params.get('tech'), TECHNOLOGIES),
		voltage: maybeOneOf(params.get('voltage'), VOLTAGES),
		min: dollars(params.get('min')),
		max: dollars(params.get('max')),
		availability: oneOf(params.get('availability'), AVAILABILITY, 'available'),
		sort: oneOf(params.get('sort'), SORTS, 'newest'),
		page,
		...fixed
	};

	if (state.min !== null && state.max !== null && state.min > state.max) {
		[state.min, state.max] = [state.max, state.min];
	}
	if (!pricesApply(state)) {
		state.min = null;
		state.max = null;
		if (state.sort === 'price-asc' || state.sort === 'price-desc') state.sort = 'newest';
	}
	return state;
}

/** Canonical, shareable query string for a search state (defaults omitted). */
export function toSearchParams(
	state: SearchState,
	omit: (keyof SearchState)[] = []
): URLSearchParams {
	const p = new URLSearchParams();
	const keep = (k: keyof SearchState) => !omit.includes(k);
	if (state.q && keep('q')) p.set('q', state.q);
	if (state.category && keep('category')) p.set('category', state.category);
	if (state.brand && keep('brand')) p.set('brand', state.brand);
	if (state.newOrUsed && keep('newOrUsed')) p.set('condition', state.newOrUsed);
	if (state.era && keep('era')) p.set('era', state.era);
	if (state.technology && keep('technology')) p.set('tech', state.technology);
	if (state.voltage && keep('voltage')) p.set('voltage', state.voltage);
	if (state.min !== null && keep('min')) p.set('min', String(state.min));
	if (state.max !== null && keep('max')) p.set('max', String(state.max));
	if (state.availability !== 'available' && keep('availability'))
		p.set('availability', state.availability);
	if (state.sort !== 'newest' && keep('sort')) p.set('sort', state.sort);
	if (state.page > 1 && keep('page')) p.set('page', String(state.page));
	return p;
}

export function searchHref(path: string, state: SearchState, omit: (keyof SearchState)[] = []) {
	const qs = toSearchParams(state, omit).toString();
	return qs ? `${path}?${qs}` : path;
}

export function hasActiveFilters(state: SearchState, fixed: Partial<SearchState> = {}): boolean {
	return (
		state.q !== '' ||
		state.category !== null ||
		state.brand !== null ||
		state.newOrUsed !== null ||
		state.era !== null ||
		state.technology !== null ||
		state.voltage !== null ||
		state.min !== null ||
		state.max !== null ||
		(!('availability' in fixed) && state.availability !== 'available')
	);
}

/** Reads the filter form into a search state (page resets to 1). */
export function searchFromForm(form: FormData, fixed: Partial<SearchState> = {}): SearchState {
	const params = new URLSearchParams();
	for (const [key, value] of form) {
		if (key !== 'page' && typeof value === 'string') params.append(key, value);
	}
	return parseSearch(params, fixed);
}
