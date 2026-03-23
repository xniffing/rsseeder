import { redirect } from '@sveltejs/kit';
import { deleteSession, clearSessionCookie, readSessionCookie } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, platform }) => {
	const sessionId = readSessionCookie(cookies);

	if (sessionId && platform?.env.DB) {
		await deleteSession(getDb(platform.env.DB), sessionId);
	}

	clearSessionCookie(cookies);
	throw redirect(302, '/');
};
