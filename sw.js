/* Mode hors ligne du Gobinous Christmas Club.
 * Au premier passage, le téléphone garde une copie de tout le site
 * (pages, images, musiques, vidéo de Barnabé). Ensuite, si le réseau
 * tombe, le site s'ouvre et le jeu continue avec cette copie. Quand le
 * réseau est là, les pages sont reprises du serveur (toujours à jour).
 * Les envois (photos, Gobz, avis, Vlog, suivi) passent toujours par le
 * réseau : le jeu les garde ou les réessaie quand il revient.
 * Liste des fichiers : hors-ligne.js (npm run hors-ligne). */
importScripts('hors-ligne.js');

var H = self.HORS_LIGNE;
var CACHE = 'gobinous-' + H.version;
var MEDIA = /\.(mp3|mp4|webm|jpe?g|png|svg|woff2|gif|webp)$/i;
var DELAI = 3500; // au-delà, réseau jugé trop lent : copie locale

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // Fichier par fichier : un échec isolé n'empêche pas le reste.
    return Promise.all(H.fichiers.map(function (f) {
      return fetch(f, { cache: 'reload' }).then(function (r) { if (r.ok && r.status === 200) return c.put(f, r); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return /^gobinous-/.test(k) && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function local(req) {
  var url = new URL(req.url);
  var path = url.pathname.slice(new URL(self.registration.scope).pathname.length) || 'index.html';
  if (req.mode === 'navigate') path = 'index.html';
  return caches.open(CACHE).then(function (c) { return c.match(path); });
}

/* Lecture partielle (Range) servie depuis la copie : indispensable pour la
 * vidéo et l'audio sur iPhone. */
function partial(res, range) {
  return res.arrayBuffer().then(function (buf) {
    var m = /bytes=(\d*)-(\d*)/.exec(range) || [];
    var size = buf.byteLength;
    var start = m[1] ? Number(m[1]) : m[2] ? size - Number(m[2]) : 0;
    var end = m[1] && m[2] ? Number(m[2]) : size - 1;
    start = Math.max(0, start); end = Math.min(end, size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    return new Response(buf.slice(start, end + 1), {
      status: 206,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes',
      },
    });
  });
}

/* Réseau d'abord (avec délai), copie locale sinon. */
function networkFirst(req) {
  return new Promise(function (resolve) {
    var done = false;
    function fallback() {
      if (done) return;
      local(req).then(function (r) { if (r && !done) { done = true; resolve(r); } });
    }
    var timer = setTimeout(fallback, DELAI);
    fetch(req).then(function (r) {
      clearTimeout(timer);
      if (done) return;
      done = true;
      resolve(r);
    }, function () {
      clearTimeout(timer);
      local(req).then(function (r) {
        if (done) return;
        done = true;
        resolve(r || Response.error());
      });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin || /\/api\//.test(url.pathname)) return;
  if (MEDIA.test(url.pathname)) {
    // Médias : copie locale d'abord (rapide, et la vidéo marche hors ligne).
    e.respondWith(local(req).then(function (r) {
      if (!r) return fetch(req);
      var range = req.headers.get('range');
      return range ? partial(r, range) : r;
    }));
    return;
  }
  e.respondWith(networkFirst(req));
});
