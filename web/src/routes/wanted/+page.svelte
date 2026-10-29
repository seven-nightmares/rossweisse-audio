<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const groups = $derived([...Map.groupBy(data.wanted, (w) => w.brand)]);
</script>

<Seo title="Wanted gear" description="Equipment we are looking to buy right now." />

<div class="wrap">
	<header class="page-head">
		<p class="eyebrow">Sell your gear</p>
		<h1>Wanted</h1>
		<p class="lede">
			We’re actively looking for these pieces and pay fairly for them. Don’t see yours? We buy
			plenty that isn’t on this list.
		</p>
		<p><a class="btn" href={resolve('/sell')}>Offer us your gear</a></p>
	</header>

	{#if groups.length}
		<div class="groups">
			{#each groups as [brand, items] (brand)}
				<section class="panel group">
					<h2>{brand}</h2>
					<ul>
						{#each items as item (item.model)}
							<li>
								{item.model}{#if item.note}<span class="note"> · {item.note}</span>{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{:else}
		<p>Our wanted list is empty right now, but we’re always happy to hear what you have.</p>
	{/if}
</div>

<style>
	.groups {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
	}
	.group {
		padding: 1.2rem;
	}
	.group h2 {
		font-size: 1.1rem;
	}
	ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}
	.note {
		color: var(--text-muted);
	}
</style>
