import { syncFeedById } from '$lib/server/archive';
import { safeErrorMessage } from '$lib/server/errors';
import { rateLimit, rateLimitResponse } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params, platform }) => {
	if (!locals.user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { allowed } = rateLimit(`feed_sync:${locals.user.id}`, { windowMs: 60_000, maxRequests: 10 });
	if (!allowed) return rateLimitResponse();

	try {
		const result = await syncFeedById(platform, locals.user, params.id);
		return Response.json(result);
	} catch (error) {
		return Response.json(
			{ error: safeErrorMessage(error, 'Unable to sync feed') },
			{ status: 400 }
		);
	}
};
