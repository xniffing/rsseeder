const CACHE_NAME = 'archive-v2';

const PRECACHE_URLS = ['/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const { request } = event;

	// Skip non-GET requests
	if (request.method !== 'GET') return;

	const url = new URL(request.url);

	// Skip unsupported schemes (e.g. browser extensions)
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		return;
	}

	// Skip API routes, auth routes, and navigation (authenticated HTML pages)
	if (
		url.pathname.startsWith('/api/') ||
		url.pathname.startsWith('/auth/') ||
		request.mode === 'navigate'
	) {
		return;
	}

	// Cache-first for static assets only (JS, CSS, images, fonts)
	if (
		url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/) ||
		url.pathname.startsWith('/_app/')
	) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ||
					fetch(request).then(async (response) => {
						if (response.ok && !response.headers.has('set-cookie')) {
							const clone = response.clone();
							try {
								const cache = await caches.open(CACHE_NAME);
								await cache.put(request, clone);
							} catch {
								// Ignore cache write failures for unsupported/ephemeral requests.
							}
						}
						return response;
					})
			)
		);
		return;
	}
});
