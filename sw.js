// Dodge: lets the installed game open offline. Pages come from the network first, so updates
// show up right away, and fall back to the last copy. Other files are cached once fetched.
// Music and play counts are left alone. Music: browsers stream it in pieces, which a plain cache can't serve.
const CACHE = "dodge-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/icon-192.png"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || r.destination === "audio" || r.headers.has("range")) return;
  if (new URL(r.url).hostname.endsWith("goatcounter.com")) return; // play counts must reach the network
  const keep = (res) => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); } return res; };
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(keep).catch(() => caches.match(r).then((m) => m || caches.match("/"))));
    return;
  }
  e.respondWith(caches.match(r).then((m) => m || fetch(r).then(keep)));
});
