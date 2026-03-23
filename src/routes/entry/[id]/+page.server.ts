import { error } from '@sveltejs/kit';
import { getEntryPageData } from '$lib/server/archive';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	const data = await getEntryPageData(platform, locals.user, params.id);

	if (!data.entry) {
		throw error(404, 'Entry not found');
	}

	return data;
};
