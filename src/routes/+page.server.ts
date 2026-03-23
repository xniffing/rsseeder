import { getHomepageData } from '$lib/server/archive';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	return getHomepageData(platform, locals.user);
};
