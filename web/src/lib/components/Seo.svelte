<script lang="ts">
	import { page } from '$app/state';
	import { pageTitle } from '#lib/format.ts';

	interface Props {
		title?: string;
		description?: string | null;
		image?: string | null;
		noindex?: boolean;
	}

	let { title, description, image, noindex = false }: Props = $props();

	const shopName = $derived(page.data.settings?.shopName ?? 'Rossweisse Audio');
	const fullTitle = $derived(pageTitle(shopName, title));
	const desc = $derived(description || page.data.settings?.tagline || '');
	const imageUrl = $derived(image ? new URL(image, page.url.href).href : null);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	{#if desc}
		<meta name="description" content={desc} />
		<meta property="og:description" content={desc} />
	{/if}
	<meta property="og:title" content={fullTitle} />
	<meta property="og:site_name" content={shopName} />
	<meta property="og:type" content="website" />
	{#if imageUrl}
		<meta property="og:image" content={imageUrl} />
	{/if}
	{#if noindex}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>
