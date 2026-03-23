import { isAuthConfigured } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	return {
		user: locals.user,
		googleEnabled: isAuthConfigured(platform?.env)
	};
};
