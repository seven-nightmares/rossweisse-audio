<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Category, InfoPageLink, SiteSettings } from '#lib/types.ts';

	interface Props {
		settings: SiteSettings;
		categories: Category[];
		infoPages: InfoPageLink[];
	}

	let { settings, categories, infoPages }: Props = $props();

	const digits = (phone: string) => phone.replace(/[^\d+]/g, '');
	const about = $derived(infoPages.filter((p) => p.menuGroup === 'about'));
	const sell = $derived(infoPages.filter((p) => p.menuGroup === 'sell'));
</script>

<footer class="site-footer">
	<div class="wrap cols">
		<div class="intro">
			<p class="name">{settings.shopName}</p>
			{#if settings.tagline}<p class="muted">{settings.tagline}</p>{/if}
			<p><a class="btn secondary small" href={resolve('/concierge')}>Help me build a system</a></p>
		</div>
		<div>
			<h2 class="caps">Shop</h2>
			<ul>
				<li><a href={resolve('/shop')}>Just arrived</a></li>
				{#each categories.filter((c) => c.showOnHome) as c (c.slug)}
					<li><a href={resolve(`/shop?category=${c.slug}`)}>{c.name}</a></li>
				{/each}
				<li><a href={resolve('/brands')}>Brands</a></li>
				<li><a href={resolve('/sold')}>Sold archive</a></li>
			</ul>
		</div>
		<div>
			<h2 class="caps">Sell</h2>
			<ul>
				<li><a href={resolve('/sell')}>Sell or trade in</a></li>
				{#each sell as p (p.slug)}
					<li><a href={resolve('/info/[slug]', { slug: p.slug })}>{p.title}</a></li>
				{/each}
				<li><a href={resolve('/wanted')}>Wanted gear</a></li>
			</ul>
			<h2 class="caps second">About</h2>
			<ul>
				{#each about as p (p.slug)}
					<li><a href={resolve('/info/[slug]', { slug: p.slug })}>{p.title}</a></li>
				{/each}
			</ul>
		</div>
		<div>
			<h2 class="caps">Visit</h2>
			{#if settings.addressLines.length}
				<address>
					{#each settings.addressLines as line, i (i)}{line}<br />{/each}
				</address>
			{/if}
			{#each settings.hours as line, i (i)}<p class="muted">{line}</p>{/each}
			{#if settings.phone}<p><a href="tel:{digits(settings.phone)}">{settings.phone}</a></p>{/if}
			{#if settings.email}<p><a href="mailto:{settings.email}">{settings.email}</a></p>{/if}
		</div>
	</div>
	<div class="wrap legal">
		<p>© {new Date().getFullYear()} {settings.shopName}</p>
		{#if settings.social.length}
			<ul class="social">
				{#each settings.social as s (s.url)}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external, https-validated -->
					<li><a href={s.url} rel="noopener noreferrer">{s.label}</a></li>
				{/each}
			</ul>
		{/if}
	</div>
</footer>

<style>
	.site-footer {
		margin-top: clamp(4rem, 8vw, 7rem);
		border-top: 1px solid var(--line);
		background: var(--surface-2);
		font-size: 0.92rem;
	}
	.cols {
		display: grid;
		gap: 2.5rem;
		padding-block: 3.5rem 2.5rem;
	}
	@media (min-width: 800px) {
		.cols {
			grid-template-columns: 1.4fr 1fr 1fr 1fr;
		}
	}
	h2 {
		margin: 0 0 1rem;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text);
	}
	h2.second {
		margin-top: 2rem;
	}
	.name {
		font-family: var(--font-serif);
		font-size: 1.6rem;
		margin-bottom: 0.4rem;
	}
	.muted {
		color: var(--text-muted);
		margin: 0 0 0.25rem;
	}
	address {
		font-style: normal;
		margin-bottom: 0.75rem;
	}
	p {
		margin: 0 0 0.35rem;
	}
	.intro p:last-child {
		margin-top: 1.25rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.45rem;
	}
	a:not(.btn) {
		color: var(--text);
		text-decoration: none;
	}
	a:not(.btn):hover {
		color: var(--accent);
		text-decoration: underline;
	}
	.legal {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1rem;
		padding-block: 1.25rem 1.75rem;
		border-top: 1px solid var(--line);
		color: var(--text-muted);
		font-size: 0.82rem;
	}
	.social {
		display: flex;
		gap: 1rem;
	}
</style>
