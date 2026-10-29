<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Inline as InlineNode } from '#lib/types.ts';
	import Inline from './Inline.svelte';

	let { nodes }: { nodes: InlineNode[] } = $props();

	/** resolve() only types known routes; editor links are arbitrary (validated) paths. */
	const resolvePath = resolve as unknown as (path: string) => string;

	/**
	 * Only site-internal paths, http(s) and mailto links from editor content are rendered as links.
	 * Internal paths ("/info/contact") get the base path added so they work in the demo too.
	 */
	function safeHref(url: string): { href: string; internal: boolean } | null {
		if (/^\/(?!\/)[a-z0-9/_?=&#.-]*$/i.test(url)) {
			return { href: resolvePath(url), internal: true };
		}
		try {
			const u = new URL(url);
			return ['http:', 'https:', 'mailto:'].includes(u.protocol)
				? { href: u.href, internal: false }
				: null;
		} catch {
			return null;
		}
	}
</script>

{#each nodes as node, i (i)}
	{#if node.type === 'link'}
		{@const link = safeHref(node.url)}
		{#if link}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- editor-supplied link, validated and resolved by safeHref() -->
			<a href={link.href} rel={link.internal ? undefined : 'noopener noreferrer'}
				><Inline nodes={node.children} /></a
			>
		{:else}
			<Inline nodes={node.children} />
		{/if}
	{:else if node.type === 'text'}
		{#if node.code}<code>{node.text}</code>
		{:else if node.bold && node.italic}<strong><em>{node.text}</em></strong>
		{:else if node.bold}<strong>{node.text}</strong>
		{:else if node.italic}<em>{node.text}</em>
		{:else if node.underline}<u>{node.text}</u>
		{:else if node.strikethrough}<s>{node.text}</s>
		{:else}{node.text}{/if}
	{/if}
{/each}
