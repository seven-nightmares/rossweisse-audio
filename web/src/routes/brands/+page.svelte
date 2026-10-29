<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title="Brands" description="The makers we buy, service and sell." />

<div class="wrap">
	<header class="page-head">
		<p class="eyebrow">Brands</p>
		<h1>The makers we know best</h1>
		<p class="lede">
			Pre-owned gear from every era, plus new equipment from brands we’re authorized to sell.
		</p>
	</header>

	<ul class="brands">
		{#each data.brands as b (b.slug)}
			<li class="brand panel">
				<h2>{b.name}</h2>
				<p class="meta">
					{[b.country, b.founded ? `since ${b.founded}` : null].filter(Boolean).join(' · ')}
					{#if b.authorizedDealer}<span class="badge plain">Authorized dealer</span>{/if}
				</p>
				{#if b.blurb}<p>{b.blurb}</p>{/if}
				{#if b.available}
					<a href={resolve(`/shop?brand=${b.slug}`)}
						>Shop {b.available}
						{b.available === 1 ? 'piece' : 'pieces'}<span class="visually-hidden">
							by {b.name}</span
						> →</a
					>
				{:else}
					<p class="none">Nothing in stock right now.</p>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.brands {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
	}
	.brand {
		display: grid;
		align-content: start;
		gap: 0.4rem;
		padding: 1.2rem;
	}
	.brand h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.brand p {
		margin: 0;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.none {
		color: var(--text-faint);
	}
</style>
