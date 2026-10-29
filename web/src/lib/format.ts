const usd = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0
});

/** Formats a whole-dollar price as USD, e.g. 4990 → "$4,990". */
export function formatPrice(dollars: number): string {
	return usd.format(dollars);
}

/** Composes a page <title> with the shop name. */
export function pageTitle(shopName: string, title?: string): string {
	return title ? `${title} · ${shopName}` : shopName;
}

const longDate = new Intl.DateTimeFormat('en-US', {
	month: 'long',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC'
});

/** Formats an ISO date (YYYY-MM-DD) for display. */
export function formatDate(iso: string): string {
	const d = new Date(`${iso}T00:00:00Z`);
	return Number.isNaN(d.getTime()) ? iso : longDate.format(d);
}
