<script lang="ts">
	import Blocks from '#lib/components/Blocks.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const s = $derived(data.settings);
	const digits = (phone: string) => phone.replace(/[^\d+]/g, '');
</script>

<Seo title={data.page.title} description={data.page.summary} />

<div class="wrap">
	<article>
		<header class="page-head">
			<p class="eyebrow">{data.page.menuGroup === 'sell' ? 'Sell your gear' : 'Good to know'}</p>
			<h1>{data.page.title}</h1>
			{#if data.page.summary}<p class="lede">{data.page.summary}</p>{/if}
		</header>
		<Blocks blocks={data.page.body} />

		{#if data.page.slug === 'contact'}
			<dl class="contact panel">
				{#if s.phone}<div>
						<dt>Phone</dt>
						<dd><a href="tel:{digits(s.phone)}">{s.phone}</a></dd>
					</div>{/if}
				{#if s.email}<div>
						<dt>Email</dt>
						<dd><a href="mailto:{s.email}">{s.email}</a></dd>
					</div>{/if}
				{#if s.addressLines.length}
					<div>
						<dt>Showroom</dt>
						<dd>
							{#each s.addressLines as line, i (i)}{line}<br />{/each}
						</dd>
					</div>
				{/if}
				{#if s.hours.length}
					<div>
						<dt>Hours</dt>
						<dd>
							{#each s.hours as line, i (i)}{line}<br />{/each}
						</dd>
					</div>
				{/if}
			</dl>
		{/if}
	</article>
</div>

<style>
	article {
		max-width: 44rem;
		margin-inline: auto;
	}
	.contact {
		display: grid;
		gap: 1rem;
		margin-top: 2rem;
		padding: 1.25rem;
	}
	@media (min-width: 640px) {
		.contact {
			grid-template-columns: 1fr 1fr;
		}
	}
	dt {
		font-size: 0.68rem;
		letter-spacing: var(--tracking);
		text-transform: uppercase;
		color: var(--text-muted);
	}
	dd {
		margin: 0.2rem 0 0;
	}
</style>
