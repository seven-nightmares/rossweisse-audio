<script lang="ts">
	// Every href in this menu is built with resolve() in `items` below.
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Brand, Category, InfoPageLink, SiteSettings } from '#lib/types.ts';
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		settings: SiteSettings;
		categories: Category[];
		brands: Brand[];
		infoPages: InfoPageLink[];
	}

	let { settings, categories, brands, infoPages }: Props = $props();

	interface Link {
		href: string;
		label: string;
	}
	interface Column {
		title: string;
		links: Link[];
	}
	interface Menu {
		id: string;
		label: string;
		/** Wide menus open as a full-width panel with columns. */
		wide: boolean;
		columns: Column[];
	}
	type Item = Link | Menu;

	const info = (group: InfoPageLink['menuGroup']) =>
		infoPages
			.filter((p) => p.menuGroup === group)
			.map((p) => ({ href: resolve('/info/[slug]', { slug: p.slug }), label: p.title }));

	const items: Item[] = $derived([
		{
			id: 'shop',
			label: 'Shop',
			wide: true,
			columns: [
				{
					title: 'By type',
					links: categories
						.filter((c) => c.showInMenu)
						.map((c) => ({ href: resolve(`/shop?category=${c.slug}`), label: c.name }))
				},
				{
					title: 'By brand',
					links: brands.map((b) => ({ href: resolve(`/shop?brand=${b.slug}`), label: b.name }))
				},
				{
					title: 'Collections',
					links: [
						{ href: resolve('/shop'), label: 'Just arrived' },
						{ href: resolve('/shop?era=vintage'), label: 'Vintage' },
						{ href: resolve('/shop?era=modern'), label: 'Modern' },
						{ href: resolve('/shop?tech=tube'), label: 'Tube gear' },
						{ href: resolve('/shop?condition=new'), label: 'New, with warranty' },
						{ href: resolve('/shop?condition=nos'), label: 'New old stock' },
						{ href: resolve('/shop?voltage=240v'), label: '220–240V international' },
						{ href: resolve('/sold'), label: 'Sold archive' }
					]
				}
			]
		},
		{ href: resolve('/shop'), label: 'Just arrived' },
		{ href: resolve('/brands'), label: 'Brands' },
		{
			id: 'sell',
			label: 'Sell your gear',
			wide: false,
			columns: [
				{
					title: 'Sell your gear',
					links: [
						{ href: resolve('/sell'), label: 'Sell or trade in' },
						...info('sell'),
						{ href: resolve('/wanted'), label: 'Wanted gear' }
					]
				}
			]
		},
		{ href: resolve('/concierge'), label: 'System help' },
		{
			id: 'about',
			label: 'About',
			wide: false,
			columns: [{ title: 'About', links: info('about') }]
		},
		{ href: resolve('/info/[slug]', { slug: 'contact' }), label: 'Contact' }
	]);

	/** Brand wordmark: first word in the serif, the rest as tracked caps ("Rossweisse" / "AUDIO"). */
	const wordmark = $derived.by(() => {
		const [first, ...rest] = settings.shopName.split(' ');
		return { first, rest: rest.join(' ') };
	});

	let navOpen = $state(false);
	let openMenu: string | null = $state(null);
	let header: HTMLElement;

	/** Query string of the current page, read in the browser only (prerendered pages have none). */
	let currentSearch: string | null = $state(null);

	afterNavigate(() => {
		navOpen = false;
		openMenu = null;
		currentSearch = page.url.search;
	});

	function onWindowClick(event: MouseEvent) {
		if (openMenu && !header.contains(event.target as Node)) openMenu = null;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		if (openMenu) {
			const id = openMenu;
			openMenu = null;
			header.querySelector<HTMLButtonElement>(`#menu-btn-${id}`)?.focus();
		} else if (navOpen) {
			navOpen = false;
			header.querySelector<HTMLButtonElement>('.nav-toggle')?.focus();
		}
	}

	const isCurrent = (href: string) => {
		const [path, query] = href.split('?');
		if (page.url.pathname !== path || currentSearch === null) return false;
		return currentSearch === (query ? `?${query}` : '');
	};
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

