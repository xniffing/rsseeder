import type { Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { clearSessionCookie, readSessionCookie, setSessionCookie, validateSession } from '$lib/server/auth';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isOriginAllowed(request: Request, url: URL): boolean {
	// Allow non-mutating requests
	if (!MUTATING_METHODS.has(request.method)) return true;

	// Cron/internal calls have no origin — allow if they have the cron secret header
	const origin = request.headers.get('origin');
	if (!origin) {
		// Allow requests with the cron secret (server-to-server)
		if (request.headers.get('x-cron-secret')) return true;
		// Block other origin-less mutating requests
		return false;
	}

	// Origin must match the request's own origin
	return origin === url.origin;
}

export const handle: Handle = async ({ event, resolve }) => {
	// CSRF protection: reject cross-origin mutating requests
	if (!isOriginAllowed(event.request, event.url)) {
		return new Response(JSON.stringify({ error: 'Forbidden' }), {
			status: 403,
			headers: { 'content-type': 'application/json' }
		});
	}

	const sessionId = readSessionCookie(event.cookies);
	event.locals.user = null;

	if (sessionId && event.platform?.env.DB) {
		try {
			const result = await validateSession(getDb(event.platform.env.DB), sessionId);
			if (!result) {
				clearSessionCookie(event.cookies);
			} else {
				event.locals.user = result.user;
				if (result.refreshedSession) {
					setSessionCookie(event.cookies, result.refreshedSession, event.url.protocol === 'https:');
				}
			}
		} catch {
			clearSessionCookie(event.cookies);
		}
	}

	// Add security headers
	const response = await resolve(event);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	return response;
};
