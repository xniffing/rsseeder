/**
 * Simple in-memory rate limiter using a sliding window.
 * On Cloudflare Workers each isolate has its own memory, so this
 * provides per-isolate protection. For stricter global limits,
 * use Cloudflare Rate Limiting rules.
 */

const windows = new Map<string, number[]>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) return;
	lastCleanup = now;

	const cutoff = now - windowMs;
	for (const [key, timestamps] of windows) {
		const filtered = timestamps.filter((t) => t > cutoff);
		if (filtered.length === 0) {
			windows.delete(key);
		} else {
			windows.set(key, filtered);
		}
	}
}

export function rateLimit(
	key: string,
	opts: { windowMs: number; maxRequests: number }
): { allowed: boolean; remaining: number } {
	const now = Date.now();
	const cutoff = now - opts.windowMs;

	cleanup(opts.windowMs);

	const timestamps = (windows.get(key) ?? []).filter((t) => t > cutoff);

	if (timestamps.length >= opts.maxRequests) {
		return { allowed: false, remaining: 0 };
	}

	timestamps.push(now);
	windows.set(key, timestamps);

	return { allowed: true, remaining: opts.maxRequests - timestamps.length };
}

export function rateLimitResponse() {
	return Response.json(
		{ error: 'Too many requests. Please try again later.' },
		{ status: 429, headers: { 'Retry-After': '60' } }
	);
}
