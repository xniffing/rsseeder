import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { deleteFeed as deleteFeedById } from '$lib/server/archive';

function unauthorized() {
	return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export const DELETE: RequestHandler = async ({ locals, platform, params }) => {
	if (!locals.user || !platform?.env.DB) return unauthorized();

	const feedId = params.id;
	if (!feedId) {
		return Response.json({ error: 'Feed ID is required' }, { status: 400 });
	}

	try {
		await deleteFeedById(platform, locals.user, feedId);
		return Response.json({ success: true });
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : 'Unable to delete feed' },
			{ status: 400 }
		);
	}
};
