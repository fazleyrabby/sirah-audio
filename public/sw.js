// Offline application shell (SPEC 52). Hand-written; the build fills in VERSION and PRECACHE.
const VERSION = "dev";
const PRECACHE = [];

const SHELL = `sirah-shell-${VERSION}`;
const RUNTIME = "sirah-runtime";

self.addEventListener("install", (event) => {
  // No skipWaiting: a new version takes over on the next visit, never mid-playback.
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("sirah-shell-") && key !== SHELL).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Audio goes straight to the network: range requests and large files are not cached here.
  if (url.pathname.startsWith("/audio/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => cached || fetch(request).catch(() => caches.match("/"))),
    );
    return;
  }

  // Chapter data and visuals: serve what we have, refresh in the background.
  if (url.pathname.startsWith("/content/") || url.pathname.startsWith("/images/")) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const cached = await cache.match(request);
        const fresh = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fresh;
      }),
    );
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
