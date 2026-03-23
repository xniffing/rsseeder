import { syncAllFeeds } from '$lib/server/archive';
import { getDb } from '$lib/server/db';
import { rateLimit, rateLimitResponse } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;

	const encoder = new TextEncoder();
	const bufA = encoder.encode(a);
	const bufB = encoder.encode(b);

	let result = 0;
	for (let i = 0; i < bufA.length; i++) {
		result |= bufA[i]! ^ bufB[i]!;
	}

	return result === 0;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const { allowed } = rateLimit('cron_sync', { windowMs: 300_000, maxRequests: 2 });
	if (!allowed) return rateLimitResponse();

	const secret = request.headers.get('x-cron-secret');
	if (!secret || !platform?.env.CRON_SECRET || !timingSafeEqual(secret, platform.env.CRON_SECRET)) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!platform?.env.DB) {
		return Response.json({ error: 'Database not configured' }, { status: 500 });
	}

	const db = getDb(platform.env.DB);
	const result = await syncAllFeeds(db);

	return Response.json(result);
};
