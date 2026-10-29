<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
</script>

<Seo title="Page not found" noindex />

<div class="wrap page-head">
	<p class="eyebrow num">404</p>
	<h1>We couldn’t find that</h1>
	<p class="lede">That page may have moved, or the piece is no longer listed.</p>
	<p><a class="btn" href={resolve('/shop')}>Back to the shop</a></p>
</div>
