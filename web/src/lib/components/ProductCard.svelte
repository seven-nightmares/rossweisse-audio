<script lang="ts">
	import { resolve } from '$app/paths';
	import { AVAILABILITY_STATUS, CONDITION_GRADES, NEW_OR_USED } from '#lib/facets.ts';
	import { formatPrice } from '#lib/format.ts';
	import type { ProductCard } from '#lib/types.ts';
	import Picture from './Picture.svelte';

	interface Props {
		product: ProductCard;
		headingLevel?: 2 | 3;
	}

	let { product, headingLevel = 3 }: Props = $props();

	const condition = $derived(
		product.conditionGrade === 'new' || product.conditionGrade === 'nos'
			? NEW_OR_USED[product.newOrUsed]
			: `Condition ${CONDITION_GRADES[product.conditionGrade].short}`
	);
</script>

<article class="card" class:sold={product.sold} data-sku={product.sku}>
	<div class="photo">
		<Picture
			image={product.image}
			alt=""
			sizes="(min-width: 1200px) 300px, (min-width: 760px) 30vw, (min-width: 480px) 45vw, 92vw"
		/>
		{#if product.status !== 'available'}
			<span class="badge {product.status} ribbon">{AVAILABILITY_STATUS[product.status]}</span>
		{/if}
	</div>
	<div class="body">
		{#if product.brand}<p class="brand caps">{product.brand.name}</p>{/if}
		<svelte:element this={`h${headingLevel}`} class="title">
			<a href={resolve('/products/[slug]', { slug: product.slug })}>{product.title}</a>
		</svelte:element>
		<p class="meta">
			<span class="price num">
				{#if product.sold}Sold{:else}{formatPrice(product.price)}{/if}
			</span>
			<span class="grade">{condition}</span>
		</p>
	</div>
</article>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.photo {
		position: relative;
		aspect-ratio: 4 / 3;
		background: var(--surface-2);
		overflow: hidden;
	}
	.photo :global(img) {
		transition: transform 0.4s ease;
	}
	.card:hover .photo :global(img) {
		transform: scale(1.03);
	}
	.card.sold .photo :global(img) {
		filter: grayscale(0.7);
		opacity: 0.75;
	}
	.ribbon {
		position: absolute;
		top: 10px;
		left: 10px;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding-top: 0.9rem;
		flex: 1;
	}
	.brand {
		margin: 0;
		font-size: 0.66rem;
		color: var(--text-muted);
	}
	.title {
		margin: 0;
		font-size: 1.12rem;
		line-height: 1.3;
	}
	.title a {
		color: var(--text);
		text-decoration: none;
	}
	.title a:hover {
		text-decoration: underline;
		text-decoration-thickness: 1px;
	}
	/* Whole card is clickable; the link text remains the accessible name. */
	.title a::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.title a:focus-visible {
		outline: none;
	}
	.title a:focus-visible::after {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
	}
	.meta {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		margin: auto 0 0;
		padding-top: 0.35rem;
	}
	.price {
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.card.sold .price {
		color: var(--sold);
		font-size: 0.72rem;
		letter-spacing: var(--tracking);
		text-transform: uppercase;
	}
	.grade {
		font-size: 0.78rem;
		color: var(--text-muted);
	}
</style>
