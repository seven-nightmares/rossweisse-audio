<script lang="ts">
	import type { Block } from '#lib/types.ts';
	import Inline from './Inline.svelte';

	/** Renders Strapi "Blocks" rich text. Unknown block types (and images) are skipped. */
	let { blocks, headingOffset = 1 }: { blocks: Block[]; headingOffset?: number } = $props();

	const level = (l: number) => `h${Math.min(6, Math.max(2, l + headingOffset))}`;
</script>

<div class="prose">
	{#each blocks as block, i (i)}
		{#if block.type === 'paragraph'}
			<p><Inline nodes={block.children} /></p>
		{:else if block.type === 'heading'}
			<svelte:element this={level(block.level)}><Inline nodes={block.children} /></svelte:element>
		{:else if block.type === 'quote'}
			<blockquote><Inline nodes={block.children} /></blockquote>
		{:else if block.type === 'code'}
			<pre><code><Inline nodes={block.children} /></code></pre>
		{:else if block.type === 'list'}
			<svelte:element this={block.format === 'ordered' ? 'ol' : 'ul'}>
				{#each block.children as item, j (j)}
					<li><Inline nodes={item.children} /></li>
				{/each}
			</svelte:element>
		{/if}
	{/each}
</div>

<style>
	.prose :global(blockquote) {
		margin: 1rem 0;
		padding: 0.5rem 1rem;
		border-left: 3px solid var(--accent);
		color: var(--text-muted);
		font-style: italic;
	}
	.prose :global(pre) {
		overflow-x: auto;
	}
</style>
