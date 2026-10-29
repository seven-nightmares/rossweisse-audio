<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Seo from '#lib/components/Seo.svelte';

	const notFound = $derived(page.status === 404);
</script>

<Seo title={notFound ? 'Page not found' : 'Something went wrong'} noindex />

<div class="wrap err">
	<p class="eyebrow num">{page.status}</p>
	<h1>{notFound ? 'We couldn’t find that' : 'Something went wrong'}</h1>
	<p class="lede">
		{#if notFound}
			That page may have moved, or the piece is no longer listed.
		{:else}
			{page.error?.message ?? 'Please try again in a moment.'}
		{/if}
	</p>
	<p><a class="btn" href={resolve('/shop')}>Back to the shop</a></p>
</div>

<style>
	.err {
		display: grid;
		justify-items: center;
		text-align: center;
		padding-block: 3rem;
	}
</style>
