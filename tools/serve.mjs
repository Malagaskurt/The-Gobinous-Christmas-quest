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
//
// Christmas Party : défis validés par photo ou vidéo (data/party/), points
// (Gobz) comptés ici d'après config/party.js, classement public.
// Christmas Wrap-Up : réponses anonymes au questionnaire (data/avis.json).
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir, rename } from 'node:fs/promises';
import { readFileSync, createWriteStream } from 'node:fs';
import { unlink, rm } from 'node:fs/promises';
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
const PARTY_DIR = join(dirname(FILE), 'party');
const PARTY_FILE = join(PARTY_DIR, 'joueurs.json');
const AVIS_FILE = join(dirname(FILE), 'avis.json');
const MAX_MEDIA = 80 * 1024 * 1024;
const MEDIA = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heic',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/3gpp': '3gp',
};
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

/* Christmas Party : joueurs et défis validés. */
let party = {};
try {
  party = JSON.parse(readFileSync(PARTY_FILE, 'utf8')) || {};
} catch { /* aucune partie de défis */ }
async function persistParty() {
  await mkdir(PARTY_DIR, { recursive: true });
  await writeFile(PARTY_FILE + '.tmp', JSON.stringify(party));
  await rename(PARTY_FILE + '.tmp', PARTY_FILE);
}

/* Christmas Wrap-Up : réponses anonymes (une par téléphone). */
let avis = {};
try {
  avis = JSON.parse(readFileSync(AVIS_FILE, 'utf8')) || {};
} catch { /* aucune réponse */ }
async function persistAvis() {
  await mkdir(dirname(AVIS_FILE), { recursive: true });
  await writeFile(AVIS_FILE + '.tmp', JSON.stringify(avis));
  await rename(AVIS_FILE + '.tmp', AVIS_FILE);
}

/* Défis et points : lus dans config/party.js (fichier du site), à chaque
 * fois pour tenir compte d'une modification sans redémarrer. */
async function partyConfig() {
  try {
    const src = await readFile(join(root, 'config', 'party.js'), 'utf8');
    const win = {};
    new Function('window', src)(win);
    return (win.GAME_CONFIG && win.GAME_CONFIG.party) || { defis: [] };
  } catch {
    return { defis: [] };
  }
}

function partyPoints(p) {
  return Object.values(p.defis || {}).reduce((n, d) => n + (d.points || 0), 0);
}

function classement() {
  return Object.entries(party)
    .map(([id, p]) => ({ id, nom: p.nom, points: partyPoints(p), defis: Object.keys(p.defis || {}).length, dernier: p.dernier || 0 }))
    .sort((a, b) => b.points - a.points || a.dernier - b.dernier || String(a.nom).localeCompare(String(b.nom), 'fr'));
}

