import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const demo = process.env.E2E_TARGET === 'demo';
/** The Docker stack (Strapi-backed, inquiries connected) at http://localhost:3001. */
const stack = process.env.E2E_TARGET === 'stack';

/** Fails the test on any console error or uncaught exception. */
function watchErrors(page: Page) {
	const errors: string[] = [];
	page.on('console', (m) => {
		if (m.type() === 'error') errors.push(m.text());
	});
	page.on('pageerror', (e) => errors.push(e.message));
	return errors;
}

async function expectAccessible(page: Page) {
	const { violations } = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

const productCards = (page: Page) => page.locator('article[data-sku]');

test('home page shows just-arrived pieces', async ({ page }) => {
	const errors = watchErrors(page);
	await page.goto('./');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const arrived = page.locator('section', {
		has: page.getByRole('heading', { name: 'Just arrived' })
	});
	await expect(arrived.locator('article[data-sku]')).toHaveCount(8);
	await expect(page.getByRole('note').filter({ hasText: 'Demo site' })).toHaveCount(demo ? 1 : 0);
	await expectAccessible(page);
	expect(errors).toEqual([]);
});

test('shop filters by brand with a shareable URL', async ({ page }) => {
	const errors = watchErrors(page);
	await page.goto('shop');
	await expect(productCards(page).first()).toBeVisible();
	const all = await productCards(page).count();

	// On phones the filter panel sits behind a "Filters" button.
	if (!(await page.locator('#catalog-filters').isVisible())) {
		await page.getByRole('button', { name: 'Filters' }).click();
	}
	await page.getByRole('radio', { name: 'Kestrel Audio Labs' }).check();
	await expect(page).toHaveURL(/shop\?brand=kestrel$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kestrel Audio Labs');
	const filtered = await productCards(page).count();
	expect(filtered).toBeGreaterThan(0);
	expect(filtered).toBeLessThan(all);
	for (const brand of await productCards(page).locator('.brand').allTextContents()) {
		expect(brand).toContain('Kestrel');
	}

	// A fresh visit to the same URL (deep link / refresh) shows the same results.
	await page.reload();
	await expect(productCards(page)).toHaveCount(filtered);
	await expectAccessible(page);
	expect(errors).toEqual([]);
});

test('non-canonical shop URLs are cleaned up', async ({ page }) => {
	await page.goto('shop?brand=Not%20Valid&sort=random');
	await expect(page).toHaveURL(/\/shop$/);
});

test('product page links its grade to the rating scale and starts an inquiry', async ({ page }) => {
	const errors = watchErrors(page);
	await page.goto('products/marlowe-and-finch-mf-40-stereo-tube-amplifier');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Marlowe & Finch MF-40 Stereo Tube Amplifier'
	);
	await expect(page.locator('.buy .price')).toHaveText('$3,890');
	await expect(page.getByRole('cell', { name: '40 W per channel into 8 Ω' })).toBeVisible();
	await expectAccessible(page);

	await page.getByRole('link', { name: 'Ask about this piece' }).click();
	await expect(page).toHaveURL(/inquire\?product=RA-1001$/);
	await expect(page.getByLabel(/Which piece/)).toHaveValue('RA-1001');

	await page.goBack();
	await page.locator('.grade a').click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Our Rating Scale');
	expect(errors).toEqual([]);
});

test('sold pieces hide their price and inquiry button', async ({ page }) => {
	await page.goto('products/kestrel-ka-120-compact-amplifier');
	await expect(page.locator('.buy .badge.sold')).toBeVisible();
	await expect(page.locator('.buy')).not.toContainText('$');
	await expect(page.getByRole('link', { name: 'Ask about this piece' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Ask us to find one' })).toBeVisible();
});

test('sold archive lists only sold pieces', async ({ page }) => {
	await page.goto('sold');
	await expect(productCards(page).first()).toBeVisible();
	const cards = productCards(page);
	expect(await cards.count()).toBe(await page.locator('article.sold').count());
});

async function fillConsignForm(page: Page, note: string) {
	await page.getByLabel('Consign my gear').check();
	await page.getByLabel('Your gear').fill('Tsukimi TR-4400 receiver');
	await page.getByLabel('Message').fill(note);
	await page.getByLabel('Name').fill('E2E Test');
	await page.getByLabel('Email').fill('e2e@example.com');
}

test('inquiry form validates before sending', async ({ page }) => {
	const errors = watchErrors(page);
	await page.goto('sell');
	await page.getByRole('button', { name: 'Send inquiry' }).click();
	const summary = page.getByRole('alert');
	await expect(summary).toBeFocused();
	await expect(summary).toContainText('Your gear');
	await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
	await expectAccessible(page);
	expect(errors).toEqual([]);
});

test('without a CMS the inquiry form explains nothing is sent', async ({ page }) => {
	test.skip(stack, 'The Docker stack has inquiries connected.');
	await page.goto('sell');
	await expect(page.getByRole('note').filter({ hasText: 'not connected yet' })).toBeVisible();
	await fillConsignForm(page, 'Original box, works perfectly.');
	await page.getByRole('button', { name: 'Send inquiry' }).click();
	await expect(page.getByRole('status')).toContainText('nothing was sent');
});

test('with the CMS the inquiry is sent', async ({ page, isMobile }) => {
	test.skip(!stack, 'Needs the Docker stack (E2E_TARGET=stack).');
	// One submission per run keeps well under the endpoint's rate limit (5 per 10 minutes).
	test.skip(isMobile, 'Submitted once, from desktop.');
	const errors = watchErrors(page);
	await page.goto('sell');
	await expect(page.getByRole('note').filter({ hasText: 'not connected yet' })).toHaveCount(0);
	await fillConsignForm(page, `Automated test inquiry ${Date.now()}. Safe to delete.`);
	await page.getByRole('button', { name: 'Send inquiry' }).click();
	await expect(page.getByRole('status')).toContainText('on its way');
	expect(errors).toEqual([]);
});

test('main menu opens and navigates', async ({ page, isMobile }) => {
	await page.goto('./');
	if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
	const nav = page.getByRole('navigation', { name: 'Main' });
	await nav.getByRole('button', { name: 'Shop' }).click();
	await nav.getByRole('link', { name: 'Turntables' }).click();
	await expect(page).toHaveURL(/shop\?category=turntables$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Turntables');
});

test('unknown pages show a friendly 404', async ({ page }) => {
	const res = await page.goto('products/does-not-exist');
	expect(res?.status()).toBe(404);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('We couldn’t find that');
});

test('info, brands and wanted pages are accessible', async ({ page }) => {
	for (const path of ['brands', 'wanted', 'info/rating-scale', 'info/contact', 'concierge']) {
		await page.goto(path);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expectAccessible(page);
	}
});

test('header search goes to shop results', async ({ page, isMobile }) => {
	test.skip(isMobile, 'The header search box is desktop-only; phones use the shop page search.');
	await page.goto('./');
	await page.getByRole('searchbox', { name: 'Search the shop' }).fill('marlowe preamp');
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/shop\?q=marlowe\+preamp$/);
	await expect(productCards(page)).toHaveCount(1);
});

test('dark theme follows the system and is accessible', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	for (const path of [
		'./',
		'shop',
		'products/marlowe-and-finch-mf-40-stereo-tube-amplifier',
		'sell'
	]) {
		await page.goto(path);
		await expect(productCards(page).first().or(page.locator('form.inquiry'))).toBeVisible();
		const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
		expect(bg).toBe('rgb(18, 18, 18)');
		await expectAccessible(page);
	}
});

test('theme toggle switches themes and remembers the choice', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('./');
	const toggle = page.getByRole('button', { name: 'Dark theme' });
	await expect(toggle).toHaveAttribute('aria-pressed', 'false');
	await toggle.click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(toggle).toHaveAttribute('aria-pressed', 'true');

	// The choice survives navigation and reloads, overriding the system setting.
	await page.goto('shop');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
		'rgb(18, 18, 18)'
	);

	await page.getByRole('button', { name: 'Dark theme' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('no Strapi token reaches the browser', async ({ page, isMobile }) => {
	test.skip(!stack, 'Needs the Docker stack (E2E_TARGET=stack).');
	test.skip(isMobile, 'Same responses on mobile.');
	const env = fs.readFileSync(path.resolve(import.meta.dirname, '../../../.env'), 'utf8');
	const tokens = [...env.matchAll(/^STRAPI_(?:API|INQUIRY)_TOKEN=(.+)$/gm)].map((m) => m[1].trim());
	expect(tokens).toHaveLength(2);

	const bodies: Promise<string>[] = [];
	page.on('response', (res) => {
		const type = res.headers()['content-type'] ?? '';
		if (/html|javascript|json/.test(type)) bodies.push(res.text().catch(() => ''));
	});
	for (const p of [
		'./',
		'shop',
		'products/marlowe-and-finch-mf-40-stereo-tube-amplifier',
		'sell'
	]) {
		await page.goto(p, { waitUntil: 'networkidle' });
	}
	const all = (await Promise.all(bodies)).join('\n');
	expect(all.length).toBeGreaterThan(1000);
	for (const token of tokens) expect(all.includes(token)).toBe(false);
	expect(all).not.toContain('STRAPI_API_TOKEN');
});
