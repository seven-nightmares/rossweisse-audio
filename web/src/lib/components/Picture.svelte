<script lang="ts">
	import type { Image } from '#lib/types.ts';

	interface Props {
		image: Image | null;
		sizes: string;
		/** Overrides the image's own alt text (use "" for decorative images). */
		alt?: string;
		eager?: boolean;
		label?: string;
	}

	let { image, sizes, alt, eager = false, label = '' }: Props = $props();
</script>

{#if image}
	<img
		src={image.src}
		srcset={image.srcset}
		{sizes}
		width={image.width}
		height={image.height}
		alt={alt ?? image.alt}
		loading={eager ? 'eager' : 'lazy'}
		decoding="async"
	/>
{:else}
	<div class="placeholder" role={label ? 'img' : undefined} aria-label={label || undefined}>
		<svg viewBox="0 0 120 90" aria-hidden="true">
			<rect
				x="10"
				y="25"
				width="100"
				height="45"
				rx="5"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
			/>
			<circle cx="35" cy="47" r="10" fill="none" stroke="currentColor" stroke-width="3" />
			<circle cx="85" cy="47" r="6" fill="none" stroke="currentColor" stroke-width="3" />
		</svg>
	</div>
{/if}

<style>
	img,
	.placeholder {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.placeholder {
		display: grid;
		place-items: center;
		background: var(--surface-2);
		color: var(--text-faint);
	}
	.placeholder svg {
		width: 40%;
	}
</style>