/* Réception d'un fichier (photo ou vidéo) directement sur le disque. */
function receive(req, file, max) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const out = createWriteStream(file);
    req.on('data', (c) => {
      size += c.length;
      if (size > max) { req.destroy(); out.destroy(); reject(Object.assign(new Error('trop gros'), { code: 413 })); }
    });
    req.on('error', reject);
    out.on('error', reject);
    out.on('finish', () => resolve(size));
    req.pipe(out);
  });
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
    chef: str(b.chef, 40),
    reporter: str(b.reporter, 40),
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

  // Christmas Party : inscription d'un joueur (ou changement de nom).
  if (path === '/api/party/joueur' && req.method === 'POST') {
    const b = await body(req);
    if (!validId(b.id) || !str(b.nom, 40).trim()) return send(res, 400, { erreur: 'joueur invalide' });
    if (!party[b.id] && Object.keys(party).length >= MAX_TEAMS) return send(res, 503, { erreur: 'trop de joueurs' });
    const p = party[b.id] || { defis: {}, debut: now };
    p.nom = str(b.nom, 40).trim();
    party[b.id] = p;
    await persistParty();
    return send(res, 200, { ok: true, points: partyPoints(p), defis: Object.keys(p.defis) });
  }

  // Christmas Party : preuve d'un défi (photo ou vidéo brute dans le corps).
  if (path === '/api/party/preuve' && req.method === 'POST') {
    const q = new URL(req.url, 'http://x').searchParams;
    const id = q.get('id');
    const n = Number(q.get('defi'));
    const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const cfg = await partyConfig();
    const defi = cfg.defis[n - 1];
    if (!validId(id) || !defi || !Number.isInteger(n)) return send(res, 400, { erreur: 'défi invalide' });
    if (!MEDIA[type]) return send(res, 415, { erreur: 'format non pris en charge' });
    const p = party[id] || { defis: {}, debut: now };
    p.nom = str(q.get('nom'), 40).trim() || p.nom || 'Sans nom';
    const dir = join(PARTY_DIR, id);
    await mkdir(dir, { recursive: true });
    const name = `defi-${String(n).padStart(2, '0')}.${MEDIA[type]}`;
    const tmp = join(dir, name + '.part');
    try {
      await receive(req, tmp, MAX_MEDIA);
    } catch (e) {
      await unlink(tmp).catch(() => {});
      return send(res, e.code === 413 ? 413 : 400, { erreur: e.code === 413 ? 'fichier trop lourd' : 'envoi interrompu' });
    }
    // Un seul fichier par défi : on remplace l'ancien s'il existe.
    const old = p.defis[n];
    if (old && old.fichier && old.fichier !== name) await unlink(join(dir, old.fichier)).catch(() => {});
    await rename(tmp, join(dir, name));
    p.defis[n] = { at: now, points: Number(defi.points) || 0, fichier: name, type, titre: str(defi.titre, 60) };
    p.dernier = now;
    party[id] = p;
    await persistParty();
    return send(res, 200, { ok: true, points: partyPoints(p), defis: Object.keys(p.defis) });
  }

  // Christmas Party : classement public (noms et points seulement).
  if (path === '/api/party/classement' && req.method === 'GET') {
    return send(res, 200, { now, joueurs: classement().map(({ id, nom, points, defis }) => ({ id, nom, points, defis })) });
  }

  // Christmas Wrap-Up : réponses anonymes (une par téléphone, modifiable).
  if (path === '/api/avis' && req.method === 'POST') {
    const b = await body(req, 16384);
    if (!validId(b.id) || !b.reponses || typeof b.reponses !== 'object') return send(res, 400, { erreur: 'réponses invalides' });
    if (!avis[b.id] && Object.keys(avis).length >= 5000) return send(res, 503, { erreur: 'trop de réponses' });
    const reponses = {};
    for (const [k, v] of Object.entries(b.reponses).slice(0, 10)) {
      if (!/^[a-z0-9_-]{1,30}$/i.test(k)) continue;
      reponses[k] = typeof v === 'number' ? Math.max(0, Math.min(10, Math.round(v))) : str(v, 1000);
    }
    avis[b.id] = { at: now, reponses };
    await persistAvis();
    return send(res, 200, { ok: true });
  }

  // Tableau de bord : routes protégées par le code de suivi.
  if (!/^\/api\/(equipes|photos|party|avis)/.test(path)) return send(res, 404, { erreur: 'introuvable' });
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

  // Party (organisateurs) : joueurs, défis et preuves.
  if (path === '/api/party' && req.method === 'GET') {
    return send(res, 200, {
      now,
      joueurs: classement().map((c) => ({
        ...c,
        preuves: Object.entries(party[c.id].defis || {}).map(([n, d]) => ({
          defi: Number(n), titre: d.titre, points: d.points, type: d.type, at: d.at,
          url: `api/party/${c.id}/${d.fichier}`,
        })).sort((a, b) => a.defi - b.defi),
      })),
    });
  }
  if (path === '/api/party.zip' && req.method === 'GET') {
    const files = [];
    for (const c of classement()) {
      const folder = safeName(c.nom) + ' (' + c.id.slice(0, 4) + ')';
      for (const d of Object.values(party[c.id].defis || {})) {
        try { files.push({ name: `${folder}/${d.fichier}`, data: await readFile(join(PARTY_DIR, c.id, d.fichier)) }); } catch { /* manquant */ }
      }
    }
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="defis-gobinous-christmas-party.zip"',
      'Cache-Control': 'no-store',
    });
    return res.end(zip(files));
  }
  const fm = path.match(/^\/api\/party\/([a-z0-9]+)\/(defi-\d{2}\.[a-z0-9]{2,5})$/);
  if (fm && req.method === 'GET') {
    if (!validId(fm[1])) return send(res, 404, { erreur: 'introuvable' });
    const d = Object.values((party[fm[1]] || {}).defis || {}).find((x) => x.fichier === fm[2]);
    if (!d) return send(res, 404, { erreur: 'introuvable' });
    try {
      const file = join(PARTY_DIR, fm[1], fm[2]);
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': d.type, 'Cache-Control': 'private, max-age=60', 'Content-Length': data.length });
      return res.end(data);
    } catch {
      return send(res, 404, { erreur: 'introuvable' });
    }
  }
  const dm = path.match(/^\/api\/party\/([a-z0-9]+)(?:\/(\d{1,2}))?$/);
  if (dm && req.method === 'DELETE' && party[dm[1]]) {
    const p = party[dm[1]];
    if (dm[2]) {
      const d = p.defis[dm[2]];
      if (d) { await unlink(join(PARTY_DIR, dm[1], d.fichier)).catch(() => {}); delete p.defis[dm[2]]; }
    } else {
      await rm(join(PARTY_DIR, dm[1]), { recursive: true, force: true });
      delete party[dm[1]];
    }
    await persistParty();
    return send(res, 200, { ok: true });
  }

  // Wrap-Up (organisateurs) : toutes les réponses.
  if (path === '/api/avis' && req.method === 'GET') {
    return send(res, 200, { now, avis: Object.values(avis).sort((a, b) => a.at - b.at) });
  }
  if (path === '/api/avis' && req.method === 'DELETE') {
    avis = {};
    await persistAvis();
    return send(res, 200, { ok: true });
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
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    const head = {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Accept-Ranges': 'bytes',
    };
    // Lecture par morceaux (Range) : indispensable aux vidéos sur iPhone.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range && (range[1] || range[2])) {
      const size = info.size;
      let start = range[1] ? Number(range[1]) : size - Number(range[2]);
      let end = range[1] && range[2] ? Number(range[2]) : size - 1;
      start = Math.max(0, start);
      end = Math.min(end, size - 1);
      if (start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` });
        return res.end();
      }
      const data = await readFile(file);
      res.writeHead(206, { ...head, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
      return res.end(data.subarray(start, end + 1));
    }
    res.writeHead(200, head);
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
