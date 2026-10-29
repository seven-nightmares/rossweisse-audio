<script lang="ts">
	// `path` is already resolve()d by the page; these hrefs only append a query string.
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { searchHref, type SearchState } from '#lib/search.ts';

	interface Props {
		path: string;
		state: SearchState;
		page: number;
		pageCount: number;
		omit?: (keyof SearchState)[];
	}

	let { path, state, page, pageCount, omit = [] }: Props = $props();

	const href = (p: number) => searchHref(path, { ...state, page: p }, omit);

	/** Page numbers to show, with null marking a gap. */
	const pages = $derived.by(() => {
		const out: (number | null)[] = [];
		for (let p = 1; p <= pageCount; p++) {
			if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) out.push(p);
			else if (out[out.length - 1] !== null) out.push(null);
		}
		return out;
	});
</script>

{#if pageCount > 1}
	<nav class="pagination" aria-label="Pagination">
		{#if page > 1}
			<a class="btn secondary small" href={href(page - 1)} rel="prev">← Previous</a>
		{/if}
		<ul>
			{#each pages as p, i (i)}
				<li>
					{#if p === null}
						<span class="gap" aria-hidden="true">…</span>
					{:else if p === page}
						<a class="num current" href={href(p)} aria-current="page" aria-label="Page {p}">{p}</a>
					{:else}
						<a class="num" href={href(p)} aria-label="Page {p}">{p}</a>
					{/if}
				</li>
			{/each}
		</ul>
		{#if page < pageCount}
			<a class="btn secondary small" href={href(page + 1)} rel="next">Next →</a>
		{/if}
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 3.5rem;
	}
	ul {
		display: flex;
		gap: 0.25rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.num {
		display: grid;
		place-items: center;
		min-width: 44px;
		min-height: 44px;
		border-bottom: 1px solid transparent;
		color: var(--text);
		font-variant-numeric: tabular-nums;
		text-decoration: none;
	}
	.num:hover {
		border-bottom-color: var(--line-strong);
	}
	.num.current {
		border-bottom-color: var(--text);
		font-weight: 600;
	}
	.gap {
		display: grid;
		place-items: center;
		min-width: 24px;
		min-height: 44px;
	}
</style>
