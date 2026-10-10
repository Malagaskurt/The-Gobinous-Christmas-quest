// Vérifie les fichiers du dossier config/ sans ouvrir de navigateur.
// Usage : npm run check
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const files = ['parametres', 'textes', 'quiz', 'quetes', 'etapes', 'club', 'party', 'wrapup', 'vlog'].map((f) => `config/${f}.js`);
const context = { window: {} };
context.globalThis = context;
vm.createContext(context);

let syntaxErrors = 0;
for (const f of files) {
  try {
    vm.runInContext(readFileSync(root + f, 'utf8'), context, { filename: f });
  } catch (e) {
    syntaxErrors++;
    const where = (e.stack || '').split('\n').find((l) => l.includes(f)) || f;
    console.error(`✖ ${f} : ${e.message}\n   ${where.trim()}`);
  }
}
vm.runInContext(readFileSync(root + 'js/validate.js', 'utf8'), context, { filename: 'js/validate.js' });
const report = context.window.GQValidate(context.window.GAME_CONFIG);

const section = (title, items, mark) => {
  console.log(`\n${title} (${items.length})`);
  if (!items.length) console.log('  —');
  for (const i of items) console.log(`  ${mark} ${i}`);
};
section('Erreurs', report.errors, '✖');
section('Avertissements', report.warnings, '!');
section('Textes provisoires [À CONFIGURER]', report.todos, '·');
section('Informations à vérifier avant publication', report.toVerify, '?');

const failed = syntaxErrors + report.errors.length;
console.log(failed ? `\n✖ ${failed} erreur(s) à corriger.` : '\n✔ Configuration valide (pensez à traiter les points ci-dessus avant l\'événement).');
process.exit(failed ? 1 : 0);
