import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * The static demo prerenders this as 404.html, which GitHub Pages serves for unknown paths.
 * On the real site, unknown paths use the normal error page, so /404 itself is just a 404.
 */
export const load: PageServerLoad = () => {
	if (!__DEMO__) error(404, 'Not found');
};
