const CACHE_NAME = "interactive-pdf-cache-v4";
const APP_SHELL = ["/", "/mainfest.json", "/app-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/** Same-origin PDF presign / proxy route — never use offline cache behavior; cookies must attach. */
function isPdfPresignApiPath(pathname) {
  return /^\/api\/files\/[^/]+\/pdf-stream\/?$/.test(pathname);
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (isPdfPresignApiPath(requestUrl.pathname)) {
    event.respondWith(
      fetch(event.request.url, {
        method: "GET",
        headers: event.request.headers,
        credentials: "include",
        cache: "no-store",
        redirect: event.request.redirect,
        referrer: event.request.referrer,
        integrity: event.request.integrity,
      })
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request, "/"));
    return;
  }

  if (requestUrl.pathname.startsWith("/_next/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (event.request.destination === "image" || event.request.destination === "font") {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === "basic") {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    if (fallbackPath) {
      const fallback = await cache.match(fallbackPath);
      if (fallback) {
        return fallback;
      }
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise || Response.error();
}
