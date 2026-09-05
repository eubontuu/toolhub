// bump CACHE_VERSION every time you ship a change — that's what makes the update visible
const CACHE_VERSION = "v96";
const CACHE_NAME = `toolhub-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "tools/counter.js",
  "tools/todo.js",
  "tools/quickstart.js",
  "tools/wonglao-core.js",
  "tools/wonglao-ohana.js",
  "tools/wonglao-randomcard.js",
  "tools/wonglao-wheel.js",
  "tools/wonglao-chwazi.js",
  "tools/wonglao-quiz.js",
  "tools/huay.js",
  "tools/fortune.js",
  "tools/hikeprep.js",
  "tools/memories.js",
  "tools/changelog.js",
  "tools/snake.js",
  "tools/jumpking.js",
  "tools/mathquiz.js",
  "tools/sudoku.js",
  "tools/2048.js",
  "tools/game24.js",
  "tools/games-core.js",
  "tools/counter.css",
  "tools/todo.css",
  "tools/quickstart.css",
  "tools/wonglao-core.css",
  "tools/wonglao-ohana.css",
  "tools/wonglao-randomcard.css",
  "tools/wonglao-wheel.css",
  "tools/wonglao-chwazi.css",
  "tools/wonglao-quiz.css",
  "tools/huay.css",
  "tools/fortune.css",
  "tools/hikeprep.css",
  "tools/memories.css",
  "tools/changelog.css",
  "tools/snake.css",
  "tools/jumpking.css",
  "tools/mathquiz.css",
  "tools/sudoku.css",
  "tools/2048.css",
  "tools/game24.css",
  "tools/games-core.css",
  "icons/emoji/abacus.svg",
  "icons/emoji/beers.svg",
  "icons/emoji/boot.svg",
  "icons/emoji/joker.svg",
  "icons/emoji/flower-card.svg",
  "icons/emoji/ferris-wheel.svg",
  "icons/emoji/hand.svg",
  "icons/emoji/zap.svg",
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
