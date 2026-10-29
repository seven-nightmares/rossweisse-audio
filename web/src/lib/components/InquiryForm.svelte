<script lang="ts">
	import { tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { INQUIRY_TYPES, validateInquiry, type InquiryType } from '#lib/inquiry.ts';
	import type { ProductOption } from '#lib/types.ts';

	interface Props {
		/** Inquiry types offered as choices; a single type hides the choice. */
		types: InquiryType[];
		products?: ProductOption[];
		/** Pre-selected product (SKU), e.g. from "Ask about this piece". */
		productSku?: string;
	}

	let { types, products = [], productSku = '' }: Props = $props();

	// The form owns its own state from here on; props only seed it.
	// svelte-ignore state_referenced_locally
	let type: InquiryType = $state(types[0]);
	let errors: Partial<Record<string, string>> = $state({});
	let sent = $state(false);
	let sending = $state(false);
	/** A problem sending (network, rate limit, CMS down), as opposed to field errors. */
	let failure: string | null = $state(null);
	let summary: HTMLDivElement | undefined = $state();
	let done: HTMLDivElement | undefined = $state();

	/** Set by the root layout: false in the static demo or when the CMS isn't configured. */
	const connected = $derived(page.data.inquiriesConnected === true);
	const endpoint = resolve('/api/inquiries');
	const isGear = $derived(type === 'sell' || type === 'trade' || type === 'consign');
	const errorList = $derived(Object.entries(errors).filter(([, m]) => m) as [string, string][]);

	const LABELS: Record<string, string> = {
		name: 'Name',
		email: 'Email',
		phone: 'Phone',
		message: 'Message',
		gearDescription: 'Your gear',
		productSku: 'Piece',
		budget: 'Budget',
		roomSize: 'Room',
		musicTaste: 'Music',
		form: 'Form'
	};

	async function showErrors(next: Partial<Record<string, string>>) {
		errors = next;
		await tick();
		summary?.focus();
	}

	async function showSent() {
		sent = true;
		await tick();
		done?.focus();
	}

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (sending) return;
		const form = event.currentTarget as HTMLFormElement;
		const data = new FormData(form);
		const result = validateInquiry(data);
		failure = null;
		if (!result.ok) return showErrors(result.errors);
		errors = {};
		if (!connected) return showSent();

		sending = true;
		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				body: data,
				headers: { accept: 'application/json' }
			});
			const body = (await res.json().catch(() => ({}))) as {
				ok?: boolean;
				message?: string;
				errors?: Partial<Record<string, string>>;
			};
			if (res.ok && body.ok) return showSent();
			if (body.errors) return showErrors(body.errors);
			failure = body.message ?? 'Sorry, your message could not be sent. Please try again.';
		} catch {
			failure = 'Your message could not be sent. Please check your connection and try again.';
		} finally {
			sending = false;
		}
	}

	const describedBy = (field: string) => (errors[field] ? `err-${field}` : undefined);
</script>

