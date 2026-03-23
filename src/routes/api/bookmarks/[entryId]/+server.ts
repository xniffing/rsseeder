import { removeBookmark } from '$lib/server/archive';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, params, platform }) => {
	if (!locals.user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		await removeBookmark(platform, locals.user, params.entryId);
		return Response.json({ ok: true });
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : 'Unable to remove bookmark' },
			{ status: 400 }
		);
	}
};
