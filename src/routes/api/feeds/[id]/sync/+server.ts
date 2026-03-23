import { syncFeedById } from '$lib/server/archive';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params, platform }) => {
	if (!locals.user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await syncFeedById(platform, locals.user, params.id);
		return Response.json(result);
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : 'Unable to sync feed' },
			{ status: 400 }
		);
	}
};
