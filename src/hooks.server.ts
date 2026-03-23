import type { Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { clearSessionCookie, readSessionCookie, validateSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = readSessionCookie(event.cookies);
	event.locals.user = null;

	if (sessionId && event.platform?.env.DB) {
		try {
			event.locals.user = await validateSession(getDb(event.platform.env.DB), sessionId);
			if (!event.locals.user) {
				clearSessionCookie(event.cookies);
			}
		} catch {
			clearSessionCookie(event.cookies);
		}
	}

	return resolve(event);
};
