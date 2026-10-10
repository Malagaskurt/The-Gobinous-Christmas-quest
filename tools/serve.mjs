// Serveur du jeu, sans dépendance : il sert le site et le suivi des équipes.
// Usage : npm start   (ou : node tools/serve.mjs [port])
// Le site est aussi accessible depuis un téléphone connecté au même
// réseau Wi-Fi, via l'adresse « réseau » affichée au démarrage.
//
// Suivi des équipes (tableau de bord #/suivi) :
//   - chaque téléphone envoie régulièrement un résumé de sa progression ;
//   - les organisateurs consultent la liste et peuvent réinitialiser une
//     équipe à distance (avec le code de suivi).
// Réglages par variables d'environnement :
//   CODE_SUIVI     code d'accès au tableau de bord (défaut : SUIVI2026)
//   SUIVI_FICHIER  fichier de sauvegarde des équipes (défaut : data/equipes.json)
//
// Photos du défi photo (quête 3) : enregistrées dans data/photos/<partie>/
// et téléchargeables par les organisateurs depuis le tableau de bord
// (une par une, ou toutes en un fichier ZIP classé par équipe).
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir, rename } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.argv[2] || process.env.PORT || 8080);
const CODE = String(process.env.CODE_SUIVI || 'SUIVI2026').trim().toUpperCase();
const FILE = process.env.SUIVI_FICHIER || join(root, 'data', 'equipes.json');
const MAX_TEAMS = 500;
const PHOTO_DIR = join(dirname(FILE), 'photos');
const PHOTO_INDEX = join(PHOTO_DIR, 'index.json');
const MAX_PHOTO = 6 * 1024 * 1024;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

/* ------------------------------------------------------------------ */
/* Équipes suivies (en mémoire, sauvegardées dans un fichier JSON)     */
/* ------------------------------------------------------------------ */

let teams = {};
try {
  teams = JSON.parse(readFileSync(FILE, 'utf8')) || {};
} catch { /* premier démarrage */ }

/* Photos : partie → { equipe, photos: { modele: { titre, at } } } */
let photos = {};
try {
  photos = JSON.parse(readFileSync(PHOTO_INDEX, 'utf8')) || {};
} catch { /* aucune photo pour l'instant */ }

async function persistPhotos() {
  await mkdir(PHOTO_DIR, { recursive: true });
  await writeFile(PHOTO_INDEX + '.tmp', JSON.stringify(photos));
  await rename(PHOTO_INDEX + '.tmp', PHOTO_INDEX);
}

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await mkdir(dirname(FILE), { recursive: true });
      await writeFile(FILE + '.tmp', JSON.stringify(teams));
      await rename(FILE + '.tmp', FILE);
    } catch (e) {
      console.error('Sauvegarde du suivi impossible :', e.message);
    }
  }, 300);
}

