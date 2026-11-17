// MASA service worker: ana ekrana ekleme ve hızlı açılış için.
// - Sayfalar (navigasyon): önce ağ; internet yoksa son kayıtlı kabuk. Böylece her yayın anında görünür.
// - /assets/* (adı içeriğinin özetiyle değişen dosyalar), yazı tipleri, görseller: önbellekten, yoksa ağdan.
// - /api ve WebSocket asla önbelleğe alınmaz.
const VERSION = 'masa-v2';
const SHELL = '/';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.add(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(SHELL, res.clone()));
          return res;
        })
        .catch(() => caches.match(SHELL).then((r) => r ?? Response.error())),
    );
    return;
  }

  // Görsel listesi her zaman ağdan (yeni görseller hemen görünsün); internet yoksa son kopya
  if (url.pathname === '/art/manifest.json') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r ?? Response.error())),
    );
    return;
  }

  // Görseller: önbellekten hemen, arka planda tazele (aynı adla güncellenen görsel bir sonraki açılışta gelir)
  if (url.pathname.startsWith('/art/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.open(VERSION).then((c) =>
        c.match(req).then((hit) => {
          const net = fetch(req)
            .then((res) => {
              if (res.ok) c.put(req, res.clone());
              return res;
            })
            .catch(() => hit ?? Response.error());
          return hit ?? net;
        }),
      ),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
