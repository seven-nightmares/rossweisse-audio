<script lang="ts">
	import { resolve } from '$app/paths';
	import Blocks from '#lib/components/Blocks.svelte';
	import Gallery from '#lib/components/Gallery.svelte';
	import ProductGrid from '#lib/components/ProductGrid.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { CONDITION_GRADES, ERAS, NEW_OR_USED, TECHNOLOGIES, VOLTAGES } from '#lib/facets.ts';
	import { formatPrice } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const p = $derived(data.product);

	/** "About this piece": fixed labels in a fixed order. Empty rows are skipped. */
	const details = $derived(
		[
			['Brand', p.brand?.name],
			['Model', p.modelNumber],
			['Type', p.category?.name],
			['New or pre-owned', NEW_OR_USED[p.newOrUsed]],
			['Era', ERAS[p.era]],
			['Years made', p.yearsInProduction],
			['Technology', p.technology ? TECHNOLOGIES[p.technology] : null],
			['Voltage', p.voltage ? VOLTAGES[p.voltage] : null],
			['Dimensions', p.dimensions],
			['Weight', p.weight],
			['Condition', CONDITION_GRADES[p.conditionGrade].label],
			['Included', p.includedItems],
			['Reference number', p.sku]
		].filter((f): f is [string, string] => Boolean(f[1]))
	);

	const story = $derived(
		[
			['Working condition', p.workingCondition],
			['Cosmetic notes', p.cosmeticNotes],
			['Service notes', p.serviceNotes],
			['Tube notes', p.tubeNotes],
			['Ownership', p.ownershipHistory],
			['Sound', p.soundCharacter],
			['Connections', p.connections]
		].filter((f): f is [string, string] => Boolean(f[1]))
	);

	const inquire = $derived(resolve(`/inquire?product=${p.sku}`));
</script>

<Seo title={p.title} description={p.summary} image={p.photos[0]?.src} />

