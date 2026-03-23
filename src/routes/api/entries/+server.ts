import { getFeedPageData } from '$lib/server/archive';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
	if (!locals.user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
	const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || 5));

	const { entries } = await getFeedPageData(platform, locals.user, offset, limit);
	return Response.json({ entries });
};
