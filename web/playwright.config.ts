import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a production build.
 *   npm run test:e2e        real-site build (adapter-node), served by `vite preview`
 *   npm run test:e2e:demo   static GitHub Pages demo, served under its base path like GitHub Pages
 *   npm run test:e2e:stack  the running Docker stack (Strapi data, inquiries connected) on :3001
 * The first two build first. Tests use relative URLs ("shop", not "/shop") so the base path applies.
 */
const target = process.env.E2E_TARGET;
const demo = target === 'demo';
const stack = target === 'stack';
const baseURL = stack
	? 'http://localhost:3001/'
	: demo
		? 'http://localhost:4174/rossweisse-audio/'
		: 'http://localhost:4173/';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	retries: 0,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: { baseURL, trace: 'retain-on-failure' },
	// The Docker stack is started separately (docker compose up -d).
	webServer: stack
		? undefined
		: {
				command: demo
					? 'node scripts/serve-demo.js'
					: 'npm run preview -- --port 4173 --strictPort',
				url: baseURL,
				reuseExistingServer: !process.env.CI
			},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } }
	]
});
