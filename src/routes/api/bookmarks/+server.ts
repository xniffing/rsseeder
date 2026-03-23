import { addBookmark } from '$lib/server/archive';
import { safeErrorMessage } from '$lib/server/errors';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const payload = (await request.json()) as { entryId?: string };
		if (!payload.entryId || typeof payload.entryId !== 'string' || payload.entryId.length > 64) {
			return Response.json({ error: 'entryId is required' }, { status: 400 });
		}

		await addBookmark(platform, locals.user, payload.entryId);
		return Response.json({ ok: true });
	} catch (error) {
		return Response.json(
			{ error: safeErrorMessage(error, 'Unable to bookmark entry') },
			{ status: 400 }
		);
	}
};
