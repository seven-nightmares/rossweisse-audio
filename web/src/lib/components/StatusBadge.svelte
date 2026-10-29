<script lang="ts">
	import { AVAILABILITY_STATUS, type AvailabilityStatus } from '#lib/facets.ts';

	let { status }: { status: AvailabilityStatus } = $props();
</script>

<span class="badge {status}">{AVAILABILITY_STATUS[status]}</span>
