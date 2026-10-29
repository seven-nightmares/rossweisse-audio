<script lang="ts">
	import type { Image } from '#lib/types.ts';
	import Picture from './Picture.svelte';

	let { photos, title }: { photos: Image[]; title: string } = $props();

	let current = $state(0);
	let thumbs: HTMLButtonElement[] = $state([]);

	function onKeydown(event: KeyboardEvent, index: number) {
		const last = photos.length - 1;
		const next =
			event.key === 'ArrowRight' || event.key === 'ArrowDown'
				? index === last
					? 0
					: index + 1
				: event.key === 'ArrowLeft' || event.key === 'ArrowUp'
					? index === 0
						? last
						: index - 1
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? last
							: null;
		if (next === null) return;
		event.preventDefault();
		current = next;
		thumbs[next]?.focus();
	}
</script>

<section class="gallery" aria-label="Photos of {title}">
	<div class="main">
		<Picture
			image={photos[current] ?? null}
			sizes="(min-width: 1000px) 640px, 92vw"
			eager
			label="No photo yet for {title}"
		/>
	</div>
	{#if photos.length > 1}
		<p class="visually-hidden" aria-live="polite">Showing photo {current + 1} of {photos.length}</p>
		<div class="thumbs" role="group" aria-label="Choose a photo (use arrow keys)">
			{#each photos as photo, i (photo.src)}
				<button
					type="button"
					bind:this={thumbs[i]}
					class:active={i === current}
					aria-current={i === current ? 'true' : undefined}
					aria-label="Show photo {i + 1} of {photos.length}: {photo.alt}"
					tabindex={i === current ? 0 : -1}
					onclick={() => (current = i)}
					onkeydown={(e) => onKeydown(e, i)}
				>
					<Picture image={photo} alt="" sizes="110px" />
				</button>
			{/each}
		</div>
	{/if}
</section>

<style>
	/* Desktop: thumbnail strip on the left of the main photo; mobile: strip below. */
	.gallery {
		display: grid;
		gap: 12px;
	}
	@media (min-width: 1000px) {
		.gallery:has(.thumbs) {
			grid-template-columns: 84px minmax(0, 1fr);
		}
		.thumbs {
			order: -1;
			flex-direction: column;
			align-self: start;
		}
	}
	.main {
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: var(--surface-2);
	}
	.thumbs {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.thumbs button {
		width: 84px;
		aspect-ratio: 4 / 3;
		padding: 0;
		border: 1px solid transparent;
		overflow: hidden;
		background: var(--surface-2);
		cursor: pointer;
		opacity: 0.65;
	}
	.thumbs button:hover,
	.thumbs button.active {
		opacity: 1;
	}
	.thumbs button.active {
		border-color: var(--text);
	}
</style>
