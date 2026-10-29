<script lang="ts">
	import InquiryForm from '#lib/components/InquiryForm.svelte';
	import Seo from '#lib/components/Seo.svelte';
</script>

<Seo
	title="System help"
	description="Tell us your room, budget and music, and we’ll put together a system for you."
/>

<div class="wrap layout">
	<header class="page-head">
		<p class="eyebrow">System help</p>
		<h1>Let us build your system</h1>
		<p class="lede">
			Getting back into hi-fi, or starting from scratch? Tell us about your room, your budget and
			what you listen to. We’ll suggest a matched system from our stock and our network, and you can
			come and hear it first.
		</p>
	</header>
	<InquiryForm types={['concierge']} />
</div>

<style>
	.layout {
		display: grid;
		gap: 2rem;
		align-items: start;
	}
	@media (min-width: 1000px) {
		.layout {
			grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		}
	}
</style>
