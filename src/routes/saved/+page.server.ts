import { getSavedPageData } from '$lib/server/archive';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	return getSavedPageData(platform, locals.user);
};
