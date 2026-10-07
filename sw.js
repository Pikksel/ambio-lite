// Service worker: a small script the browser runs separately from the page.
// It sits between the app and the network, so the app can work offline.
//
// Strategy:
// - App files (HTML/CSS/JS): network first, fall back to the cache.
//   You see your edits right away, and the app still opens offline.
// - Sounds and icons: cache first. They're large and never change.
//
// Bump CACHE_VERSION when you add, rename or replace a sound or icon.

const CACHE_VERSION = "v1";
const CACHE = `ambiolite-${CACHE_VERSION}`;

const SOUND_IDS = ["rain", "ocean", "forest", "fireplace", "wind", "birds", "cafe", "brown_noise"];

const PRECACHE = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "sounds/timer_chime.ogg",
  ...SOUND_IDS.map((id) => `sounds/${id}_loop.ogg`),
];

// install: runs once per new sw.js version. Download everything up front.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting(); // take over immediately instead of waiting for old tabs to close
});

// activate: delete caches from older versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return; // only handle our own files

  if (url.pathname.includes("/sounds/") || url.pathname.includes("/icons/")) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Offline: serve the cached copy
    return (await cache.match(request, { ignoreSearch: true })) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request.url);
  if (!cached) return fetch(request);

  // Browsers often ask for audio in pieces ("Range: bytes=0-").
  // The cache stores whole files, so we cut out the requested piece
  // and answer with "206 Partial Content", like a real server would.
  const range = request.headers.get("range");
  if (!range) return cached;

  const blob = await cached.blob();
  const [, startStr, endStr] = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const start = Number(startStr) || 0;
  const end = endStr ? Number(endStr) : blob.size - 1;

  return new Response(blob.slice(start, end + 1), {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "audio/ogg",
      "Content-Range": `bytes ${start}-${end}/${blob.size}`,
      "Content-Length": String(end - start + 1),
    },
  });
}
