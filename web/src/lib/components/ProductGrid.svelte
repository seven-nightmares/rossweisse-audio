<script lang="ts">
	import type { ProductCard as Card } from '#lib/types.ts';
	import ProductCard from './ProductCard.svelte';

	interface Props {
		products: Card[];
		headingLevel?: 2 | 3;
		label?: string;
	}

	let { products, headingLevel = 3, label }: Props = $props();
</script>

<ul class="grid" aria-label={label}>
	{#each products as product (product.sku)}
		<li><ProductCard {product} {headingLevel} /></li>
	{/each}
</ul>

<style>
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: clamp(1.75rem, 3vw, 2.75rem) clamp(1rem, 2.2vw, 2rem);
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
	}
	@media (max-width: 559px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