<div class="wrap">
	<nav class="crumbs caps" aria-label="Breadcrumb">
		<ol>
			<li><a href={resolve('/shop')}>Shop</a></li>
			{#if p.category}
				<li><a href={resolve(`/shop?category=${p.category.slug}`)}>{p.category.name}</a></li>
			{/if}
			<li aria-current="page">{p.title}</li>
		</ol>
	</nav>

	<div class="top">
		<Gallery photos={p.photos} title={p.title} />

		<div class="buy">
			{#if p.brand}
				<p class="brand caps">
					<a href={resolve(`/shop?brand=${p.brand.slug}`)}>{p.brand.name}</a>
				</p>
			{/if}
			<h1>{p.title}</h1>

			<div class="price-row">
				{#if p.sold}
					<StatusBadge status="sold" />
				{:else}
					<p class="price num">{formatPrice(p.price)}</p>
					{#if p.status === 'on-hold'}<StatusBadge status="on-hold" />{/if}
				{/if}
			</div>

			<p class="summary">{p.summary}</p>

			<p class="grade">
				<span class="caps">Condition</span>
				<a href={resolve('/info/[slug]', { slug: 'rating-scale' })}>
					{CONDITION_GRADES[p.conditionGrade].label}
					<span class="visually-hidden">(how we grade)</span>
				</a>
				{#if p.rare}<span class="badge plain">Rare</span>{/if}
			</p>

			{#if p.sold}
				<p class="note">
					This piece has sold. Want one like it? We often hear about gear before it’s listed.
				</p>
				<div class="actions">
					<a class="btn" href={resolve('/concierge')}>Ask us to find one</a>
				</div>
			{:else}
				{#if p.status === 'on-hold'}
					<p class="note">
						Someone has this piece on hold. Ask to be next in line in case their plans change.
					</p>
				{/if}
				<div class="actions">
					<a class="btn" href={inquire}>Ask about this piece</a>
					<a class="btn secondary" href={inquire}>Request more photos</a>
				</div>
				{#if p.localPickupOnly || p.shippingNote}
					<p class="ship">
						{#if p.localPickupOnly}<strong>Local pickup or freight only.</strong>{/if}
						{p.shippingNote ?? ''}
					</p>
				{/if}
			{/if}

			<ul class="promise">
				<li>
					<a href={resolve('/info/[slug]', { slug: 'testing-process' })}
						>Bench and listening tested</a
					>
				</li>
				<li><a href={resolve('/info/[slug]', { slug: 'warranty' })}>90-day warranty</a></li>
				<li>
					<a href={resolve('/info/[slug]', { slug: 'shipping-and-pickup' })}
						>Insured shipping or pickup</a
					>
				</li>
			</ul>
		</div>
	</div>

	<div class="body">
		<section class="block" aria-labelledby="about">
			<h2 id="about" class="caps">About this piece</h2>
			<div class="block-body">
				{#if p.description.length}<Blocks blocks={p.description} />{/if}
				<dl class="details">
					{#each details as [k, v] (k)}
						<div>
							<dt>{k}</dt>
							<dd>{v}</dd>
						</div>
					{/each}
				</dl>
			</div>
		</section>

		{#if story.length}
			<section class="block" aria-labelledby="condition">
				<h2 id="condition" class="caps">Condition &amp; service</h2>
				<div class="block-body">
					<dl class="details stacked">
						{#each story as [k, v] (k)}
							<div>
								<dt>{k}</dt>
								<dd>{v}</dd>
							</div>
						{/each}
					</dl>
					<p class="more">
						<a href={resolve('/info/[slug]', { slug: 'testing-process' })}
							>How we test every piece</a
						>
						·
						<a href={resolve('/info/[slug]', { slug: 'rating-scale' })}>Our rating scale</a>
					</p>
				</div>
			</section>
		{/if}

		{#if p.specs.length || p.manualUrl}
			<section class="block" aria-labelledby="specs">
				<h2 id="specs" class="caps">Specifications</h2>
				<div class="block-body">
					{#if p.specs.length}
						<table class="spec-table">
							<tbody>
								{#each p.specs as s (s.label)}
									<tr><th scope="row">{s.label}</th><td>{s.value}</td></tr>
								{/each}
							</tbody>
						</table>
					{/if}
					{#if p.manualUrl}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external, https-validated -->
						<p class="more"><a href={p.manualUrl} rel="noopener noreferrer">Owner’s manual</a></p>
					{/if}
				</div>
			</section>
		{/if}
	</div>

	{#if p.recommended.length}
		<section class="related" aria-labelledby="related">
			<h2 id="related">You might also like</h2>
			<ProductGrid products={p.recommended} />
		</section>
	{/if}
</div>

<style>
	.crumbs ol {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		list-style: none;
		margin: 0;
		padding: 1.5rem 0 1.75rem;
		font-size: 0.66rem;
		color: var(--text-muted);
	}
	.crumbs a {
		color: var(--text-muted);
		text-decoration: none;
	}
	.crumbs a:hover {
		color: var(--text);
	}
	.crumbs li + li::before {
		content: '/';
		margin-right: 0.5rem;
	}
	.crumbs [aria-current] {
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 40ch;
	}
	.top {
		display: grid;
		gap: 2.5rem;
		align-items: start;
	}
	@media (min-width: 1000px) {
		.top {
			grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
			gap: 4rem;
		}
		.buy {
			position: sticky;
			top: 140px;
		}
	}
	.buy {
		display: grid;
		gap: 1.1rem;
		align-content: start;
	}
	.brand {
		margin: 0;
		font-size: 0.7rem;
	}
	.brand a {
		color: var(--text-muted);
		text-decoration: none;
	}
	.brand a:hover {
		color: var(--text);
	}
	.buy h1 {
		margin: 0;
		font-size: clamp(1.9rem, 3.4vw, 2.7rem);
	}
	.price-row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}
	.price {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 500;
		letter-spacing: 0.04em;
	}
	.summary {
		margin: 0;
		color: var(--text-muted);
		font-size: 1.02rem;
	}
	.grade {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin: 0;
		padding-block: 0.9rem;
		border-block: 1px solid var(--line);
	}
	.grade .caps {
		font-size: 0.66rem;
		color: var(--text-muted);
	}
	.note {
		margin: 0;
		padding: 0.8rem 1rem;
		border-left: 2px solid var(--warn);
		background: var(--surface-2);
		color: var(--text-muted);
	}
	.actions {
		display: grid;
		gap: 0.6rem;
	}
	.ship {
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-muted);
	}
	.promise {
		list-style: none;
		margin: 0.25rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.4rem;
		font-size: 0.88rem;
	}
	.promise li::before {
		content: '✓';
		margin-right: 0.55rem;
		color: var(--accent);
	}
	.promise a {
		color: var(--text-muted);
	}

	.body {
		margin-top: clamp(3.5rem, 7vw, 5.5rem);
		border-top: 1px solid var(--line);
	}
	.block {
		display: grid;
		gap: 1.25rem;
		padding-block: 2.5rem;
		border-bottom: 1px solid var(--line);
	}
	@media (min-width: 900px) {
		.block {
			grid-template-columns: 260px minmax(0, 1fr);
			gap: 3rem;
		}
	}
	.block h2 {
		margin: 0;
		font-family: var(--font-sans);
		font-size: 0.74rem;
		font-weight: 600;
	}
	.block-body {
		max-width: 52rem;
	}
	.details {
		display: grid;
		margin: 1.5rem 0 0;
	}
	.block-body > .details:first-child {
		margin-top: 0;
	}
	.details div {
		display: grid;
		grid-template-columns: minmax(130px, 34%) 1fr;
		gap: 1rem;
		padding-block: 0.65rem;
		border-bottom: 1px solid var(--line);
	}
	.details.stacked div {
		grid-template-columns: 1fr;
		gap: 0.25rem;
	}
	dt {
		color: var(--text-muted);
		font-size: 0.9rem;
	}
	.details.stacked dt {
		font-size: 0.68rem;
		letter-spacing: var(--tracking);
		text-transform: uppercase;
	}
	dd {
		margin: 0;
	}
	.more {
		margin: 1.25rem 0 0;
		font-size: 0.92rem;
	}
	.spec-table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	.spec-table th,
	.spec-table td {
		padding: 0.65rem 0;
		border-bottom: 1px solid var(--line);
		text-align: left;
		vertical-align: top;
	}
	.spec-table th {
		width: 40%;
		padding-right: 1rem;
		font-weight: 400;
		color: var(--text-muted);
	}
	.related {
		margin-top: clamp(4rem, 8vw, 6rem);
	}
	.related h2 {
		text-align: center;
		margin-bottom: 2rem;
	}
</style>
