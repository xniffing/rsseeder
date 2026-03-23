const CACHE_NAME = 'archive-v1';

const PRECACHE_URLS = ['/feed', '/icon-192.png', '/icon-512.png'];

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

	// Skip API routes and auth routes
	if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

	// Network-first for navigation (HTML pages)
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
					return response;
				})
				.catch(() => caches.match(request))
		);
		return;
	}

	// Cache-first for static assets (JS, CSS, images, fonts)
	if (
		url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/) ||
		url.pathname.startsWith('/_app/')
	) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ||
					fetch(request).then((response) => {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
						return response;
					})
			)
		);
		return;
	}
});
