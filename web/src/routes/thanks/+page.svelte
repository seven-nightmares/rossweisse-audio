<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
</script>

<!-- Landing page for inquiries sent without JavaScript; the form shows its own thanks otherwise. -->
<Seo title="Thank you" noindex />

<div class="wrap page-head">
	<p class="eyebrow">Message received</p>
	<h1>Thank you</h1>
	<p class="lede">We’ve got your message and usually reply within one business day.</p>
	<p><a class="btn" href={resolve('/shop')}>Back to the shop</a></p>
</div>
