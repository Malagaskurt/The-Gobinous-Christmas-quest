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
};

/* ------------------------------------------------------------------ */
/* Équipes suivies (en mémoire, sauvegardées dans un fichier JSON)     */
/* ------------------------------------------------------------------ */

let teams = {};
try {
  teams = JSON.parse(readFileSync(FILE, 'utf8')) || {};
} catch { /* premier démarrage */ }

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
    lieux: Math.max(0, Math.round(num(b.lieux))),
    test: !!b.test,
  };
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 8192) { reject(new Error('trop gros')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const authorized = (req) => String(req.headers['x-code-suivi'] || '').trim().toUpperCase() === CODE;

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

  // Tableau de bord : routes protégées par le code de suivi.
  if (!path.startsWith('/api/equipes')) return send(res, 404, { erreur: 'introuvable' });
  if (!authorized(req)) return send(res, 401, { erreur: 'code incorrect' });

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
