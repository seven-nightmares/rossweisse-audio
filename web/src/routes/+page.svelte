<script lang="ts">
	import { resolve } from '$app/paths';
	import Picture from '#lib/components/Picture.svelte';
	import ProductGrid from '#lib/components/ProductGrid.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const homeCategories = $derived(data.categories.filter((c) => c.showOnHome));

	/** The "Rossweisse Promise": six reasons to buy here. */
	const promise = [
		{
			slug: 'testing-process',
			title: 'Tested twice',
			text: 'On the bench, then in our listening room.'
		},
		{
			slug: 'rating-scale',
			title: 'Graded honestly',
			text: 'A clear 1–10 scale and photos of every mark.'
		},
		{ slug: 'warranty', title: '90-day warranty', text: 'On every pre-owned piece we sell.' },
		{
			slug: 'shipping-and-pickup',
			title: 'Insured shipping',
			text: 'Double-boxed in custom foam.'
		},
		{ slug: 'contact', title: 'Listen first', text: 'Book a showroom appointment.' },
		{ slug: 'consignment', title: 'Sell or consign', text: 'We test, list and ship it for you.' }
	];
</script>

<Seo description={data.settings.heroText} />

<section class="hero" aria-labelledby="hero-title">
	<div class="hero-stage">
		{#if data.settings.heroImage}
			<div class="hero-art">
				<Picture
					image={data.settings.heroImage}
					alt=""
					sizes="(min-width: 1520px) 1520px, 100vw"
					eager
				/>
			</div>
		{/if}
		<div class="hero-text wrap">
			<div class="hero-copy">
				<p class="eyebrow">{data.settings.tagline ?? 'Hi-fi'}</p>
				<h1 id="hero-title">{data.settings.heroTitle ?? data.settings.shopName}</h1>
				{#if data.settings.heroText}<p class="hero-lede">{data.settings.heroText}</p>{/if}
				<p class="cta">
					<a class="btn" href={resolve('/shop')}>Shop just arrived</a>
					<a class="btn secondary" href={resolve('/sell')}>Sell your gear</a>
				</p>
			</div>
		</div>
	</div>
</section>

<section class="wrap row" aria-labelledby="arrived">
	<header class="row-head">
		<p class="eyebrow">New this week</p>
		<h2 id="arrived">Just arrived</h2>
	</header>
	<ProductGrid products={data.justArrived} />
	<p class="row-more"><a class="btn secondary" href={resolve('/shop')}>View all</a></p>
</section>

<section class="wrap row" aria-labelledby="types">
	<header class="row-head">
		<p class="eyebrow">Shop our collections</p>
		<h2 id="types">Browse by type</h2>
	</header>
	<ul class="tiles">
		{#each homeCategories as c (c.slug)}
			<li>
				<a class="tile" href={resolve(`/shop?category=${c.slug}`)}>
					<span class="tile-img">
						<Picture image={c.image} alt="" sizes="(min-width: 900px) 420px, 92vw" />
					</span>
					<span class="tile-name">{c.name}</span>
					{#if c.description}<span class="tile-text">{c.description}</span>{/if}
				</a>
			</li>
		{/each}
	</ul>
</section>

<section class="promise" aria-labelledby="promise">
	<div class="wrap">
		<h2 id="promise" class="caps">The Rossweisse promise</h2>
		<ul>
			{#each promise as p (p.slug)}
				<li>
					<a href={resolve('/info/[slug]', { slug: p.slug })}>
						<span class="p-title">{p.title}</span>
						<span class="p-text">{p.text}</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>

{#if data.tubes.length}
	<section class="wrap row" aria-labelledby="tubes">
		<header class="row-head">
			<p class="eyebrow">Warm glow, restored</p>
			<h2 id="tubes">The tube room</h2>
		</header>
		<ProductGrid products={data.tubes} />
		<p class="row-more">
			<a class="btn secondary" href={resolve('/shop?tech=tube')}>View all tube gear</a>
		</p>
	</section>
{/if}

{#if data.featured.length}
	<section class="wrap row" aria-labelledby="featured">
		<header class="row-head">
			<p class="eyebrow">Chosen by our staff</p>
			<h2 id="featured">Staff favorites</h2>
		</header>
		<ProductGrid products={data.featured} />
	</section>
{/if}

{#if data.brands.length}
	<section class="wrap row" aria-labelledby="brands">
		<header class="row-head">
			<p class="eyebrow">In stock now</p>
			<h2 id="brands">Shop by brand</h2>
		</header>
		<ul class="brand-index">
			{#each data.brands as b (b.slug)}
				<li>
					<a href={resolve(`/shop?brand=${b.slug}`)}>
						<span class="b-name">{b.name}</span>
						<span class="b-count num">{b.available}</span>
					</a>
				</li>
			{/each}
		</ul>
		<p class="row-more"><a class="btn secondary" href={resolve('/brands')}>All brands</a></p>
	</section>
{/if}

<section class="wrap sell-band" aria-labelledby="sell">
	<div>
		<p class="eyebrow">Sell your gear</p>
		<h2 id="sell">Have something special on the shelf?</h2>
		<p class="lede">
			We buy, trade and consign quality hi-fi, from single components to whole collections.
		</p>
	</div>
	<p class="cta">
		<a class="btn" href={resolve('/sell')}>Get an offer</a>
		<a class="btn secondary" href={resolve('/wanted')}>See what we’re looking for</a>
	</p>
</section>

<style>
	/* Hero: a studio shot with the headline set over its empty left side.
	   The picture and the headline share one "stage" capped at --stage-max, and every
	   measurement inside it is relative to the stage (cqi), so the headline keeps the same
	   place beside the gear at any window size. Wider windows extend the studio backdrop.
	   The artwork is light in both themes, so the overlay text keeps fixed dark colors. */
	.hero {
		--stage-max: 1520px;
		/* The demo backdrop's edge colors and floor line (web/scripts/demo-art.js). */
		background: linear-gradient(
			#dbd7d1,
			#e1ddd8 35%,
			#d9d5cf 76.5%,
			#d2cdc6 76.5% 76.8%,
			#dcd8d2 76.8%,
			#cbc6bf
		);
	}
	.hero-stage {
		position: relative;
		max-width: var(--stage-max);
		margin-inline: auto;
		container-type: inline-size;
	}
	.hero-art {
		/* An explicit width, or min-height would widen the box past the screen to keep the ratio. */
		width: 100%;
		aspect-ratio: 7 / 3;
		min-height: 280px;
		overflow: hidden;
	}
	.hero-art :global(img) {
		object-position: 80% 50%;
	}
	.hero-copy {
		max-width: 34rem;
	}
	.hero h1 {
		font-size: clamp(2.2rem, 4.4vw, 3.9rem);
	}
	.hero-lede {
		font-size: 1.1rem;
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.75rem;
	}
	@media (min-width: 1100px) {
		.hero-text {
			/* Line up with the header's content column, but never run into the gear,
			   which starts at 43% of the picture's width. */
			--pad: max(var(--gutter), calc((100cqi - var(--max)) / 2 + var(--gutter)));
			position: absolute;
			inset: 0;
			width: auto;
			padding-inline: var(--pad);
			display: flex;
			align-items: center;
			color: #1c1c1c;
		}
		.hero-copy {
			max-width: min(34rem, 40cqi - var(--pad));
		}
		.hero h1 {
			font-size: clamp(2.2rem, 3.6cqi, 3.9rem);
		}
		.hero-lede {
			font-size: clamp(1rem, 1.25cqi, 1.1rem);
		}
		.cta {
			margin-top: clamp(1rem, 2cqi, 1.75rem);
		}
	}
	/* Fade the picture's sides into the backdrop once the window is wider than the stage. */
	@media (min-width: 1521px) {
		.hero-art {
			mask-image: linear-gradient(to right, transparent, #000 6%, #000 98.5%, transparent);
		}
	}
	@media (min-width: 1100px) {
		.hero .eyebrow,
		.hero-lede {
			color: #4f4a43;
		}
		.hero .btn {
			--btn-bg: #1c1c1c;
			--btn-text: #ffffff;
			--text: #1c1c1c;
			--line-strong: #8f887e;
		}
		.hero :global(:focus-visible) {
			outline-color: #6b440c;
		}
	}
	@media (max-width: 1099px) {
		.hero {
			background: none;
		}
		/* The headline sits below the picture here, so crop away the picture's empty left side. */
		.hero-art {
			aspect-ratio: 16 / 9;
		}
		.hero-art :global(img) {
			object-position: 100% 50%;
		}
		.hero-text {
			padding-block: 2rem 0;
		}
	}

	.row {
		margin-top: clamp(4rem, 8vw, 6.5rem);
	}
	.row-head {
		text-align: center;
		margin-bottom: clamp(1.75rem, 3vw, 2.5rem);
	}
	.row-head h2 {
		margin: 0;
	}
	.row-more {
		margin: 2.5rem 0 0;
		text-align: center;
	}

	.tiles {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 2.5rem clamp(1rem, 2.2vw, 2rem);
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
	}
	.tile {
		display: grid;
		gap: 0.4rem;
		color: var(--text);
		text-decoration: none;
	}
	.tile-img {
		display: block;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: var(--surface-2);
		margin-bottom: 0.6rem;
	}
	.tile-img :global(img) {
		transition: transform 0.4s ease;
	}
	.tile:hover .tile-img :global(img) {
		transform: scale(1.03);
	}
	.tile-name {
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: var(--tracking);
		text-transform: uppercase;
	}
	.tile-text {
		color: var(--text-muted);
		font-size: 0.92rem;
	}

	.promise {
		margin-top: clamp(4rem, 8vw, 6.5rem);
		padding-block: 3rem;
		background: var(--surface-2);
		border-block: 1px solid var(--line);
	}
	.promise h2 {
		font-family: var(--font-sans);
		font-size: 0.74rem;
		font-weight: 600;
		text-align: center;
		margin-bottom: 2rem;
	}
	.promise ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
	}
	.promise a {
		display: grid;
		gap: 0.3rem;
		color: var(--text);
		text-align: center;
		text-decoration: none;
	}
	.p-title {
		font-family: var(--font-serif);
		font-size: 1.2rem;
	}
	.promise a:hover .p-title {
		text-decoration: underline;
		text-decoration-thickness: 1px;
	}
	.p-text {
		color: var(--text-muted);
		font-size: 0.88rem;
	}

	.brand-index {
		list-style: none;
		margin: 0;
		padding: 0;
		columns: 3 220px;
		column-gap: 3rem;
	}
	.brand-index li {
		break-inside: avoid;
		border-bottom: 1px solid var(--line);
	}
	.brand-index a {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		color: var(--text);
		text-decoration: none;
	}
	.b-name {
		font-family: var(--font-serif);
		font-size: 1.2rem;
	}
	.brand-index a:hover .b-name {
		color: var(--accent);
	}
	.b-count {
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.sell-band {
		display: grid;
		gap: 1.5rem;
		align-items: center;
		margin-top: clamp(4rem, 8vw, 6.5rem);
		padding-block: 3rem;
		border-top: 1px solid var(--line);
	}
	@media (min-width: 900px) {
		.sell-band {
			grid-template-columns: 1.3fr 1fr;
		}
		.sell-band .cta {
			justify-content: flex-end;
		}
	}
</style>
