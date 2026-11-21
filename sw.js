/* Service Worker do PAINEL Família
 * - cacheia o app shell (manifesto, ícones, Leaflet) p/ instalar + abrir rápido/offline
 * - rede-only p/ tiles do mapa e Supabase (nunca cacheia — dados ao vivo)
 * - critério de instalabilidade do Chrome: SW com handler de fetch
 */
const CACHE = 'painel-fam-v1';
const SHELL = [
  './manifest-painel.json',
  './icon-painel-192.png',
  './icon-painel-512.png',
  './icon-painel-maskable-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(SHELL.map((u) => c.add(u).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;               // POSTs/GETs do rastreador passam direto
  const url = new URL(req.url);

  // mesmo-origin (HTML, manifesto, ícones) + unpkg (Leaflet) -> cache-first
  const cacheable = url.origin === self.location.origin || url.hostname === 'unpkg.com';
  if (!cacheable) return;                          // tiles OSM/Google + Supabase -> rede only

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => caches.match(req));
    })
  );
});
