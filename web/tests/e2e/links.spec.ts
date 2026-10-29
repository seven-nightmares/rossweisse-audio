import { expect, test } from '@playwright/test';

/**
 * Crawls every page reachable from the home page and checks that each internal link,
 * image and stylesheet resolves. In the demo this catches links that forget the base path.
 */
test('every internal link and image resolves', async ({ page, baseURL, isMobile }) => {
	test.skip(isMobile, 'Same pages on mobile; crawl once.');
	test.setTimeout(180_000);
	const base = new URL(baseURL!);
	const seen = new Set<string>();
	const queue = [base.href];
	const checked = new Map<string, number>();
	const broken: string[] = [];

	const isInternal = (u: URL) => u.origin === base.origin;

	while (queue.length) {
		const url = queue.shift()!;
		if (seen.has(url)) continue;
		seen.add(url);
		await page.goto(url);
		// Client-rendered pages (the demo's shop) fill in after hydration.
		await page.waitForLoadState('networkidle');

		const refs = await page.evaluate(() => [
			...[...document.querySelectorAll('a[href]')].map((a) => (a as HTMLAnchorElement).href),
			...[...document.querySelectorAll('img[src]')].map((i) => (i as HTMLImageElement).src),
			...[...document.querySelectorAll('link[rel=stylesheet]')].map(
				(l) => (l as HTMLLinkElement).href
			)
		]);
		for (const ref of refs) {
			const u = new URL(ref);
			if (!isInternal(u)) continue;
			u.hash = '';
			if (!u.pathname.startsWith(base.pathname)) {
				broken.push(`${ref} (outside base path, on ${url})`);
				continue;
			}
			if (!checked.has(u.href)) {
				const res = await page.request.get(u.href);
				checked.set(u.href, res.status());
				if (!res.ok()) broken.push(`${u.href} → ${res.status()} (on ${url})`);
			}
			const isPage = !/\.[a-z0-9]+$/i.test(u.pathname);
			if (isPage && !seen.has(u.href)) queue.push(u.href);
		}
	}

	expect(broken).toEqual([]);
	// Sanity check: the crawl reached every product page.
	expect([...seen].filter((u) => u.includes('/products/')).length).toBeGreaterThanOrEqual(37);
});
