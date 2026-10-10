#!/usr/bin/env node
/* Liste des fichiers gardés sur le téléphone pour le mode hors ligne
 * (service worker sw.js). À relancer après tout ajout ou modification de
 * fichier du site :  npm run hors-ligne
 * (npm run check signale une liste périmée). */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const OUT = join(root, 'hors-ligne.js');

function walk(dir) {
  return readdirSync(dir).sort().flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export function liste() {
  const files = ['index.html', ...['css', 'js', 'config', 'assets'].flatMap((d) => walk(join(root, d)).map((p) => relative(root, p).split(sep).join('/')))]
    .filter((f) => !/\.(txt|md)$/i.test(f) && !/(^|\/)\./.test(f));
  const h = createHash('sha256');
  for (const f of files) h.update(f + '\0').update(readFileSync(join(root, f)));
  return { files, version: h.digest('hex').slice(0, 12) };
}

export function contenu() {
  const { files, version } = liste();
  return '/* Généré par tools/generer-hors-ligne.mjs : ne pas modifier à la main. */\n' +
    'self.HORS_LIGNE = ' + JSON.stringify({ version, fichiers: files }, null, 1) + ';\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(OUT, contenu());
  const { files, version } = liste();
  console.log(`✔ hors-ligne.js : ${files.length} fichiers, version ${version}`);
}
