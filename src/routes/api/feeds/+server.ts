import { addFeedFromUrl, listFeedsApi } from '$lib/server/archive';
import type { RequestHandler } from './$types';

function unauthorized() {
	return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export const GET: RequestHandler = async ({ locals, platform }) => {
	return Response.json({ feeds: await listFeedsApi(platform, locals.user) });
};

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) return unauthorized();

	try {
		const payload = (await request.json()) as { url?: string; category?: string };
		const result = await addFeedFromUrl(platform, locals.user, {
			url: payload.url ?? '',
			category: payload.category
		});

		return Response.json(result);
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : 'Unable to add feed' },
			{ status: 400 }
		);
	}
};
