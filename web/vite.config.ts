import process from 'node:process';
import { defineConfig } from 'vitest/config';
import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

/**
 * Two build targets from one codebase:
 *   default            adapter-node, server-rendered on each request (the real site)
 *   BUILD_TARGET=demo  adapter-static, every page prerendered for GitHub Pages under BASE_PATH
 * `__DEMO__` is a compile-time constant so demo-only code is dropped from the real build.
 */
const demo = process.env.BUILD_TARGET === 'demo';
const base = demo ? (process.env.BASE_PATH ?? '') : '';
if (base && !/^\/[A-Za-z0-9._-]+$/.test(base)) {
	throw new Error(`BASE_PATH must look like "/repo-name", got "${base}"`);
}
/**
 * The site's public origin (e.g. https://rossweisse-audio.com), used for CSRF checks on the inquiry
 * form. Set at build time; without it SvelteKit assumes https on the request's host, which breaks
 * form posts on plain-http local setups (the Docker stack passes http://localhost:3001).
 */
const origin = process.env.ORIGIN || undefined;
if (origin && !/^https?:\/\/[^/]+$/.test(origin)) {
	throw new Error(`ORIGIN must look like "https://example.com" (no path), got "${origin}"`);
}

export default defineConfig({
	define: {
		__DEMO__: JSON.stringify(demo)
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// The demo has no SPA fallback: GitHub Pages serves the prerendered /404 route (404.html)
			// for unknown paths, so asset URLs must be absolute (relative: false) to work at any depth.
			// strict: false because the server-only routes (/api, /uploads, /healthz) aren't part of it.
			adapter: demo
				? adapterStatic({ pages: 'build-demo', assets: 'build-demo', strict: false })
				: adapterNode(),
			paths: {
				base: base as '' | `/${string}`,
				origin: demo ? undefined : origin,
				relative: !demo
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
