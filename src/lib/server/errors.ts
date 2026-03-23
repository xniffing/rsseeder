/**
 * Safe error messages that can be shown to clients.
 * Any error message not in this set gets replaced with the fallback.
 */
const SAFE_MESSAGES = new Set([
	'Feed URL is required',
	'Invalid URL',
	'Only HTTP and HTTPS URLs are allowed',
	'Internal hostnames are not allowed',
	'Private IP addresses are not allowed',
	'Unsupported RSS document',
	'Unsupported Atom document',
	'Unsupported feed format',
	'Feed not found',
	'Database is not configured',
	'entryId is required'
]);

export function safeErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error && SAFE_MESSAGES.has(error.message)) {
		return error.message;
	}

	if (error instanceof Error) {
		console.error('Suppressed error detail:', error.message);
	}

	return fallback;
}