const validId = (id) => typeof id === 'string' && /^[a-z0-9]{8,40}$/.test(id);
const str = (v, max) => String(v == null ? '' : v).slice(0, max);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/* Résumé envoyé par un téléphone : on ne garde que les champs attendus. */
function clean(b) {
  return {
    equipe: str(b.equipe, 40),
    quete: Math.min(5, Math.max(1, Math.round(num(b.quete)) || 1)),
    etape: str(b.etape, 120),
    termine: !!b.termine,
    joker: !!b.joker,
    ecoule: Math.max(0, num(b.ecoule)),
    chrono: !!b.chrono,
    gelRestant: Math.max(0, num(b.gelRestant)),
    quizEchecs: Math.max(0, Math.round(num(b.quizEchecs))),
    photos: Math.max(0, Math.round(num(b.photos))),
    etages: Math.max(0, Math.round(num(b.etages))),
    test: !!b.test,
  };
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function body(req, max = 8192) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > max) { reject(new Error('trop gros')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// Code du tableau de bord : en-tête X-Code-Suivi, ou ?code= pour les
// liens directs (images, téléchargement du ZIP).
const authorized = (req) => {
  const q = new URL(req.url, 'http://x').searchParams.get('code');
  return String(req.headers['x-code-suivi'] || q || '').trim().toUpperCase() === CODE;
};

const validModel = (m) => typeof m === 'string' && /^[a-z0-9_-]{1,40}$/i.test(m);

/* ------------------------------------------------------------------ */
/* Archive ZIP minimale (fichiers stockés sans compression : les JPEG   */
/* le sont déjà)                                                       */
/* ------------------------------------------------------------------ */

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function zip(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8');
    const crc = crc32(f.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // noms en UTF-8
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(f.data.length, 18);
    local.writeUInt32LE(f.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, f.data);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(f.data.length, 20);
    cen.writeUInt32LE(f.data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, name);
    offset += 30 + name.length + f.data.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}

const safeName = (s) => String(s || 'equipe').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').trim().slice(0, 60) || 'equipe';

function photoList() {
  return Object.entries(photos).map(([id, p]) => ({
    id,
    equipe: p.equipe,
    photos: Object.entries(p.photos).sort((a, b) => a[1].at - b[1].at).map(([modele, x]) => ({
      modele, titre: x.titre, at: x.at, url: `api/photos/${id}/${modele}.jpg`,
    })),
  })).sort((a, b) => String(a.equipe).localeCompare(String(b.equipe), 'fr'));
}

async function api(req, res, path) {
  const now = Date.now();

  // Un téléphone envoie sa progression. Réponse : réinitialisation demandée ?
  if (path === '/api/sync' && req.method === 'POST') {
    const b = await body(req);
    if (!validId(b.id)) return send(res, 400, { erreur: 'identifiant invalide' });
    const prev = teams[b.id];
    if (prev && prev.resetDemande) {
      delete teams[b.id];
      persist();
      return send(res, 200, { ok: true, reset: true });
    }
    if (!prev && Object.keys(teams).length >= MAX_TEAMS) return send(res, 503, { erreur: 'trop d\'équipes' });
    teams[b.id] = Object.assign(clean(b), { id: b.id, debut: prev ? prev.debut : now, recuLe: now });
    persist();
    return send(res, 200, { ok: true });
  }

  // Un téléphone abandonne sa partie (réinitialisée depuis le mode test).
  if (path === '/api/oublier' && req.method === 'POST') {
    const b = await body(req);
    if (validId(b.id) && teams[b.id]) { delete teams[b.id]; persist(); }
    return send(res, 200, { ok: true });
  }

  // Photo du défi photo, envoyée par un téléphone.
  if (path === '/api/photos' && req.method === 'POST') {
    const b = await body(req, MAX_PHOTO * 1.4);
    if (!validId(b.id) || !validModel(b.modele)) return send(res, 400, { erreur: 'photo invalide' });
    const m = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.image || ''));
    if (!m) return send(res, 400, { erreur: 'image invalide' });
    const data = Buffer.from(m[2], 'base64');
    if (!data.length || data.length > MAX_PHOTO) return send(res, 413, { erreur: 'image trop lourde' });
    await mkdir(join(PHOTO_DIR, b.id), { recursive: true });
    await writeFile(join(PHOTO_DIR, b.id, b.modele + '.jpg'), data);
    const entry = photos[b.id] || { equipe: '', photos: {} };
    entry.equipe = str(b.equipe, 40) || entry.equipe;
    entry.photos[b.modele] = { titre: str(b.titre, 60), at: Date.now() };
    photos[b.id] = entry;
    await persistPhotos();
    return send(res, 200, { ok: true });
  }

  // Tableau de bord : routes protégées par le code de suivi.
  if (!path.startsWith('/api/equipes') && !path.startsWith('/api/photos')) return send(res, 404, { erreur: 'introuvable' });
  if (!authorized(req)) return send(res, 401, { erreur: 'code incorrect' });

  if (path === '/api/photos' && req.method === 'GET') {
    return send(res, 200, { equipes: photoList() });
  }
  if (path === '/api/photos.zip' && req.method === 'GET') {
    const files = [];
    for (const t of photoList()) {
      const folder = safeName(t.equipe) + ' (' + t.id.slice(0, 4) + ')';
      let n = 1;
      for (const p of t.photos) {
        try {
          const data = await readFile(join(PHOTO_DIR, t.id, p.modele + '.jpg'));
          files.push({ name: `${folder}/${n++}-${p.modele}.jpg`, data });
        } catch { /* fichier manquant */ }
      }
    }
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="photos-gobinous-christmas-quest.zip"',
      'Cache-Control': 'no-store',
    });
    return res.end(zip(files));
  }
  const pm = path.match(/^\/api\/photos\/([a-z0-9]+)\/([a-z0-9_-]+)\.jpg$/i);
  if (pm && req.method === 'GET') {
    if (!validId(pm[1]) || !validModel(pm[2])) return send(res, 404, { erreur: 'introuvable' });
    try {
      const data = await readFile(join(PHOTO_DIR, pm[1], pm[2] + '.jpg'));
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=60' });
      return res.end(data);
    } catch {
      return send(res, 404, { erreur: 'photo introuvable' });
    }
  }

  if (path === '/api/equipes' && req.method === 'GET') {
    return send(res, 200, { now, equipes: Object.values(teams) });
  }
  const m = path.match(/^\/api\/equipes\/([a-z0-9]+)(\/reinitialiser)?$/);
  if (!m || !teams[m[1]]) return send(res, 404, { erreur: 'équipe introuvable' });
  if (m[2] && req.method === 'POST') {
    teams[m[1]].resetDemande = now;
    persist();
    return send(res, 200, { ok: true });
  }
  if (!m[2] && req.method === 'DELETE') {
    delete teams[m[1]];
    persist();
    return send(res, 200, { ok: true });
  }
  return send(res, 405, { erreur: 'méthode non autorisée' });
}

createServer(async (req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return send(res, 400, { erreur: 'adresse invalide' });
  }
  // Le site peut être servi depuis un sous-dossier : on repère /api/ où qu'il soit.
  const apiAt = path.indexOf('/api/');
  if (apiAt !== -1) {
    try {
      return await api(req, res, path.slice(apiAt));
    } catch {
      return send(res, 400, { erreur: 'requête invalide' });
    }
  }
  try {
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    const parts = relative(root, file).split(sep);
    if (!file.startsWith(root) || parts.includes('.git') || parts[0] === 'data') throw new Error('forbidden');
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    res.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Introuvable');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Gobinous Christmas Quest\n  Local  : http://localhost:${port}/`);
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  Réseau : http://${a.address}:${port}/`);
    }
  }
  console.log(`  Suivi des équipes : http://localhost:${port}/#/suivi (code : ${process.env.CODE_SUIVI ? 'défini par CODE_SUIVI' : CODE})`);
  console.log(`  Mode test : http://localhost:${port}/#/organisateur\n(Ctrl+C pour arrêter)`);
});
