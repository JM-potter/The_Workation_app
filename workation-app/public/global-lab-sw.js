// Only controls the isolated trip screen; domestic routes are never cached.
const CACHE = "workation-trip-offline-v1";
const PATH = "/dashboard/global-lab";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("message", (event) => {
  if (event.data?.type !== "PREPARE_TRIP") return;
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE);
        const paths = (
          Array.isArray(event.data.assets) ? event.data.assets : []
        ).filter((url) => {
          try {
            const u = new URL(url);
            return (
              u.origin === self.location.origin &&
              u.pathname.startsWith("/_next/static/")
            );
          } catch {
            return false;
          }
        });
        await cache.addAll([...new Set([PATH, ...paths])]);
        event.source?.postMessage({ type: "TRIP_OFFLINE_READY" });
      } catch {
        /* Keep online functionality when offline preparation fails. */
      }
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const u = new URL(event.request.url);
  if (event.request.method !== "GET" || u.origin !== self.location.origin)
    return;
  if (
    event.request.mode === "navigate" &&
    (u.pathname === PATH || u.pathname === PATH + "/")
  ) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(PATH, response.clone());
          }
          return response;
        })
        .catch(async () =>
          (await caches.open(CACHE))
            .match(PATH)
            .then((r) => r || Response.error()),
        ),
    );
  } else if (u.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches
        .open(CACHE)
        .then(
          async (cache) =>
            (await cache.match(event.request)) || fetch(event.request),
        ),
    );
  }
});
