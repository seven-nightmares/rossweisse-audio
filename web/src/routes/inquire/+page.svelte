<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import InquiryForm from '#lib/components/InquiryForm.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Read in the browser: the static demo prerenders this page without its query string.
	let productSku = $state('');
	onMount(() => {
		const sku = page.url.searchParams.get('product') ?? '';
		if (data.products.some((p) => p.sku === sku)) productSku = sku;
	});
</script>

<Seo title="Ask a question" description="Questions about a piece? We’re happy to help." />

<div class="wrap">
	<header class="page-head">
		<p class="eyebrow">Ask us</p>
		<h1>Ask about a piece</h1>
		<p class="lede">
			More photos, measurements, a listening appointment or shipping to your area: just ask. We
			usually reply within one business day.
		</p>
	</header>
	<InquiryForm types={['product-question']} products={data.products} {productSku} />
</div>
