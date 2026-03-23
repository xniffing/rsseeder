import { listEntriesApi } from '$lib/server/archive';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform }) => {
	return Response.json({ entries: await listEntriesApi(platform, locals.user) });
};
