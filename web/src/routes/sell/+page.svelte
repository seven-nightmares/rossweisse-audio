<script lang="ts">
	import { resolve } from '$app/paths';
	import InquiryForm from '#lib/components/InquiryForm.svelte';
	import Seo from '#lib/components/Seo.svelte';
</script>

<Seo
	title="Sell or trade your gear"
	description="Sell, trade in or consign your hi-fi equipment."
/>

<div class="wrap layout">
	<header class="page-head">
		<p class="eyebrow">Sell your gear</p>
		<h1>Sell, trade or consign</h1>
		<p class="lede">
			Tell us what you have. We’ll reply with an offer, a trade-in value toward something in the
			shop, or a consignment plan.
		</p>
		<ul class="ways">
			<li><strong>Sell:</strong> we buy it outright and pay you right away.</li>
			<li><strong>Trade in:</strong> put its value toward a piece in the shop.</li>
			<li>
				<strong>Consign:</strong> we sell it for you.
				<a href={resolve('/info/[slug]', { slug: 'consignment' })}>How consignment works</a>
			</li>
		</ul>
		<p>Also see our <a href={resolve('/wanted')}>wanted list</a>.</p>
	</header>
	<InquiryForm types={['sell', 'trade', 'consign']} />
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
	.ways {
		padding-left: 1.1rem;
		display: grid;
		gap: 0.4rem;
		color: var(--text-muted);
	}
	.ways strong {
		color: var(--text);
	}
</style>