{#if settings.announcement}
	<p class="announce caps">{settings.announcement}</p>
{/if}

<header class="site-header" bind:this={header}>
	<div class="wrap top">
		<div class="left">
			<button
				class="icon-btn nav-toggle"
				type="button"
				aria-expanded={navOpen}
				aria-controls="main-nav"
				onclick={() => (navOpen = !navOpen)}
			>
				<span class="visually-hidden">Menu</span>
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
					<path
						d={navOpen ? 'M6 6l12 12M18 6L6 18' : 'M3 7h18M3 12h18M3 17h18'}
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					/>
				</svg>
			</button>
			<form class="search" role="search" method="GET" action={resolve('/shop')}>
				<label class="visually-hidden" for="site-search">Search the shop</label>
				<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
					<circle
						cx="10.5"
						cy="10.5"
						r="6.5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					/>
					<path
						d="M15.5 15.5 21 21"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					/>
				</svg>
				<input id="site-search" name="q" type="search" placeholder="Search" maxlength="100" />
			</form>
		</div>

		<a class="logo" href={resolve('/')}>
			<span class="logo-first">{wordmark.first}</span>
			{#if wordmark.rest}<span class="logo-rest caps">{wordmark.rest}</span>{/if}
		</a>

		<div class="right">
			<a class="icon-btn search-link" href={resolve('/shop')}>
				<span class="visually-hidden">Search the shop</span>
				<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
					<circle
						cx="10.5"
						cy="10.5"
						r="6.5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					/>
					<path
						d="M15.5 15.5 21 21"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					/>
				</svg>
			</a>
			<a class="icon-btn" href={resolve('/inquire')}>
				<span class="visually-hidden">Ask us a question</span>
				<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
					<rect
						x="3"
						y="5.5"
						width="18"
						height="13"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					/>
					<path d="m3.5 6.5 8.5 7 8.5-7" fill="none" stroke="currentColor" stroke-width="1.5" />
				</svg>
			</a>
			<ThemeToggle />
		</div>
	</div>

	<nav id="main-nav" aria-label="Main" class:open={navOpen}>
		<ul class="primary">
			{#each items as item ('id' in item ? item.id : item.href)}
				<li class:wide={'columns' in item && item.wide}>
					{#if 'columns' in item}
						<button
							id="menu-btn-{item.id}"
							type="button"
							class="top-link caps"
							aria-expanded={openMenu === item.id}
							aria-controls="menu-{item.id}"
							onclick={() => (openMenu = openMenu === item.id ? null : item.id)}
						>
							{item.label}
							<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
								<path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" />
							</svg>
						</button>
						<div
							id="menu-{item.id}"
							class="panel-menu"
							class:wide={item.wide}
							hidden={openMenu !== item.id}
						>
							<div class={item.wide ? 'wrap cols' : 'cols'}>
								{#each item.columns as col (col.title)}
									<div class="col">
										{#if item.wide}<p class="col-title caps">{col.title}</p>{/if}
										<ul>
											{#each col.links as link (link.href)}
												<li>
													<a
														href={link.href}
														aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a
													>
												</li>
											{/each}
										</ul>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<a
							class="top-link caps"
							href={item.href}
							aria-current={isCurrent(item.href) ? 'page' : undefined}>{item.label}</a
						>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
</header>

<style>
	.announce {
		margin: 0;
		padding: 0.6rem var(--gutter);
		background: var(--bar-bg);
		color: var(--bar-text);
		font-size: 0.68rem;
		text-align: center;
	}
	.site-header {
		position: sticky;
		top: 0;
		z-index: 30;
		background: var(--bg);
		border-bottom: 1px solid var(--line);
	}
	.top {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 1rem;
		min-height: 76px;
	}
	.left,
	.right {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.right {
		justify-content: flex-end;
	}
	.logo {
		display: grid;
		justify-items: center;
		color: var(--text);
		text-decoration: none;
		line-height: 1;
	}
	.logo-first {
		font-family: var(--font-serif);
		font-size: clamp(1.6rem, 3vw, 2.1rem);
		letter-spacing: -0.01em;
	}
	.logo-rest {
		margin-top: 0.3rem;
		font-size: 0.62rem;
		letter-spacing: 0.42em;
		margin-right: -0.42em; /* optically center the tracked word */
	}
	.icon-btn {
		display: inline-grid;
		place-items: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--text);
		cursor: pointer;
	}
	.icon-btn:hover {
		color: var(--accent);
	}
	.search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		max-width: 260px;
		border-bottom: 1px solid var(--line-strong);
		color: var(--text-muted);
	}
	.search input {
		min-height: 38px;
		padding: 0.3rem 0;
		border: 0;
		background: transparent;
	}
	.search input:focus-visible {
		outline: none;
	}
	.search:focus-within {
		border-bottom-color: var(--accent);
		color: var(--text);
	}
	.nav-toggle,
	.search-link {
		display: none;
	}

	nav {
		position: relative;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.primary {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0 0.5rem;
	}
	.primary > li {
		position: relative;
	}
	.primary > li.wide {
		position: static;
	}
	.top-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 46px;
		padding: 0 0.9rem;
		border: 0;
		border-bottom: 1px solid transparent;
		background: none;
		color: var(--text);
		font-size: 0.72rem;
		text-decoration: none;
		cursor: pointer;
	}
	.top-link:hover,
	.top-link[aria-expanded='true'],
	.top-link[aria-current='page'] {
		color: var(--text);
		border-bottom-color: var(--text);
	}

	.panel-menu {
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 240px;
		padding: 1.25rem 1.5rem;
		background: var(--surface);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
	}
	.panel-menu.wide {
		left: 0;
		right: 0;
		padding: 2rem 0 2.25rem;
		border-width: 1px 0;
	}
	.cols {
		display: grid;
		gap: 2rem;
	}
	.panel-menu.wide .cols {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.col-title {
		margin: 0 0 0.9rem;
		color: var(--text-muted);
	}
	.col ul {
		display: grid;
		gap: 0.15rem;
	}
	.panel-menu.wide .col:nth-child(-n + 2) ul {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: 1.5rem;
	}
	.col a {
		display: block;
		padding: 0.35rem 0;
		color: var(--text);
		text-decoration: none;
	}
	.col a:hover,
	.col a[aria-current='page'] {
		color: var(--accent);
	}

	@media (max-width: 999px) {
		.top {
			min-height: 64px;
		}
		.nav-toggle,
		.search-link {
			display: inline-grid;
		}
		.search {
			display: none;
		}
		nav {
			display: none;
			max-height: calc(100vh - 64px);
			overflow-y: auto;
			padding: 0.5rem var(--gutter) 1.5rem;
			border-top: 1px solid var(--line);
		}
		nav.open {
			display: block;
		}
		.primary {
			flex-direction: column;
			gap: 0;
		}
		.primary > li {
			border-bottom: 1px solid var(--line);
		}
		.top-link {
			width: 100%;
			justify-content: space-between;
			min-height: 52px;
			padding: 0;
			border-bottom: 0;
		}
		.top-link:hover,
		.top-link[aria-expanded='true'],
		.top-link[aria-current='page'] {
			border-bottom: 0;
			color: var(--accent);
		}
		.panel-menu,
		.panel-menu.wide {
			position: static;
			min-width: 0;
			padding: 0 0 1rem;
			border: 0;
			box-shadow: none;
			background: none;
		}
		.panel-menu.wide .cols {
			grid-template-columns: 1fr;
			gap: 1.25rem;
			padding: 0;
		}
		.panel-menu.wide .col:nth-child(-n + 2) ul {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
