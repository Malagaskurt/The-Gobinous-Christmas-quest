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
import { readFileSync, createWriteStream, createReadStream } from 'node:fs';
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
// Photos et vidéos (défis de la Party, Vlog) : tous les formats d'image et
// de vidéo sont acceptés, fichiers lourds compris (écrits au fil de l'eau).
const MAX_MEDIA = 8 * 1024 * 1024 * 1024; // 8 Go par fichier
const VLOG_DIR = join(dirname(FILE), 'vlog');
const VLOG_INDEX = join(VLOG_DIR, 'index.json');
const MEDIA_EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif', 'image/gif': 'gif',
  'image/avif': 'avif', 'image/tiff': 'tiff', 'image/bmp': 'bmp', 'image/svg+xml': 'svg',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/3gpp': '3gp', 'video/3gpp2': '3g2',
  'video/x-msvideo': 'avi', 'video/x-matroska': 'mkv', 'video/mpeg': 'mpg', 'video/x-m4v': 'm4v', 'video/ogg': 'ogv',
};
const EXT_TYPE = Object.fromEntries(Object.entries(MEDIA_EXT).map(([t, e]) => [e, t]));
Object.assign(EXT_TYPE, { jpeg: 'image/jpeg', jpe: 'image/jpeg', tif: 'image/tiff', dng: 'image/x-adobe-dng', raw: 'image/x-raw', cr2: 'image/x-canon-cr2', nef: 'image/x-nikon-nef', arw: 'image/x-sony-arw', mts: 'video/mp2t', m2ts: 'video/mp2t', ts: 'video/mp2t', wmv: 'video/x-ms-wmv', flv: 'video/x-flv', mpeg: 'video/mpeg', hevc: 'video/mp4' });

/* Type et extension d'un fichier reçu : d'après l'en-tête, sinon d'après
 * le nom d'origine. Refusé seulement si ce n'est ni une image ni une vidéo. */
function mediaKind(contentType, name) {
  const type = String(contentType || '').split(';')[0].trim().toLowerCase();
  const ext = (String(name || '').match(/\.([a-z0-9]{2,5})$/i) || [])[1];
  const e = ext ? ext.toLowerCase() : '';
  if (/^(image|video)\/[a-z0-9.+-]+$/.test(type)) return { type, ext: MEDIA_EXT[type] || (EXT_TYPE[e] ? e : type.split('/')[1].replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin') };
  if (EXT_TYPE[e]) return { type: EXT_TYPE[e], ext: e };
  return null;
}
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
async function siteConfig(name) {
  try {
    const src = await readFile(join(root, 'config', name + '.js'), 'utf8');
    const win = {};
    new Function('window', src)(win);
    return (win.GAME_CONFIG && win.GAME_CONFIG[name]) || null;
  } catch {
    return null;
  }
}
async function partyConfig() {
  return (await siteConfig('party')) || { defis: [] };
}

/* Secret Santa : un numéro unique par téléphone, tiré au hasard parmi ceux
 * qui restent (total : config/wrapup.js → santa.total). */
const SANTA_FILE = join(dirname(FILE), 'santa.json');
let santa = {};
try {
  santa = JSON.parse(readFileSync(SANTA_FILE, 'utf8')) || {};
} catch { /* aucun tirage */ }
async function persistSanta() {
  await mkdir(dirname(SANTA_FILE), { recursive: true });
  await writeFile(SANTA_FILE + '.tmp', JSON.stringify(santa));
  await rename(SANTA_FILE + '.tmp', SANTA_FILE);
}

function partyPoints(p) {
  return Object.values(p.defis || {}).reduce((n, d) => n + (d.points || 0), 0);
}

function classement() {
  return Object.entries(party)
    .map(([id, p]) => ({ id, nom: p.nom, points: partyPoints(p), defis: Object.keys(p.defis || {}).length, dernier: p.dernier || 0 }))
    .sort((a, b) => b.points - a.points || a.dernier - b.dernier || String(a.nom).localeCompare(String(b.nom), 'fr'));
}

/* Réception d'un fichier (photo ou vidéo) directement sur le disque, avec
 * calcul de l'empreinte CRC32 au passage (utile pour l'archive ZIP).
 * Résolue { size, crc }. */
function receive(req, file, max) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let c = -1;
    const out = createWriteStream(file);
    req.on('data', (chunk) => {
      size += chunk.length;
      for (let i = 0; i < chunk.length; i++) c = CRC[(c ^ chunk[i]) & 0xff] ^ (c >>> 8);
      if (size > max) { req.destroy(); out.destroy(); reject(Object.assign(new Error('trop gros'), { code: 413 })); }
    });
    req.on('aborted', () => reject(new Error('interrompu')));
    req.on('error', reject);
    out.on('error', reject);
    out.on('finish', () => resolve({ size, crc: (c ^ -1) >>> 0 }));
    req.pipe(out);
  });
}

