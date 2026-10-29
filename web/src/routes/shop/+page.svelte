<script lang="ts">
	import { resolve } from '$app/paths';
	import CatalogView from '#lib/components/CatalogView.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const category = $derived(data.taxonomies.categories.find((c) => c.slug === data.state.category));
	const brand = $derived(data.taxonomies.brands.find((b) => b.slug === data.state.brand));
	const heading = $derived(
		[brand?.name, category?.name].filter(Boolean).join(' ') || 'Just arrived'
	);
	const title = $derived(
		data.state.q
			? `Search: “${data.state.q}”`
			: data.state.page > 1
				? `${heading}, page ${data.state.page}`
				: heading
	);
</script>

<Seo
	{title}
	description="Browse tested vintage and modern hi-fi by type, brand, condition and price."
/>

<div class="wrap">
	<header class="page-head">
		<p class="eyebrow">Shop</p>
		<h1>{heading}</h1>
		<p class="lede">
			{#if category?.description}{category.description}{:else}Every piece is tested, serviced and
				graded before it’s listed.{/if}
			Looking for something that already sold? See the <a href={resolve('/sold')}>sold archive</a>.
		</p>
	</header>

	<CatalogView
		path={resolve('/shop')}
		state={data.state}
		result={data.result}
		taxonomies={data.taxonomies}
		fixed={data.fixed}
	/>
</div>
