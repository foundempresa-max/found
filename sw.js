/* ==========================================================
   FOUND · service worker (v22)
   Hace que FOUND se pueda instalar como una app y abra al instante,
   también sin conexión (enseña lo último que se cargó).
   · Páginas: primero la red; si no hay conexión, la copia guardada.
   · Estilos, scripts, letra e iconos: la copia guardada al momento y se
     actualiza por detrás.
   · Fotos de las prendas (Supabase Storage): se guardan las últimas 200.
   · Datos de Supabase (cuentas, prendas, mensajes): siempre de la red, nunca se guardan.
   Al publicar una versión nueva, cambia VERSION para que todos reciban los archivos nuevos.
   ========================================================== */
const VERSION = 'found-v26';
const SHELL = VERSION + '-shell', IMAGES = 'found-images', MAX_IMAGES = 200;
const PRECACHE = [
  './', 'index.html', 'style.css?v=26', 'app.js?v=26', 'config.js?v=22', 'consent.js?v=25', 'motion.css?v=23', 'motion.js?v=22',
  'vendor/supabase.js', 'fonts/hanken-grotesk-latin-wght-normal.woff2', 'fonts/hanken-grotesk-latin-wght-italic.woff2',
  'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest',
  'aviso-legal.html', 'privacidad.html', 'cookies.html', 'legal.js?v=19'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.endsWith('-shell') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(name, max) {
  const c = await caches.open(name), keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // páginas: red primero, copia guardada si no hay conexión
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put(req, copy)); return r; })
      .catch(async () => (await caches.match(req, { ignoreSearch: true })) || (await caches.match('index.html')) || Response.error()));
    return;
  }

  // archivos de la propia web: copia al momento y se actualiza por detrás
  if (url.origin === location.origin) {
    e.respondWith(caches.open(SHELL).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  // fotos de prendas y marcas en Supabase Storage
  if (/\/storage\/v1\/object\/public\//.test(url.pathname)) {
    e.respondWith(caches.open(IMAGES).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === 'opaque') { c.put(req, r.clone()); trim(IMAGES, MAX_IMAGES); } return r; }
      catch { return Response.error(); }
    }));
  }
  // todo lo demás (datos de Supabase, Google, Cloudflare…): siempre de la red
});
