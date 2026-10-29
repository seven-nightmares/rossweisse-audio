/**
 * Serves the static demo build (`npm run build:demo`) the way GitHub Pages does:
 *   - everything lives under the base path (/rossweisse-audio/)
 *   - /x is served from x.html, /x/ from x/index.html
 *   - unknown paths get 404.html (the prerendered /404 page) with status 404
 *
 *   npm run preview:demo            http://localhost:4174/rossweisse-audio/
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build-demo');
const base = process.env.BASE_PATH ?? '/rossweisse-audio';
const port = Number(process.env.PORT ?? 4174);

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.json': 'application/json',
	'.woff2': 'font/woff2',
	'.txt': 'text/plain; charset=utf-8',
	'.png': 'image/png',
	'.ico': 'image/x-icon'
};

function isFile(file) {
	return file.startsWith(root) && fs.existsSync(file) && fs.statSync(file).isFile();
}

function locate(pathname) {
	const rel = decodeURIComponent(pathname.slice(base.length)).replace(/^\/+/, '');
	const file = path.resolve(root, rel);
	const candidates =
		rel === '' || rel.endsWith('/')
			? [path.join(file, 'index.html')]
			: [file, `${file}.html`, path.join(file, 'index.html')];
	return candidates.find(isFile) ?? null;
}

if (!fs.existsSync(path.join(root, 'index.html'))) {
	console.error('No demo build found. Run `npm run build:demo` first.');
	process.exit(1);
}

http
	.createServer((req, res) => {
		const { pathname } = new URL(req.url ?? '/', 'http://localhost');
		if (pathname === '/' || pathname === base) {
			res.writeHead(301, { location: `${base}/` }).end();
			return;
		}
		const file = pathname.startsWith(`${base}/`) ? locate(pathname) : null;
		const status = file ? 200 : 404;
		const served = file ?? path.join(root, '404.html');
		res.writeHead(status, {
			'content-type': TYPES[path.extname(served)] ?? 'application/octet-stream'
		});
		fs.createReadStream(served).pipe(res);
	})
	.listen(port, () => console.log(`Demo: http://localhost:${port}${base}/`));
