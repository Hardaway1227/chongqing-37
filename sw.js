/* sw.js · 离线缓存
   页面 network-first（有网永远拿最新），静态资源 cache-first。
   版本号变了会清掉旧缓存。 */
const VERSION = "chq-v1";
const SHELL = [
  "./", "./index.html", "./plan.html", "./data.html", "./profile.html", "./about-data.html", "./poster.html",
  "./district.html",
  "./assets/css/style.css", "./assets/js/data.js", "./assets/js/main.js",
  "./assets/js/pagefx.js", "./assets/js/agent.js", "./wanzhou/fonts/fonts.css",
  "./manifest.webmanifest", "./assets/icons/icon-192.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
