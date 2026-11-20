// SW.JS NOVO - MATA O SW VELHO E SE MATA
// Não guarda mais nada em cache!

self.addEventListener('install', (e) => {
  console.log('[SW NOVO] Instalando, matando o velho...');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[SW NOVO] Ativando, apagando todo cache velho...');
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          console.log('[SW NOVO] Apagando cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Depois de limpar, se desregistra - não quer mais existir
      return self.registration.unregister();
    }).then(() => {
      console.log('[SW NOVO] Me suicidei, agora o site vai direto sem cache!');
    })
  );
});

// NÃO intercepta mais nada! Deixa passar direto pro Vercel, sem cache!
self.addEventListener('fetch', (e) => {
  // Não faz nada, deixa o navegador buscar direto no Vercel
  return;
});
