<script lang="ts">
	// `path` is already resolve()d by the page; these hrefs only append a query string.
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { goto } from '$app/navigation';
	import { ERAS, NEW_OR_USED, TECHNOLOGIES, VOLTAGES } from '#lib/facets.ts';
	import {
		AVAILABILITY,
		PAGE_SIZE,
		SORTS,
		hasActiveFilters,
		pricesApply,
		searchFromForm,
		searchHref,
		type SearchState
	} from '#lib/search.ts';
	import type { SearchResult, Taxonomies } from '#lib/types.ts';
	import Pagination from './Pagination.svelte';
	import ProductGrid from './ProductGrid.svelte';

	interface Props {
		/** Resolved route path, e.g. resolve('/shop'). */
		path: string;
		state: SearchState;
		result: SearchResult;
		taxonomies: Taxonomies;
		/** Search values fixed by the page (e.g. the sold archive); hidden from the form and URL. */
		fixed?: Partial<SearchState>;
	}

	// `state` is aliased: the name would clash with the $state rune.
	let { path, state: search, result, taxonomies, fixed = {} }: Props = $props();

	const omit = $derived(Object.keys(fixed) as (keyof SearchState)[]);
	const showAvailability = $derived(!('availability' in fixed));
	const showPrices = $derived(pricesApply(search));
	const filtered = $derived(hasActiveFilters(search, fixed));
	const first = $derived(result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1);
	const last = $derived(Math.min(result.page * PAGE_SIZE, result.total));
	const plural = (n: number) => `${n} ${n === 1 ? 'piece' : 'pieces'}`;
	const sorts = $derived(
		Object.entries(SORTS).filter(([v]) => showPrices || !v.startsWith('price'))
	);

	/** Radio filter groups; `name` is the URL parameter, "" means any. */
	const groups = $derived([
		{
			name: 'category',
			label: 'Type',
			options: taxonomies.categories.map((c) => [c.slug, c.name]),
			value: search.category
		},
		{
			name: 'brand',
			label: 'Brand',
			options: taxonomies.brands.map((b) => [b.slug, b.name]),
			value: search.brand
		},
		{
			name: 'condition',
			label: 'New or pre-owned',
			options: Object.entries(NEW_OR_USED),
			value: search.newOrUsed
		},
		{ name: 'era', label: 'Era', options: Object.entries(ERAS), value: search.era },
		{
			name: 'tech',
			label: 'Technology',
			options: Object.entries(TECHNOLOGIES),
			value: search.technology
		},
		{ name: 'voltage', label: 'Voltage', options: Object.entries(VOLTAGES), value: search.voltage }
	]);

	/** Quick price bands (whole dollars). */
	const BANDS: { label: string; min: number | null; max: number | null }[] = [
		{ label: 'Under $1,000', min: null, max: 1000 },
		{ label: '$1,000 – $2,500', min: 1000, max: 2500 },
		{ label: '$2,500 – $5,000', min: 2500, max: 5000 },
		{ label: '$5,000 and up', min: 5000, max: null }
	];
	const bandHref = (b: (typeof BANDS)[number]) =>
		searchHref(path, { ...search, min: b.min, max: b.max, page: 1 }, omit);
	const bandActive = (b: (typeof BANDS)[number]) => search.min === b.min && search.max === b.max;

	let form: HTMLFormElement;
	let showFilters = $state(false);

	/** Navigate to the clean, canonical URL for the form's values (page resets to 1). */
	function submit(event?: SubmitEvent) {
		event?.preventDefault();
		const next = searchFromForm(new FormData(form), fixed);
		// Keep scroll and focus on the filter the visitor just changed.
		goto(searchHref(path, next, omit), { reset: false });
	}
</script>

