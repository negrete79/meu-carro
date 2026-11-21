/* Service Worker do Rastreador + Rádio
 * - cacheia o app shell (HTML, manifest, ícones) para abrir offline / instável
 * - rede-only para tudo que é cross-origin (rádio ao vivo, Supabase, Open-Meteo)
 * - nunca tenta cachear streams de áudio nem POSTs
 */
const CACHE = 'rastreador-v1';
const SHELL = [
  './rastreador-radio.html',
  './manifest-rastreador.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
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
  if (req.method !== 'GET') return;            // POSTs do rastreador passam direto
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // rádio / supabase / clima = rede only

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => caches.match('./rastreador-radio.html'));
    })
  );
});
