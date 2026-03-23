import { syncAllFeeds } from '$lib/server/archive';
import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const secret = request.headers.get('x-cron-secret');
	if (!secret || secret !== platform?.env.CRON_SECRET) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!platform?.env.DB) {
		return Response.json({ error: 'Database not configured' }, { status: 500 });
	}

	const db = getDb(platform.env.DB);
	const result = await syncAllFeeds(db);

	return Response.json(result);
};
