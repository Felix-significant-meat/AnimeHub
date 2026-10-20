/* Anime Hub service worker.
   Goal: make the hub installable as a PWA and give the shell a usable
   offline story. It is deliberately conservative — the hub is a local
   server, so its data is always preferred live:

     · /api/* and /auth/*  → never cached, never intercepted (pass-through)
     · navigations          → network first, cached shell as offline fallback
     · app shell + icons    → stale-while-revalidate
     · posters / episode art→ cache first, pruned so storage stays small

   Bump CACHE on any release that changes the shell; old caches are
   dropped in `activate`. */
const CACHE = "anime-hub-v3";
const SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/icon.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/offline.html",
];

self.addEventListener("install", (e) => {
  // Individual misses must not abort the whole install (an older hub build
  // may not serve every path yet).
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())
  );
});

// Take over from the previous worker immediately instead of waiting for
// every tab to close — the hub's shell changes with each release.
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

const SHELL_SET = new Set(SHELL);

/* Artwork cache needs a ceiling: browsing a large library could otherwise
   grow storage without bound. Only artwork is ever evicted.

   The shell entries are inserted during install, so they are the *oldest*
   keys: trimming oldest-first would evict the app itself before touching a
   single poster, and the offline shell would break exactly when the cache is
   busiest. So prune filters to artwork instead of trusting insertion order. */
const ART_LIMIT = 400;
const isArt = (u) => {
  try { const p = new URL(u, self.location.origin).pathname;
        return p.startsWith("/img/") || p.startsWith("/epimg/"); }
  catch { return false; }
};
async function prune(cacheName, keep) {
  const c = await caches.open(cacheName);
  const art = (await c.keys()).filter((k) => isArt(k.url));
  if (art.length <= keep) return;
  for (const k of art.slice(0, art.length - keep)) await c.delete(k);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return; // AniList images etc. stay untouched

  // Live data: always straight to the hub. Caching /api/* would show stale
  // watch state, which is exactly the thing that must never be wrong.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copy)).catch(() => {});
          return res;
        })
        .catch(async () => (await caches.match("/index.html")) || (await caches.match("/offline.html")) || Response.error())
    );
    return;
  }

  if (isArt(req.url)) {
    // Artwork keeps exact-key matching: its ?v=<mtime> is real cache-busting,
    // and honouring it is the whole point.
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).then(() => prune(CACHE, ART_LIMIT)).catch(() => {});
        }
        return res;
      }))
    );
    return;
  }

  /* Shell assets. index.html asks for them with a cache-buster
     (/style.css?v=118, /app.js?v=122) while install cached the bare path —
     so an exact-key match missed, and offline the page came up unstyled with
     no JavaScript at all. Match on the path alone and store under the bare
     path, so versioned and unversioned requests share one entry. */
  if (SHELL_SET.has(url.pathname)) {
    const key = url.pathname;
    e.respondWith(
      caches.match(key).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(key, res.clone())).catch(() => {});
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // Anything else same-origin: cache first (query ignored, so a stray ?v=
  // still finds a hit), refreshed in the background.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {});
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