{#if sent}
	<div class="done panel" tabindex="-1" bind:this={done} role="status">
		{#if connected}
			<h2>Thank you, your message is on its way.</h2>
			<p>We usually reply within one business day. Keep an eye on your inbox (and spam folder).</p>
		{:else}
			<h2>Thanks, that all looks good.</h2>
			<p>
				This is the demo site, so nothing was sent. On the live site your message goes straight to
				our team and we reply within one business day.
			</p>
		{/if}
		<button class="btn secondary" type="button" onclick={() => (sent = false)}
			>Back to the form</button
		>
	</div>
{:else}
	<form class="inquiry panel" method="post" action={endpoint} novalidate {onsubmit}>
		{#if !connected}
			<p class="notice" role="note">
				<strong>Demo:</strong> this form checks your entries but is not connected yet, so nothing is sent.
			</p>
		{/if}

		{#if errorList.length}
			<div class="summary" tabindex="-1" bind:this={summary} role="alert">
				<p>Please fix {errorList.length === 1 ? 'this' : 'these'} before sending:</p>
				<ul>
					{#each errorList as [field, message] (field)}
						<li><a href="#f-{field}">{LABELS[field] ?? field}: {message}</a></li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if types.length > 1}
			<fieldset class="field">
				<legend>What would you like to do?</legend>
				<div class="choices">
					{#each types as t (t)}
						<label class="choice">
							<input type="radio" name="type" value={t} bind:group={type} />
							{INQUIRY_TYPES[t]}
						</label>
					{/each}
				</div>
			</fieldset>
		{:else}
			<input type="hidden" name="type" value={type} />
		{/if}

		{#if type === 'product-question' && products.length}
			<div class="field">
				<label for="f-productSku">Which piece? <span class="opt">(optional)</span></label>
				<select id="f-productSku" name="productSku" value={productSku}>
					<option value="">A general question</option>
					{#each products as p (p.sku)}
						<option value={p.sku}>{p.title}</option>
					{/each}
				</select>
			</div>
		{/if}

		{#if isGear}
			<div class="field">
				<label for="f-gearDescription">Your gear</label>
				<p class="hint" id="hint-gear">
					Brand and model of each piece, plus anything we should know.
				</p>
				<textarea
					id="f-gearDescription"
					name="gearDescription"
					rows="4"
					aria-invalid={errors.gearDescription ? 'true' : undefined}
					aria-describedby={['hint-gear', describedBy('gearDescription')].filter(Boolean).join(' ')}
				></textarea>
				{#if errors.gearDescription}<p class="error" id="err-gearDescription">
						{errors.gearDescription}
					</p>{/if}
			</div>
		{/if}

		{#if type === 'concierge'}
			<div class="row">
				<div class="field">
					<label for="f-budget">Budget <span class="opt">(optional)</span></label>
					<input id="f-budget" name="budget" placeholder="e.g. $3,000–5,000" />
				</div>
				<div class="field">
					<label for="f-roomSize">Room <span class="opt">(optional)</span></label>
					<input id="f-roomSize" name="roomSize" placeholder="e.g. 14 × 18 ft living room" />
				</div>
			</div>
			<div class="field">
				<label for="f-musicTaste">What do you listen to? <span class="opt">(optional)</span></label>
				<input id="f-musicTaste" name="musicTaste" placeholder="Jazz, classical, 70s rock…" />
			</div>
		{/if}

		<div class="field">
			<label for="f-message">Message</label>
			<textarea
				id="f-message"
				name="message"
				rows="5"
				aria-invalid={errors.message ? 'true' : undefined}
				aria-describedby={describedBy('message')}></textarea>
			{#if errors.message}<p class="error" id="err-message">{errors.message}</p>{/if}
		</div>

		<div class="row">
			<div class="field">
				<label for="f-name">Name</label>
				<input
					id="f-name"
					name="name"
					autocomplete="name"
					aria-invalid={errors.name ? 'true' : undefined}
					aria-describedby={describedBy('name')}
				/>
				{#if errors.name}<p class="error" id="err-name">{errors.name}</p>{/if}
			</div>
			<div class="field">
				<label for="f-email">Email</label>
				<input
					id="f-email"
					name="email"
					type="email"
					autocomplete="email"
					aria-invalid={errors.email ? 'true' : undefined}
					aria-describedby={describedBy('email')}
				/>
				{#if errors.email}<p class="error" id="err-email">{errors.email}</p>{/if}
			</div>
		</div>
		<div class="field">
			<label for="f-phone">Phone <span class="opt">(optional)</span></label>
			<input id="f-phone" name="phone" type="tel" autocomplete="tel" />
		</div>

		<!-- Honeypot: hidden from people and screen readers; bots tend to fill it in. -->
		<div class="hp" aria-hidden="true">
			<label for="f-website">Website</label>
			<input id="f-website" name="website" tabindex="-1" autocomplete="off" />
		</div>

		{#if failure}<p class="failure" role="alert">{failure}</p>{/if}

		<button class="btn" type="submit" disabled={sending}>
			{sending ? 'Sending…' : 'Send inquiry'}
		</button>
	</form>
{/if}

<style>
	.inquiry,
	.done {
		display: grid;
		gap: 1.25rem;
		padding: clamp(1.25rem, 3vw, 2.25rem);
		max-width: 44rem;
	}
	.done:focus,
	.summary:focus {
		outline: none;
	}
	.notice {
		margin: 0;
		padding: 0.7rem 0.9rem;
		border-left: 2px solid var(--accent);
		background: var(--accent-soft);
		color: var(--text);
		font-size: 0.9rem;
	}
	.summary {
		padding: 0.8rem 1rem;
		border: 1px solid var(--sold);
		background: var(--surface);
	}
	.summary p {
		margin: 0 0 0.3rem;
		font-weight: 600;
	}
	.summary ul {
		margin: 0;
		padding-left: 1.2rem;
	}
	.summary a {
		color: var(--sold);
	}
	.field {
		display: grid;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	label,
	legend {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: var(--tracking);
		text-transform: uppercase;
	}
	.choice,
	.opt {
		letter-spacing: normal;
		text-transform: none;
	}
	legend {
		padding: 0;
		margin-bottom: 0.4rem;
	}
	.opt,
	.hint {
		font-weight: 400;
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.hint {
		margin: 0;
	}
	.choices {
		display: grid;
		gap: 0.35rem;
	}
	.choice {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-size: 0.95rem;
		font-weight: 400;
		min-height: 36px;
		cursor: pointer;
	}
	.row {
		display: grid;
		gap: 1.1rem;
	}
	@media (min-width: 640px) {
		.row {
			grid-template-columns: 1fr 1fr;
		}
	}
	.failure {
		margin: 0;
		padding: 0.75rem 1rem;
		border-left: 2px solid var(--sold);
		background: var(--surface-2);
	}
	.error {
		margin: 0;
		color: var(--sold);
		font-size: 0.88rem;
	}
	[aria-invalid='true'] {
		border-color: var(--sold);
	}
	.hp {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
	.inquiry {
		position: relative;
	}
	.inquiry > .btn {
		justify-self: start;
	}
</style>