/* Envoi d'un gros fichier (lecture par morceaux, vidéos sur iPhone). */
async function streamFile(req, res, file, type, name) {
  const info = await stat(file);
  const head = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=60' };
  if (name) head['Content-Disposition'] = `inline; filename*=UTF-8''${encodeURIComponent(name)}`;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : info.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : info.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, info.size - 1);
    if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); return res.end(); }
    res.writeHead(206, { ...head, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...head, 'Content-Length': info.size });
  return createReadStream(file).pipe(res);
}

/* Archive ZIP écrite au fil de l'eau (fichiers stockés sans compression,
 * format ZIP64 au-delà de 4 Go). files : [{ name, path, size, crc }]. */
async function streamZip(res, files, filename) {
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  });
  const write = (buf) => new Promise((ok) => { if (res.write(buf)) ok(); else res.once('drain', ok); });
  const big = 0xffffffff;
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8');
    const z64 = f.size >= big || offset >= big;
    const extra = z64 ? Buffer.alloc(20) : Buffer.alloc(0);
    if (z64) { extra.writeUInt16LE(1, 0); extra.writeUInt16LE(16, 2); extra.writeBigUInt64LE(BigInt(f.size), 4); extra.writeBigUInt64LE(BigInt(f.size), 12); }
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(z64 ? 45 : 20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt32LE(f.crc >>> 0, 14);
    local.writeUInt32LE(z64 ? big : f.size, 18);
    local.writeUInt32LE(z64 ? big : f.size, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(extra.length, 28);
    await write(Buffer.concat([local, name, extra]));
    await new Promise((ok, ko) => {
      const rs = createReadStream(f.path);
      rs.on('data', (chunk) => { if (!res.write(chunk)) { rs.pause(); res.once('drain', () => rs.resume()); } });
      rs.on('end', ok);
      rs.on('error', ko);
    });
    const cz64 = f.size >= big || offset >= big;
    const cextra = cz64 ? Buffer.alloc(28) : Buffer.alloc(0);
    if (cz64) {
      cextra.writeUInt16LE(1, 0); cextra.writeUInt16LE(24, 2);
      cextra.writeBigUInt64LE(BigInt(f.size), 4); cextra.writeBigUInt64LE(BigInt(f.size), 12); cextra.writeBigUInt64LE(BigInt(offset), 20);
    }
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(cz64 ? 45 : 20, 4);
    cen.writeUInt16LE(cz64 ? 45 : 20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt32LE(f.crc >>> 0, 16);
    cen.writeUInt32LE(cz64 ? big : f.size, 20);
    cen.writeUInt32LE(cz64 ? big : f.size, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt16LE(cextra.length, 30);
    cen.writeUInt32LE(cz64 ? big : offset, 42);
    central.push(cen, name, cextra);
    offset += 30 + name.length + extra.length + f.size;
  }
  const cd = Buffer.concat(central);
  const tail = [];
  const needs64 = offset >= big || files.length >= 0xffff;
  if (needs64) {
    const z = Buffer.alloc(56);
    z.writeUInt32LE(0x06064b50, 0); z.writeBigUInt64LE(44n, 4); z.writeUInt16LE(45, 12); z.writeUInt16LE(45, 14);
    z.writeBigUInt64LE(BigInt(files.length), 24); z.writeBigUInt64LE(BigInt(files.length), 32);
    z.writeBigUInt64LE(BigInt(cd.length), 40); z.writeBigUInt64LE(BigInt(offset), 48);
    const loc = Buffer.alloc(20);
    loc.writeUInt32LE(0x07064b50, 0); loc.writeBigUInt64LE(BigInt(offset + cd.length), 8); loc.writeUInt32LE(1, 16);
    tail.push(z, loc);
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Math.min(files.length, 0xffff), 8);
  end.writeUInt16LE(Math.min(files.length, 0xffff), 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(needs64 ? big : offset, 16);
  await write(Buffer.concat([cd, ...tail, end]));
  res.end();
}

/* Vlog des Gobinous : photos et vidéos de l'événement. */
let vlog = {};
try {
  vlog = JSON.parse(readFileSync(VLOG_INDEX, 'utf8')) || {};
} catch { /* aucun envoi */ }
async function persistVlog() {
  await mkdir(VLOG_DIR, { recursive: true });
  await writeFile(VLOG_INDEX + '.tmp', JSON.stringify(vlog));
  await rename(VLOG_INDEX + '.tmp', VLOG_INDEX);
}
const newKey = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

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
    const kind = mediaKind(req.headers['content-type'], q.get('fichier'));
    const cfg = await partyConfig();
    const defi = cfg.defis[n - 1];
    if (!validId(id) || !defi || !Number.isInteger(n)) return send(res, 400, { erreur: 'défi invalide' });
    if (!kind) return send(res, 415, { erreur: 'ce fichier n\'est ni une photo ni une vidéo' });
    const type = kind.type;
    const p = party[id] || { defis: {}, debut: now };
    p.nom = str(q.get('nom'), 40).trim() || p.nom || 'Sans nom';
    const dir = join(PARTY_DIR, id);
    await mkdir(dir, { recursive: true });
    const name = `defi-${String(n).padStart(2, '0')}.${kind.ext}`;
    const tmp = join(dir, name + '.part');
    let got;
    try {
      got = await receive(req, tmp, MAX_MEDIA);
    } catch (e) {
      await unlink(tmp).catch(() => {});
      return send(res, e.code === 413 ? 413 : 400, { erreur: e.code === 413 ? 'fichier trop lourd' : 'envoi interrompu' });
    }
    // Un seul fichier par défi : on remplace l'ancien s'il existe.
    const old = p.defis[n];
    if (old && old.fichier && old.fichier !== name) await unlink(join(dir, old.fichier)).catch(() => {});
    await rename(tmp, join(dir, name));
    p.defis[n] = { at: now, points: Number(defi.points) || 0, fichier: name, type, titre: str(defi.titre, 60), taille: got.size, crc: got.crc };
    p.dernier = now;
    party[id] = p;
    await persistParty();
    return send(res, 200, { ok: true, points: partyPoints(p), defis: Object.keys(p.defis) });
  }

  // Vlog : dépôt d'une photo ou d'une vidéo (corps brut, tous formats).
  if (path === '/api/vlog' && req.method === 'POST') {
    const q = new URL(req.url, 'http://x').searchParams;
    const id = q.get('id');
    const original = str(q.get('fichier'), 120).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-');
    const kind = mediaKind(req.headers['content-type'], original);
    if (!validId(id)) return send(res, 400, { erreur: 'envoi invalide' });
    if (!kind) return send(res, 415, { erreur: 'ce fichier n\'est ni une photo ni une vidéo' });
    if (Object.keys(vlog).length >= 20000) return send(res, 503, { erreur: 'trop de fichiers' });
    await mkdir(VLOG_DIR, { recursive: true });
    const key = newKey();
    const stored = `${key}.${kind.ext}`;
    const tmp = join(VLOG_DIR, stored + '.part');
    let got;
    try {
      got = await receive(req, tmp, MAX_MEDIA);
    } catch (e) {
      await unlink(tmp).catch(() => {});
      return send(res, e.code === 413 ? 413 : 400, { erreur: e.code === 413 ? 'fichier trop lourd' : 'envoi interrompu' });
    }
    if (!got.size) { await unlink(tmp).catch(() => {}); return send(res, 400, { erreur: 'fichier vide' }); }
    await rename(tmp, join(VLOG_DIR, stored));
    vlog[key] = { id, nom: str(q.get('nom'), 40).trim() || 'Sans nom', fichier: original || stored, stockage: stored, type: kind.type, taille: got.size, crc: got.crc, at: now };
    await persistVlog();
    return send(res, 200, { ok: true, cle: key });
  }

  // Vlog : ce que ce téléphone a déjà envoyé (identifiant secret du téléphone).
  if (path === '/api/vlog/mes' && req.method === 'GET') {
    const id = new URL(req.url, 'http://x').searchParams.get('id');
    if (!validId(id)) return send(res, 400, { erreur: 'identifiant invalide' });
    const list = Object.entries(vlog).filter(([, v]) => v.id === id)
      .map(([cle, v]) => ({ cle, fichier: v.fichier, type: v.type, taille: v.taille, at: v.at })).sort((a, b) => b.at - a.at);
    return send(res, 200, { envois: list });
  }

  // Secret Santa : tirage (ou rappel) du numéro de ce téléphone.
  if (path === '/api/santa/tirage' && req.method === 'POST') {
    const b = await body(req);
    if (!validId(b.id)) return send(res, 400, { erreur: 'identifiant invalide' });
    if (santa[b.id]) return send(res, 200, { numero: santa[b.id].numero });
    const cfg = (await siteConfig('wrapup')) || {};
    const total = Math.max(1, Math.min(9999, Math.round(num((cfg.santa || {}).total)) || 0));
    const taken = new Set(Object.values(santa).map((x) => x.numero));
    const free = [];
    for (let n = 1; n <= total; n++) if (!taken.has(n)) free.push(n);
    if (!free.length) return send(res, 409, { erreur: 'complet' });
    const numero = free[Math.floor(Math.random() * free.length)];
    santa[b.id] = { numero, at: now };
    await persistSanta();
    return send(res, 200, { numero });
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
  if (!/^\/api\/(equipes|photos|party|avis|vlog|santa)/.test(path)) return send(res, 404, { erreur: 'introuvable' });
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
        const fp = join(PARTY_DIR, c.id, d.fichier);
        let size = d.taille;
        let crc = d.crc;
        if (size == null || crc == null) {
          try { const data = await readFile(fp); size = data.length; crc = crc32(data); } catch { continue; }
        }
        files.push({ name: `${folder}/${d.fichier}`, path: fp, size, crc });
      }
    }
    return streamZip(res, files, 'defis-gobinous-christmas-party.zip');
  }
  const fm = path.match(/^\/api\/party\/([a-z0-9]+)\/(defi-\d{2}\.[a-z0-9]{1,5})$/);
  if (fm && req.method === 'GET') {
    if (!validId(fm[1])) return send(res, 404, { erreur: 'introuvable' });
    const d = Object.values((party[fm[1]] || {}).defis || {}).find((x) => x.fichier === fm[2]);
    if (!d) return send(res, 404, { erreur: 'introuvable' });
    try {
      return await streamFile(req, res, join(PARTY_DIR, fm[1], fm[2]), d.type);
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

  // Vlog (organisateurs) : liste, fichiers, suppression, archive.
  if (path === '/api/vlog' && req.method === 'GET') {
    const list = Object.entries(vlog).map(([cle, v]) => ({ cle, nom: v.nom, fichier: v.fichier, type: v.type, taille: v.taille, at: v.at, url: `api/vlog/${cle}` }))
      .sort((a, b) => b.at - a.at);
    return send(res, 200, { now, fichiers: list, total: list.reduce((n, f) => n + (f.taille || 0), 0) });
  }
  if (path === '/api/vlog.zip' && req.method === 'GET') {
    const files = Object.values(vlog).sort((a, b) => a.at - b.at).map((v, i) => ({
      name: `${safeName(v.nom)}/${String(i + 1).padStart(3, '0')}-${safeName(v.fichier || v.stockage)}`,
      path: join(VLOG_DIR, v.stockage), size: v.taille, crc: v.crc,
    }));
    return streamZip(res, files, 'vlog-gobinous-christmas-club.zip');
  }
  const vm = path.match(/^\/api\/vlog\/([a-z0-9]{6,40})$/);
  if (vm && vlog[vm[1]]) {
    const v = vlog[vm[1]];
    if (req.method === 'GET') return streamFile(req, res, join(VLOG_DIR, v.stockage), v.type, v.fichier);
    if (req.method === 'DELETE') {
      await unlink(join(VLOG_DIR, v.stockage)).catch(() => {});
      delete vlog[vm[1]];
      await persistVlog();
      return send(res, 200, { ok: true });
    }
  }

  // Secret Santa (organisateurs) : numéros tirés, remise à zéro.
  if (path === '/api/santa' && req.method === 'GET') {
    const cfg = (await siteConfig('wrapup')) || {};
    return send(res, 200, { total: Math.round(num((cfg.santa || {}).total)) || 0, tires: Object.values(santa).map((x) => x.numero).sort((a, b) => a - b) });
  }
  if (path === '/api/santa' && req.method === 'DELETE') {
    santa = {};
    await persistSanta();
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

const server = createServer(async (req, res) => {
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
  // Liste du mode hors ligne toujours à jour (fichiers modifiés sur le serveur).
  if (path.endsWith('/hors-ligne.js')) {
    const { contenu } = await import('./generer-hors-ligne.mjs');
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
    return res.end(contenu());
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
});
// Envois longs (grosses vidéos sur un réseau lent) : pas de délai maximal.
server.requestTimeout = 0;
server.timeout = 0;
server.listen(port, '0.0.0.0', () => {
  console.log(`Gobinous Christmas Quest\n  Local  : http://localhost:${port}/`);
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  Réseau : http://${a.address}:${port}/`);
    }
  }
  console.log(`  Suivi des équipes : http://localhost:${port}/#/suivi (code : ${process.env.CODE_SUIVI ? 'défini par CODE_SUIVI' : CODE})`);
  console.log(`  Mode test : http://localhost:${port}/#/organisateur\n(Ctrl+C pour arrêter)`);
});
