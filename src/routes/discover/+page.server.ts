import { getDiscoverPageData } from '$lib/server/archive';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	return getDiscoverPageData(platform, locals.user);
};
