// bump CACHE_VERSION every time you ship a change — that's what makes the update visible
const CACHE_VERSION = "v34";
const CACHE_NAME = `toolhub-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "tools/counter.js",
  "tools/todo.js",
  "tools/wonglao-core.js",
  "tools/wonglao-ohana.js",
  "tools/wonglao-randomcard.js",
  "tools/wonglao-wheel.js",
  "tools/wonglao-chwazi.js",
  "tools/wonglao-quiz.js",
  "tools/hikeprep.js",
  "tools/changelog.js",
  "tools/counter.css",
  "tools/todo.css",
  "tools/wonglao-core.css",
  "tools/wonglao-ohana.css",
  "tools/wonglao-randomcard.css",
  "tools/wonglao-wheel.css",
  "tools/wonglao-chwazi.css",
  "tools/wonglao-quiz.css",
  "tools/hikeprep.css",
  "tools/changelog.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// stale-while-revalidate: serve from cache instantly, refresh cache in background
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
