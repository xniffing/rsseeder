import { addBookmark } from '$lib/server/archive';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const payload = (await request.json()) as { entryId?: string };
		if (!payload.entryId) {
			return Response.json({ error: 'entryId is required' }, { status: 400 });
		}

		await addBookmark(platform, locals.user, payload.entryId);
		return Response.json({ ok: true });
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : 'Unable to bookmark entry' },
			{ status: 400 }
		);
	}
};
