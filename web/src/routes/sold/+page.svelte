<script lang="ts">
	import { resolve } from '$app/paths';
	import CatalogView from '#lib/components/CatalogView.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title="Sold archive" description="Pieces that have found new homes." />

<div class="wrap">
	<header class="page-head">
		<p class="eyebrow">Sold archive</p>
		<h1>Gone to good homes</h1>
		<p class="lede">
			A record of what we’ve sold. Want one of these? <a href={resolve('/concierge')}
				>Tell us what you’re after</a
			> and we’ll keep an eye out.
		</p>
	</header>

	<CatalogView
		path={resolve('/sold')}
		state={data.state}
		result={data.result}
		taxonomies={data.taxonomies}
		fixed={data.fixed}
	/>
</div>
