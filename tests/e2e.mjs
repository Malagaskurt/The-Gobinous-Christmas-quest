// Test de bout en bout du parcours complet et des cas d'erreur.
// Prérequis (une seule fois) :
//   npm install --no-save playwright && npx playwright install chromium
// Lancement :
//   npm test
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright est requis : npm install --no-save playwright && npx playwright install chromium');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const PORT = 8765;
const BASE = `http://localhost:${PORT}/`;

let passed = 0;
const failures = [];
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✖ ${name}\n      ${String(e.message).split('\n')[0]}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const server = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { cwd: root, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const jsErrors = [];
page.on('pageerror', (e) => jsErrors.push(e.message));

// innerText applique les majuscules CSS et les espaces insécables : on normalise.
const norm = (s) => s.replace(/[\u00a0\u202f]/g, ' ').toLowerCase();
const text = () => page.locator('#app').innerText();
const has = async (s) => norm(await text()).includes(norm(s));
const hash = () => page.evaluate(() => location.hash);
const state = () => page.evaluate(() => window.GQ.state);
const settle = () => page.waitForTimeout(150);
// Chaque chargement de page affiche brièvement l'écran de chargement.
async function go(url) {
  await page.goto(url);
  await page.waitForSelector('#loader', { state: 'detached' });
  await settle();
}
async function reload() {
  await page.reload();
  await page.waitForSelector('#loader', { state: 'detached' });
  await settle();
}
async function clickText(s) {
  await page.getByText(s, { exact: false }).first().click();
  await settle();
}
async function answer(value) {
  await page.fill('.answer-form .field', value);
  await page.click('.answer-form button[type=submit]');
  await settle();
}
async function choose(i) {
  await page.click(`.choice[data-i="${i}"]`);
}
async function nextQuestion() {
  await page.click('[data-action="quiz-move"][data-d="1"]');
  await settle();
}
/* Répond à toutes les questions restantes du thème puis valide. */
async function finishTheme(theme, pick) {
  const cur = (await state()).quiz.current;
  for (let i = cur.index; i < theme.questions.length; i++) {
    await choose(pick(theme.questions[i], i));
    if (i < theme.questions.length - 1) await nextQuestion();
  }
  await page.click('[data-action="quiz-submit"]');
  await page.click('[data-modal-ok]');
  await settle();
}
async function chooseAndValidate(i) {
  await page.click(`.choice[data-i="${i}"]`);
  await page.click('[data-action="validate-choice"]');
  await settle();
}
async function noHorizontalScroll() {
  const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert(ok, 'défilement horizontal détecté');
}

const CFG = await (async () => {
  await go(BASE);
  return page.evaluate(() => window.GAME_CONFIG);
})();
const L = 'ABCD';
const idx = (q) => L.indexOf(q.reponse);

console.log('\nParcours participant');

await step('Accueil : titre, sous-titre et bouton « Commencer l\'aventure »', async () => {
  assert(await has('CHRISTMAS QUEST'), 'titre absent');
  assert(await has('La quête du cadeau disparu'), 'sous-titre absent');
  assert(await has("Commencer l'aventure"), 'bouton absent');
  await noHorizontalScroll();
});

await step('Nom d\'équipe vide refusé, puis accepté', async () => {
  await clickText("Commencer l'aventure");
  await answer('   ');
  assert(await has("Indiquez un nom d'équipe"), 'message d\'erreur absent');
  await answer('Les Testeurs');
  assert((await hash()) === '#/regles', 'pas redirigé vers les règles');
});

await step('Règles affichées avec le texte attendu', async () => {
  for (const s of ['COMMENT JOUER', 'Résolvez les 5 quêtes.', 'Gardez votre joker.', 'Attention au quiz', 'Votre objectif']) {
    assert(await has(s), `texte manquant : ${s}`);
  }
  await noHorizontalScroll();
  await clickText("C'est parti");
  assert((await hash()) === '#/quete/1', 'pas sur la quête 1');
});

await step('Accès direct à une quête non débloquée → redirection', async () => {
  await go(BASE + '#/quete/3');
  await page.waitForTimeout(300);
  assert((await hash()) === '#/quete/1', `hash = ${await hash()}`);
  assert(norm(await page.locator('#toast').innerText()).includes('pas encore débloquée'), 'message absent');
});

await step('QR code d\'un lieu non encore trouvé → refusé', async () => {
  await go(BASE + '#/scan/' + CFG.lieux.B.codeQR);
  await settle();
  assert(await has('Pas si vite'), 'message « trop tôt » absent');
  assert((await state()).quest === 1, 'la progression a changé');
  await go(BASE + '#/scan/XYZ123');
  await settle();
  assert(await has('non reconnu'), 'QR inconnu non signalé');
  await go(BASE + '#/quete/1');
  await settle();
});

const themes = CFG.quiz.themes;
const wrongOf = (q) => (idx(q) === 0 ? 1 : 0);

await step('Quiz : aucune correction pendant les questions, navigation possible', async () => {
  await clickText('Choisir un thème');
  await page.click(`[data-action="start-theme"][data-id="${themes[0].id}"]`);
  await settle();
  assert(await has('Question 1 sur 8'), 'compteur absent');
  assert(await page.locator('[data-action="quiz-move"][data-d="1"]').getAttribute('aria-disabled') === 'true', 'suivant actif sans réponse');
  await choose(wrongOf(themes[0].questions[0]));
  assert(!(await has("Ce n'est pas la bonne réponse")) && !(await has('Bonne réponse')), 'une correction est affichée');
  assert((await page.locator('.choice.is-wrong, .choice.is-correct').count()) === 0, 'la bonne réponse est révélée');
  await nextQuestion();
  assert(await has('Question 2 sur 8'), 'pas de passage à la question 2');
  await page.click('[data-action="quiz-move"][data-d="-1"]');
  await settle();
  assert(await has('Question 1 sur 8'), 'retour impossible');
  assert(await page.locator('.choice.is-selected').count() === 1, 'réponse précédente perdue');
  await nextQuestion();
});

await step('Rechargement en cours de thème → reprise à la même question', async () => {
  await reload();
  assert(await has('Question 2 sur 8'), 'question perdue après rechargement');
});

await step('Thème terminé avec des erreurs → score affiché, thème fermé, pas de blocage', async () => {
  // Question 1 déjà fausse ; la dernière l'est aussi → 6/8.
  await finishTheme(themes[0], (q, i) => (i < 7 ? idx(q) : wrongOf(q)));
  assert(await has('Raté, de peu'), 'écran d\'échec absent');
  assert(await has('6 bonne(s) réponse(s) sur 8'), 'score 6/8 absent');
  assert((await state()).quiz.lockUntil === 0, 'blocage déclenché trop tôt');
  assert(await has('un nouvel échec bloquera'), 'avertissement absent');
  await clickText('Choisir un autre thème');
  assert(await page.locator(`[data-id="${themes[0].id}"]`).isDisabled(), 'thème raté encore disponible');
  assert(await has('Tentatives échouées : 1 sur 2'), 'compteur de tentatives absent');
});

await step('Deuxième thème raté → quiz gelé 3 minutes (persistant au rechargement)', async () => {
  await page.click(`[data-action="start-theme"][data-id="${themes[1].id}"]`);
  await settle();
  await finishTheme(themes[1], (q) => wrongOf(q));
  assert(await has('Pas cette fois'), 'écran d\'échec absent');
  assert(await has('0 bonne(s) réponse(s) sur 8'), 'score 0/8 absent');
  assert(await has('quiz est gelé'), 'annonce du blocage absente');
  await clickText('Voir le minuteur');
  assert(await has('Quiz gelé'), 'minuteur absent');
  const ms = (await state()).quiz.lockUntil - Date.now();
  assert(ms > 170000 && ms <= 180000, `durée de blocage inattendue : ${ms} ms`);
  assert(/0[23]:\d\d/.test(await page.locator('[data-countdown]').innerText()), 'compte à rebours absent');
  await reload();
  assert(await has('Quiz gelé'), 'blocage perdu après rechargement');
  assert(await page.locator(`[data-id="${themes[2].id}"]`).isDisabled(), 'thème cliquable pendant le blocage');
});

await step('Chrono global de 30 minutes affiché pendant le jeu', async () => {
  const txt = await page.locator('[data-clock] .clock-digits').innerText();
  assert(/^(29|30):\d\d$/.test(txt), `chrono inattendu : ${txt}`);
});

console.log('\nMode test organisateur');

await step('Mode test : code incorrect refusé, code correct accepté', async () => {
  await go(BASE + '#/organisateur');
  await settle();
  await answer('0000');
  assert(await has('Code incorrect'), 'code incorrect accepté');
  await answer(CFG.parametres.modeTest.code);
  assert(await has('Mode test organisateur') && await has('État de la partie'), 'panneau absent');
});

await step('Mode test : lever le blocage puis tester le blocage court', async () => {
  await clickText('Lever le blocage');
  assert((await state()).quiz.lockUntil === 0, 'blocage non levé');
  await clickText('Déclencher le blocage');
  const ms = (await state()).quiz.lockUntil - Date.now();
  const short = CFG.parametres.modeTest.dureeBlocageCourtSecondes * 1000;
  assert(ms > 0 && ms <= short, `blocage court inattendu : ${ms} ms`);
  await go(BASE + '#/quete/1');
  await settle();
  assert(await has('Quiz gelé'), 'blocage non affiché');
  await page.waitForTimeout(short + 1200);
  assert(!(await has('Quiz gelé')), 'le quiz ne se débloque pas à la fin du compte à rebours');
});

await step('Mode test : bonnes réponses signalées', async () => {
  await page.click(`[data-action="start-theme"][data-id="${themes[2].id}"]`);
  await settle();
  assert((await page.locator('.test-badge').count()) === 1, 'badge « bonne réponse » absent');
  // On repasse en affichage participant pour la suite.
  await go(BASE + '#/organisateur');
  await settle();
  await page.click('[data-opt="showAnswers"]');
  await go(BASE + '#/quete/1');
  await settle();
  assert((await page.locator('.test-badge').count()) === 0, 'badge encore visible');
});

console.log('\nSuite du parcours');

await step('Quiz réussi après 8 bonnes réponses sur 8 → indice du lieu A', async () => {
  await finishTheme(themes[2], (q) => idx(q));
  assert(await has('Quiz réussi'), 'écran de réussite absent');
  assert(await has('8/8'), 'score 8/8 absent');
  await clickText('Découvrir le premier indice');
  assert(await has('Où se trouve la prochaine étape'), 'écran du lieu absent');
});

await step('Lieu incorrect refusé, lieu correct accepté (casse et accents ignorés)', async () => {
  await answer('La cafétéria imaginaire');
  assert(await has("Ce n'est pas le bon lieu"), 'lieu incorrect accepté');
  await answer(CFG.lieux.A.reponsesAcceptees[0].toUpperCase());
  assert(await has('Lieu trouvé'), 'lieu correct refusé');
});

await step('Code manuel incorrect refusé, scan du QR A → quête 2', async () => {
  await page.click('.manual-code summary');
  await answer(CFG.lieux.C.codeQR);
  assert(await has('ne correspond pas'), 'mauvais code accepté');
  await go(BASE + '#/scan/' + CFG.lieux.A.codeQR.toLowerCase());
  await settle();
  assert(await has('Lieu validé'), 'scan non validé');
  assert((await state()).quest === 2, 'quête 2 non débloquée');
  await reload();
  await settle();
  assert(await has('Lieu validé') || await has('Commencer la quête 2'), 'rechargement de l\'écran de scan incohérent');
  await clickText('Commencer la quête 2');
  assert(await has("L'énigme mystère"), 'quête 2 absente');
});

await step('Joker : refus de confirmation → joker conservé', async () => {
  await clickText("Découvrir l'énigme");
  await clickText('Utiliser mon joker');
  await page.click('[data-modal-cancel]');
  await settle();
  assert((await state()).joker.used === false, 'joker consommé malgré le refus');
  assert(await has('Joker disponible'), 'statut incorrect');
});

await step('Joker : confirmation → indice affiché, joker consommé et mémorisé', async () => {
  await clickText('Utiliser mon joker');
  await page.click('[data-modal-ok]');
  await settle();
  assert(await has('Indice du joker'), 'indice non affiché');
  assert(await has('Joker utilisé'), 'statut non mis à jour');
  await reload();
  await settle();
  assert((await state()).joker.used === true, 'joker récupéré après rechargement');
  assert(await has('Indice du joker'), 'indice perdu après rechargement');
});

await step('Énigme : mauvaise réponse refusée, bonne réponse acceptée', async () => {
  await answer('le bois');
  assert(await has("Ce n'est pas la bonne réponse"), 'mauvaise réponse acceptée');
  await answer('  Le VERRE ');
  assert(await has('Énigme résolue'), 'bonne réponse refusée');
  await clickText("Découvrir l'indice du prochain lieu");
});

await step('Joker : réutilisation impossible (bouton désactivé et règle côté logique)', async () => {
  const btn = page.locator('.btn-joker');
  assert(await btn.isDisabled(), 'bouton joker encore actif');
  assert(norm(await btn.innerText()).includes('déjà utilisé'), 'libellé incorrect');
  const again = await page.evaluate(() => window.GQ.useJoker('lieu-B'));
  assert(again === false, 'le joker a pu être réutilisé');
});

await step('Lieu B puis quête 3 (défi Saint-Gobain)', async () => {
  await answer(CFG.lieux.B.reponsesAcceptees[0]);
  await go(BASE + '#/scan/' + CFG.lieux.B.codeQR);
  await settle();
  await clickText('Commencer la quête 3');
  await clickText('Relever le défi');
  const qs = CFG.quetes.defi.questions;
  for (let i = 0; i < qs.length; i++) {
    assert(await has(`Question ${i + 1} sur ${qs.length}`), `question ${i + 1} absente`);
    const wrong = idx(qs[i]) === 0 ? 1 : 0;
    if (i === 0) {
      await chooseAndValidate(wrong);
      assert(await has("Ce n'est pas la bonne réponse"), 'erreur non affichée');
    }
    await chooseAndValidate(idx(qs[i]));
    await page.click('[data-action="next-question"]');
    await settle();
  }
  assert(await has('Défi relevé'), 'réussite absente');
});

await step('Lieu C via saisie manuelle du code → quête 4', async () => {
  await clickText("Découvrir l'indice du prochain lieu");
  await answer(CFG.lieux.C.reponsesAcceptees[0]);
  await page.click('.manual-code summary');
  await answer(CFG.lieux.C.codeQR.toLowerCase());
  assert(await has('Lieu validé'), 'code manuel refusé');
  await clickText('Commencer la quête 4');
  assert(await has('Le dernier indice'), 'quête 4 absente');
});

await step('Quête 4 : énigme finale → lieu final confirmé', async () => {
  await clickText("Découvrir l'énigme finale");
  await answer('nulle part');
  assert(await has("Ce n'est pas la bonne réponse"), 'mauvaise réponse acceptée');
  await answer(CFG.lieux.FINAL.reponsesAcceptees[0]);
  assert(await has('cachette de la hotte'), 'réussite absente');
  assert(await has('instructions des organisateurs'), 'consigne absente');
  await clickText('Continuer');
  assert(await has('Vous avez retrouvé la piste de la hotte'), 'écran final absent');
});

await step('Quête 5 : code organisateur incorrect refusé, correct → « Aventure terminée »', async () => {
  await page.click('.manual-code summary');
  await answer('MAUVAIS');
  assert(await has('Code incorrect'), 'mauvais code accepté');
  await answer(CFG.parametres.finDePartie.codeOrganisateur.toLowerCase());
  assert(await has('Aventure terminée'), 'fin non affichée');
  assert(await has('Votre temps'), 'temps final absent');
  await reload();
  await settle();
  assert(await has('Aventure terminée'), 'fin perdue après rechargement');
  await noHorizontalScroll();
});

console.log('\nAutres cas');

await step('QR code ouvert dans un navigateur sans partie → message explicite', async () => {
  const other = await browser.newContext({ viewport: { width: 375, height: 740 } });
  const p2 = await other.newPage();
  await p2.goto(BASE + '#/scan/' + CFG.lieux.A.codeQR);
  await p2.waitForTimeout(200);
  assert(norm(await p2.locator('#app').innerText()).includes('aucune partie en cours'), 'message absent');
  await other.close();
});

await step('Mode test : aller à la quête 3 puis réinitialiser la partie', async () => {
  await go(BASE + '#/organisateur');
  await settle();
  await page.click('[data-action="test-jump"][data-n="3"]');
  await settle();
  assert((await hash()) === '#/quete/3' && (await state()).quest === 3, 'saut de quête impossible');
  await go(BASE + '#/organisateur');
  await settle();
  await clickText('Réinitialiser la partie');
  await page.click('[data-modal-ok]');
  await settle();
  assert((await state()).team === null, 'partie non réinitialisée');
  await clickText('Fiches QR codes à imprimer');
  await page.waitForSelector('.qr-code svg');
  assert((await page.locator('.qr-code svg').count()) >= 3, 'QR codes non générés');
  await go(BASE + '#/organisateur');
  await settle();
  await clickText('Quitter le mode test');
  assert(!(await page.locator('.test-bar').count()), 'mode test encore actif');
});

await step('Affichage ordinateur (1280 px) sans débordement', async () => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await go(BASE);
  await settle();
  await noHorizontalScroll();
});

await step('Aucune erreur JavaScript', async () => {
  assert(!jsErrors.length, jsErrors.join(' | '));
});

await browser.close();
server.kill();
console.log(`\n${passed} réussi(s), ${failures.length} échec(s)`);
process.exit(failures.length ? 1 : 0);
