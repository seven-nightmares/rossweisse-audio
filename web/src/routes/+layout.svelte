<script lang="ts">
	import '@fontsource-variable/newsreader/opsz.css';
	import '@fontsource-variable/newsreader/opsz-italic.css';
	import '@fontsource-variable/archivo';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import DemoBanner from '#lib/components/DemoBanner.svelte';
	import SiteFooter from '#lib/components/SiteFooter.svelte';
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

{#if __DEMO__}
	<DemoBanner />
{/if}

<SiteHeader
	settings={data.settings}
	categories={data.categories}
	brands={data.brands}
	infoPages={data.infoPages}
/>

<main id="main" tabindex="-1">
	{@render children()}
</main>

<SiteFooter settings={data.settings} categories={data.categories} infoPages={data.infoPages} />

<style>
	.skip {
		position: absolute;
		left: 1rem;
		top: -100px;
		z-index: 50;
		padding: 0.7rem 1.1rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.skip:focus {
		top: 1rem;
	}
	main {
		min-height: 60vh;
	}
	main:focus {
		outline: none;
	}
</style>
