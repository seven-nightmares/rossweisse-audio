<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * Light/dark switch. With no saved choice the site follows the system setting;
	 * clicking saves an explicit choice (localStorage "theme"), which app.html applies
	 * before first paint on later visits.
	 */
	let dark = $state(false);
	let ready = $state(false);

	const media = () => window.matchMedia('(prefers-color-scheme: dark)');
	const effective = () => {
		const chosen = document.documentElement.dataset.theme;
		return chosen ? chosen === 'dark' : media().matches;
	};

	onMount(() => {
		dark = effective();
		ready = true;
		const follow = () => (dark = effective());
		const mq = media();
		mq.addEventListener('change', follow);
		return () => mq.removeEventListener('change', follow);
	});

	function toggle() {
		dark = !dark;
		const theme = dark ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {
			// Storage blocked (private mode): the choice lasts for this page view only.
		}
	}
</script>

<button
	class="theme-toggle"
	type="button"
	aria-pressed={ready ? dark : undefined}
	onclick={toggle}
	title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
>
	<span class="visually-hidden">Dark theme</span>
	<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
		{#if dark}
			<circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
			<path
				d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
		{:else}
			<path
				d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linejoin="round"
			/>
		{/if}
	</svg>
</button>

<style>
	.theme-toggle {
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
	.theme-toggle:hover {
		color: var(--accent);
	}
</style>
