/* sw.js — ElhyAI Academy (PWA)
   - Solo guarda archivos propios del sitio (HTML, CSS, JS, imágenes).
   - Firebase, YouTube y demás servicios externos NUNCA se guardan:
     siempre van directo a internet, así los datos están al día.
   - Páginas: primero internet; si no hay señal, la última copia.
   Para forzar actualización en todos los celulares, cambia VERSION. */
const VERSION = 'elhyai-v1';
const CORE = [
  'index.html', 'cursos.html', 'login.html', 'registro.html', 'dashboard.html',
  'validar.html', 'certificado.html', 'recuperar.html', 'terminos.html',
  'style.css', 'mobile.css', 'mobile.js', 'app.js', 'firebase.js', 'certificado-pdf.js',
  'logo-elhyai.png', 'icons/icon-192.png', 'icons/icon-512.png', 'offline.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // externos: sin tocar
  if (url.pathname.endsWith('/sw.js')) return;

  // Páginas: red primero, copia guardada si no hay internet
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then(r => r || caches.match('offline.html')))
    );
    return;
  }

  // CSS/JS/imágenes: copia rápida y se actualiza en segundo plano
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