<div class="toolbar">
	<button
		class="filters-toggle caps"
		type="button"
		aria-expanded={showFilters}
		aria-controls="catalog-filters"
		onclick={() => (showFilters = !showFilters)}
	>
		Filters{#if filtered}<span class="dot" aria-label="(active)"></span>{/if}
	</button>
	<h2 id="results-heading" class="count caps" aria-live="polite">
		{#if result.total === 0}
			No pieces found
		{:else if result.pageCount > 1}
			<span class="range">{first}–{last} of</span>
			{plural(result.total)}
		{:else}
			{plural(result.total)}
		{/if}
	</h2>
	<div class="sort">
		<label class="caps" for="sort">Sort</label>
		<select id="sort" name="sort" form="catalog-filters" onchange={() => submit()}>
			{#each sorts as [value, label] (value)}
				<option {value} selected={search.sort === value}>{label}</option>
			{/each}
		</select>
	</div>
</div>

<div class="catalog">
	<form
		bind:this={form}
		id="catalog-filters"
		class="filters"
		class:open={showFilters}
		method="GET"
		action={path}
		role="search"
		aria-label="Search and filter"
		onsubmit={submit}
	>
		<div class="search">
			<label class="caps" for="q">Search</label>
			<div class="search-row">
				<input
					id="q"
					name="q"
					type="search"
					value={search.q}
					maxlength="100"
					placeholder="Brand, model or type"
					autocomplete="off"
				/>
				<button class="btn small" type="submit">Go</button>
			</div>
		</div>

		{#if filtered}
			<a class="clear caps" href={path}>Clear all filters</a>
		{/if}

		{#if showAvailability}
			<details class="group" open>
				<summary class="caps">Availability</summary>
				<fieldset>
					<legend class="visually-hidden">Availability</legend>
					{#each Object.entries(AVAILABILITY) as [value, label] (value)}
						<label class="option">
							<input
								type="radio"
								name="availability"
								{value}
								checked={search.availability === value}
								onchange={() => submit()}
							/>
							{label}
						</label>
					{/each}
				</fieldset>
			</details>
		{/if}

		{#if showPrices}
			<details class="group" open>
				<summary class="caps">Price</summary>
				<ul class="bands">
					{#each BANDS as b (b.label)}
						<li>
							<a href={bandHref(b)} aria-current={bandActive(b) ? 'true' : undefined}>{b.label}</a>
						</li>
					{/each}
				</ul>
				<fieldset class="price-row">
					<legend class="visually-hidden">Custom price range (USD)</legend>
					<label>
						<span class="visually-hidden">Minimum price in dollars</span>
						<input
							type="number"
							name="min"
							inputmode="numeric"
							min="0"
							step="1"
							placeholder="$ Min"
							value={search.min ?? ''}
						/>
					</label>
					<span aria-hidden="true">–</span>
					<label>
						<span class="visually-hidden">Maximum price in dollars</span>
						<input
							type="number"
							name="max"
							inputmode="numeric"
							min="0"
							step="1"
							placeholder="$ Max"
							value={search.max ?? ''}
						/>
					</label>
					<button class="btn secondary small" type="submit">Set</button>
				</fieldset>
			</details>
		{/if}

		{#each groups as g (g.name)}
			<details class="group" open={g.value !== null || g.name === 'category' || g.name === 'brand'}>
				<summary class="caps">{g.label}</summary>
				<fieldset>
					<legend class="visually-hidden">{g.label}</legend>
					<label class="option">
						<input
							type="radio"
							name={g.name}
							value=""
							checked={!g.value}
							onchange={() => submit()}
						/>
						All
					</label>
					{#each g.options as [value, label] (value)}
						<label class="option">
							<input
								type="radio"
								name={g.name}
								{value}
								checked={g.value === value}
								onchange={() => submit()}
							/>
							{label}
						</label>
					{/each}
				</fieldset>
			</details>
		{/each}

		<noscript><button class="btn small" type="submit">Apply filters</button></noscript>
	</form>

	<section class="results" aria-labelledby="results-heading">
		{#if result.items.length}
			<ProductGrid products={result.items} label="Results" />
			<Pagination {path} state={search} page={result.page} pageCount={result.pageCount} {omit} />
		{:else}
			<div class="empty">
				{#if filtered}
					<p>Nothing matches those filters right now. Try loosening one or two.</p>
					<a class="btn secondary" href={path}>Clear all filters</a>
				{:else}
					<p>There’s nothing here right now. New pieces arrive every week, so check back soon.</p>
				{/if}
			</div>
		{/if}
	</section>
</div>

<style>
	.toolbar {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 1rem;
		min-height: 56px;
		margin-bottom: 2rem;
		border-block: 1px solid var(--line);
	}
	.filters-toggle {
		justify-self: start;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 44px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--text);
		font-size: 0.72rem;
		cursor: pointer;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent);
	}
	.count {
		margin: 0;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-muted);
		text-align: center;
	}
	@media (max-width: 599px) {
		.range {
			display: none;
		}
	}
	.sort {
		justify-self: end;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.sort label {
		font-size: 0.7rem;
		color: var(--text-muted);
	}
	.sort select {
		width: auto;
		min-height: 40px;
		border-color: transparent;
		background: transparent;
		padding-inline: 0.25rem;
	}

	.catalog {
		display: grid;
		gap: 2.5rem;
		grid-template-columns: 1fr;
		align-items: start;
	}
	.filters {
		display: none;
		gap: 0;
	}
	.filters.open {
		display: grid;
	}
	@media (min-width: 900px) {
		.catalog {
			grid-template-columns: 250px 1fr;
		}
		.filters {
			display: grid;
			position: sticky;
			top: 140px;
			max-height: calc(100vh - 160px);
			overflow-y: auto;
			padding-right: 0.5rem;
		}
		.filters-toggle {
			visibility: hidden;
		}
	}
	.search {
		padding-bottom: 1.25rem;
	}
	.search label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.7rem;
		color: var(--text-muted);
	}
	.search-row {
		display: flex;
		gap: 0.5rem;
	}
	.clear {
		margin-bottom: 1rem;
		font-size: 0.7rem;
	}
	.group {
		border-top: 1px solid var(--line);
	}
	.group summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 48px;
		font-size: 0.7rem;
		cursor: pointer;
		list-style: none;
	}
	.group summary::-webkit-details-marker {
		display: none;
	}
	.group summary::after {
		content: '+';
		font-size: 1rem;
		font-weight: 300;
	}
	.group[open] summary::after {
		content: '–';
	}
	fieldset {
		display: grid;
		gap: 0.1rem;
		margin: 0 0 1rem;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	.option {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 34px;
		font-size: 0.92rem;
		cursor: pointer;
	}
	.bands {
		list-style: none;
		margin: 0 0 0.75rem;
		padding: 0;
		display: grid;
		gap: 0.1rem;
	}
	.bands a {
		display: block;
		padding: 0.35rem 0;
		color: var(--text);
		font-size: 0.92rem;
		text-decoration: none;
	}
	.bands a:hover,
	.bands a[aria-current] {
		color: var(--accent);
		text-decoration: underline;
	}
	.price-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.price-row label {
		flex: 1;
	}
	.price-row input {
		min-height: 40px;
		padding-inline: 0.5rem;
	}
	.empty {
		display: grid;
		justify-items: center;
		text-align: center;
		gap: 0.75rem;
		padding: 4rem 1rem;
		border: 1px solid var(--line);
		color: var(--text-muted);
	}
</style>
