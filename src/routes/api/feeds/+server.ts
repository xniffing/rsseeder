import { addFeedFromUrl, listFeedsApi } from '$lib/server/archive';
import { safeErrorMessage } from '$lib/server/errors';
import { rateLimit, rateLimitResponse } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

function unauthorized() {
	return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) return unauthorized();
	return Response.json({ feeds: await listFeedsApi(platform, locals.user) });
};

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) return unauthorized();

	const { allowed } = rateLimit(`feed_add:${locals.user.id}`, { windowMs: 60_000, maxRequests: 5 });
	if (!allowed) return rateLimitResponse();

	try {
		const payload = (await request.json()) as { url?: string; category?: string };
		const result = await addFeedFromUrl(platform, locals.user, {
			url: payload.url ?? '',
			category: payload.category
		});

		return Response.json(result);
	} catch (error) {
		return Response.json(
			{ error: safeErrorMessage(error, 'Unable to add feed') },
			{ status: 400 }
		);
	}
};
