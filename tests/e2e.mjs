// Test de bout en bout du parcours complet et des cas d'erreur.
// Prérequis (une seule fois) :
//   npm install --no-save playwright && npx playwright install chromium
// Lancement :
//   npm test
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

// Serveur du jeu avec un dossier de données temporaire (n'écrase pas data/).
const SUIVI_CODE = 'TEST-SUIVI';
const server = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], {
  cwd: root,
  stdio: 'ignore',
  env: { ...process.env, CODE_SUIVI: SUIVI_CODE, SUIVI_FICHIER: join(mkdtempSync(join(tmpdir(), 'gq-')), 'equipes.json') },
});
const api = async (path) => {
  const r = await fetch(BASE + 'api/' + path, { headers: { 'X-Code-Suivi': SUIVI_CODE } });
  return r.json();
};
const apiTeams = async () => (await api('equipes')).equipes;
await new Promise((r) => setTimeout(r, 600));

// Caméra simulée par Chromium (mire de test) pour l'appareil photo du jeu.
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true, permissions: ['camera'] });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const jsErrors = [];
page.on('pageerror', (e) => jsErrors.push(e.message));

// innerText applique les majuscules CSS et les espaces insécables : on normalise.
const norm = (s) => s.replace(/[  ]/g, ' ').toLowerCase();
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
async function noHorizontalScroll() {
  const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert(ok, 'défilement horizontal détecté');
}
const frozen = async () =>
  (await page.locator('.answer-form, .choices, .portraits, .btn-joker').count()) === 0 && (await has('Dégel dans'));
const gelMs = async () => (await state()).gel.until - Date.now();
// Ouvre le mode test et clique un bouton, puis revient à la quête en cours.
async function admin(label) {
  await go(BASE + '#/organisateur');
  await clickText(label);
  await go(BASE + '#/quete/' + (await state()).quest);
}

const CFG = await (async () => {
  await go(BASE);
  return page.evaluate(() => window.GAME_CONFIG);
})();
const L = 'ABCD';
const idx = (q) => L.indexOf(q.reponse);
const themes = CFG.quiz.themes;
const theme = (id) => themes.find((t) => t.id === id);
const wrongOf = (q) => (idx(q) === 0 ? 1 : 0);
const SHORT = CFG.parametres.modeTest.dureeBlocageCourtSecondes * 1000;

console.log('\nDépart');

await step('Accueil « The Gobinous Christmas Club » → programme des 5 temps forts', async () => {
  assert(await has('Christmas Club') && await has('découvrir le programme'), 'accueil du Club absent');
  await noHorizontalScroll();
  await page.click('.club-cta [data-action="to-programme"]');
  await settle();
  assert((await hash()) === '#/programme', 'programme non affiché');
  for (const n of ['Christmas Quest', 'Christmas Party', 'Christmas Battle', 'Christmas Wrap-Up', 'Le Vlog des Gobinous']) {
    assert(await has(n), `temps fort absent : ${n}`);
  }
  assert((await page.locator('.prog-card').count()) === 4, '4 temps forts attendus');
  assert(!(await has('Christmas Gift')), 'le Gift doit être dans le Wrap-Up');
  assert(!/soir[ée]e/i.test(await text()), 'le mot « soirée » est affiché');
  await noHorizontalScroll();
});

await step('Battle : page d\'information ; ancienne page Gift → Wrap-Up', async () => {
  await page.click('.prog-battle');
  await settle();
  assert(await has('quiz interactif') && await has('classement'), 'page Battle absente');
  await go(BASE + '#/gift');
  assert((await hash()) === '#/wrapup', 'le Gift doit mener au Wrap-Up');
  await go(BASE + '#/programme');
});

await step('Christmas Quest : accueil du jeu et bouton « Lancer la partie »', async () => {
  await page.click('.prog-quest');
  await settle();
  assert((await hash()) === '#/quest', 'accueil du jeu non affiché');
  assert(await has('CHRISTMAS QUEST'), 'titre absent');
  assert(await has('Lancer la partie'), 'bouton absent');
  await noHorizontalScroll();
});

await step('Nom d\'équipe vide refusé, puis accepté', async () => {
  await clickText('Lancer la partie');
  await answer('   ');
  assert(await has("Indiquez un nom d'équipe"), 'message d\'erreur absent');
  await answer('Les Testeurs');
  assert((await hash()) === '#/equipe/roles', 'pas redirigé vers les rôles');
});

await step('Rôles : encadré « choisissez vos rôles avec soin », Capitaine et Reporter obligatoires', async () => {
  assert(await has('Bête de nom'), 'réaction du lutin absente');
  assert(await has('Le Gobinous Reporter') && await has('Le Gobinous Capitaine') && await has('choisissez vos rôles avec soin'), 'encadré des rôles absent');
  await page.click('.roles-form button[type=submit]');
  await settle();
  assert(await has('Indiquez le prénom'), 'rôles vides acceptés');
  await page.fill('[name="chef"]', 'Camille');
  await page.fill('[name="reporter"]', 'Yanis');
  await page.click('.roles-form button[type=submit]');
  await settle();
  assert((await hash()) === '#/regles', 'pas redirigé vers les règles');
  const s = await state();
  assert(s.roles.chef === 'Camille' && s.roles.reporter === 'Yanis', 'rôles non enregistrés');
});

await step('Suivi : la progression de l\'équipe est envoyée au serveur', async () => {
  await page.evaluate(() => window.GQ.sync.push());
  const t = (await apiTeams()).find((x) => x.equipe === 'Les Testeurs');
  assert(t && t.quete === 1, 'équipe absente du suivi');
  assert(t.chef === 'Camille' && t.reporter === 'Yanis', 'rôles absents du suivi');
  const r = await fetch(BASE + 'api/equipes', { headers: { 'X-Code-Suivi': 'MAUVAIS' } });
  assert(r.status === 401, 'liste accessible sans le bon code');
});

await step('Carte « Comment jouer ? » et règles plein écran dans la DA du jeu', async () => {
  assert((await page.locator('.board-svg').count()) === 1, 'plateau absent');
  await clickText('Toutes les règles');
  const modal = norm(await page.locator('.modal').innerText());
  for (const s of ['Les règles', 'Le mot secret', '1 joker', 'Le gel', '30 minutes chrono']) {
    assert(modal.includes(norm(s)), `texte manquant dans les règles : ${s}`);
  }
  assert((await page.locator('.modal-sheet .rule').count()) === 6, 'règles illustrées absentes');
  await page.click('[data-modal-cancel]');
  // Le chrono ne part qu'après confirmation.
  await page.click('[data-action="accept-rules"]');
  assert(await has('Prêts à commencer') || norm(await page.locator('.modal').innerText()).includes('prêts à commencer'), 'pas d\'avertissement avant le chrono');
  await page.click('[data-modal-cancel]');
  await settle();
  assert(!(await state()).clockStart && (await hash()) === '#/regles', 'chrono lancé sans confirmation');
  await page.click('[data-action="accept-rules"]');
  await page.click('[data-modal-ok]');
  await settle();
  assert((await hash()) === '#/quete/1' && (await state()).clockStart, 'pas sur la quête 1');
});

await step('Mot secret du hall : refusé s\'il est faux, accepté sans tenir compte de la casse', async () => {
  assert(await has('Mot secret de l\'étage'), 'écran du mot secret absent');
  await answer('NOEL');
  assert(await has("Ce n'est pas le mot secret"), 'mauvais mot accepté');
  await answer('  sapin ');
  assert(await has('Quiz Givré') && await has('Choisir un thème'), 'quête 1 non débloquée');
});

await step('Bouton « Règles » explicite et bouton du son dans l\'en-tête, musiques disponibles', async () => {
  assert(norm(await page.locator('.topbar .rules-btn').innerText()).includes('règles'), 'bouton Règles sans libellé');
  assert((await page.locator('.topbar .sound-btn').getAttribute('aria-pressed')) === 'true', 'son coupé par défaut');
  await page.locator('.topbar .sound-btn').click();
  await settle();
  assert((await page.locator('.topbar .sound-btn').getAttribute('aria-pressed')) === 'false', 'le son ne se coupe pas');
  await page.locator('.topbar .sound-btn').click();
  await settle();
  for (const f of ['musique-noel-1.mp3', 'musique-noel-2.mp3', 'musique-japon.mp3', 'barnabe-appel.mp3', 'barnabe-video.mp3']) {
    const r = await fetch(BASE + 'assets/audio/' + f);
    assert(r.ok && r.headers.get('content-type') === 'audio/mpeg', `musique absente : ${f}`);
  }
});

await step('« Un souci ? » sur chaque écran : appel direct de l\'organisation', async () => {
  await page.click('[data-action="help"]');
  const href = await page.locator('.help-calls a').first().getAttribute('href');
  assert(href === 'tel:+33668213587', `lien d'appel incorrect : ${href}`);
  await page.click('[data-modal-cancel]');
});

await step('Accès direct à une quête non débloquée → redirection', async () => {
  await go(BASE + '#/quete/3');
  await page.waitForTimeout(300);
  assert((await hash()) === '#/quete/1', `hash = ${await hash()}`);
});

console.log('\nQuête 1 : le grand quiz');

await step('Thème mystère caché, aucune correction pendant les questions', async () => {
  await clickText('Choisir un thème');
  assert(await has('Thème mystère') && !(await has('Culture générale')), 'le thème mystère est dévoilé trop tôt');
  await page.click('[data-action="start-theme"][data-id="noel"]');
  await settle();
  assert(await has('Question 1 sur 8'), 'compteur absent');
  await choose(wrongOf(theme('noel').questions[0]));
  assert((await page.locator('.choice.is-wrong, .choice.is-correct').count()) === 0, 'la bonne réponse est révélée');
  await nextQuestion();
  await page.click('[data-action="quiz-move"][data-d="-1"]');
  await settle();
  assert(await page.locator('.choice.is-selected').count() === 1, 'réponse précédente perdue');
  await nextQuestion();
});

await step('Rechargement en cours de thème → reprise à la même question', async () => {
  await reload();
  assert(await has('Question 2 sur 8'), 'question perdue après rechargement');
});

await step('Thème raté → score, correction affichée après les 8 réponses, thème fermé', async () => {
  await finishTheme(theme('noel'), (q, i) => (i < 7 ? idx(q) : wrongOf(q)));
  assert(await has('6 bonne(s) réponse(s) sur 8'), 'score 6/8 absent');
  await clickText('Voir la correction');
  assert(await has('Bonne réponse :'), 'correction absente');
  assert((await page.locator('.correction-list li').count()) === 8, 'correction incomplète');
  assert(await has('Si le prochain est raté'), 'avertissement absent');
  await clickText('Choisir un autre thème');
  assert(await page.locator('[data-id="noel"]').isDisabled(), 'thème raté encore disponible');
  assert(await has('Thèmes ratés : 1 sur 2'), 'compteur de tentatives absent');
});

await step('Thème mystère : révélation, 2e thème raté → tout gelé 45 s (persistant)', async () => {
  await page.click('[data-action="start-theme"][data-id="mystere"]');
  await settle();
  assert(await has('Culture générale'), 'révélation absente');
  await clickText("C'est parti");
  await finishTheme(theme('mystere'), (q) => wrongOf(q));
  assert(await has('tout gèle'), 'annonce du gel absente');
  await clickText('Voir le minuteur');
  const ms = (await state()).quiz.lockUntil - Date.now();
  assert(ms > 40000 && ms <= 45000, `durée du gel inattendue : ${ms} ms`);
  await reload();
  assert(await has('Tout est gelé'), 'gel perdu après rechargement');
  assert(await page.locator('[data-id="tour"]').isDisabled(), 'thème cliquable pendant le gel');
  await page.click('.topbar [data-action="show-rules"]');
  assert((await page.locator('.modal-sheet').count()) === 1, 'règles inaccessibles pendant le gel');
  await page.click('[data-modal-cancel]');
});

await step('Chrono global de 30 minutes affiché pendant le jeu', async () => {
  const txt = await page.locator('[data-clock] .clock-digits').innerText();
  assert(/^(29|30):\d\d$/.test(txt), `chrono inattendu : ${txt}`);
});

await step('Mode test : accès caché par 5 appuis sur le logo, code vérifié', async () => {
  await go(BASE + '#/quest');
  for (let i = 0; i < 5; i++) await page.click('[data-action="logo-tap"]');
  await settle();
  assert((await hash()) === '#/organisateur', `accès caché inopérant : ${await hash()}`);
  await answer('0000');
  assert(await has('Code incorrect'), 'code incorrect accepté');
  await answer(CFG.parametres.modeTest.code);
  assert(await has('Mode test organisateur') && await has('État de la partie'), 'panneau absent');
});

await step('Fin du gel du quiz → quiz validé d\'office, premier indice débloqué', async () => {
  await clickText('Lever le blocage');
  await clickText('Déclencher le blocage');
  const ms = (await state()).quiz.lockUntil - Date.now();
  assert(ms > 0 && ms <= SHORT, `blocage court inattendu : ${ms} ms`);
  await go(BASE + '#/quete/1');
  assert(await has('Tout est gelé'), 'gel non affiché');
  await page.waitForTimeout(ms + 1200);
  assert(await has('Le gel est levé'), 'quiz non validé d\'office');
  assert(await has('Voir le 1er indice'), 'indice non proposé');
});

await step('Quiz réussi à 8/8 (thème « La Tour »), correction consultable', async () => {
  await admin('Effacer les tentatives');
  await page.click('[data-action="start-theme"][data-id="tour"]');
  await settle();
  assert((await page.locator('.test-badge').count()) === 1, 'badge « bonne réponse » du mode test absent');
  await finishTheme(theme('tour'), (q) => idx(q));
  assert(await has('Quiz réussi') && await has('8/8'), 'réussite absente');
  assert(await has('Voir la correction'), 'correction absente');
});

await step('Étage à deviner : erreur → givré 10 s, puis indice bonus, puis 5 accepté', async () => {
  await clickText('Voir le 1er indice');
  assert(await has('mur végétal Saint-Gobain'), 'premier indice absent');
  await answer('3');
  assert(await frozen(), 'pas de gel après une mauvaise réponse');
  const ms = await gelMs();
  assert(ms > 0 && ms <= 10000, `gel inattendu : ${ms} ms`);
  assert(!(await has('3 + 2')), 'indice bonus affiché trop tôt');
  await page.waitForTimeout(ms + 1200);
  assert(await has('Indice bonus') && await has('3 + 2'), 'indice bonus absent');
  await answer('5');
  assert((await state()).quest === 2 && (await hash()) === '#/quete/2', 'quête 2 non atteinte');
  assert(await has('5ᵉ étage'), 'destination absente');
});

console.log('\nQuête 2 : le message codé');

await step('Mot secret LUTIN → message chiffré en symboles et grille de décodage', async () => {
  await answer('lutin');
  await clickText('Découvrir le message');
  const letters = CFG.quetes.message.lignes.join('').replace(/\s/g, '').length;
  assert((await page.locator('.pig-message svg.pig').count()) === letters, 'nombre de symboles incorrect');
  assert((await page.locator('.pig-keys svg').count()) === 4, 'grilles de décodage absentes');
});

await step('Joker : refus → conservé ; confirmation → indice affiché et mémorisé', async () => {
  await clickText('Utiliser mon joker');
  await page.click('[data-modal-cancel]');
  await settle();
  assert((await state()).joker.used === false, 'joker consommé malgré le refus');
  await clickText('Utiliser mon joker');
  await page.click('[data-modal-ok]');
  await settle();
  assert(await has('Indice du joker') && await has('Joker utilisé'), 'indice non affiché');
  await reload();
  assert((await state()).joker.used === true && await has('Indice du joker'), 'joker perdu après rechargement');
});

await step('1re erreur → « Il vous reste 1 essai », puis phrase acceptée (accents et « clef »)', async () => {
  await answer('le verre est la clé');
  assert(await has('Il vous reste 1 essai'), 'avertissement absent');
  assert(!(await frozen()), 'gel dès la première erreur');
  await answer('LA CLEF DU   MYSTÈRE est le verre');
  assert(await has('Message déchiffré'), 'bonne réponse refusée');
});

console.log('\nQuête 3 : le défi photo');

await step('Mot secret GUIRLANDE → avertissement du lutin capricieux et 6 modèles', async () => {
  await clickText('Découvrir la suite');
  assert(await has('23ᵉ étage'), 'destination absente');
  await answer('Guirlande');
  assert(await has('capricieux'), 'avertissement absent');
  await clickText('Relever le défi');
  assert((await page.locator('.model-card').count()) === 6, 'modèles absents');
  assert((await page.locator('input[type=file]').count()) === 0, 'un sélecteur de fichiers est proposé');
});

// Ouvre l'appareil photo du jeu sur un modèle et déclenche.
async function shoot(id) {
  await page.click(`[data-action="photo-take"][data-model="${id}"]`);
  await page.waitForSelector('.cam');
  await page.waitForFunction(() => { const v = document.querySelector('.cam-video'); return v && v.videoWidth > 0; });
  await page.click('.cam-shutter');
  await page.waitForSelector('.photo-preview');
}

await step('3 photos avec l\'appareil photo du jeu : un refus capricieux, puis quête validée', async () => {
  let rejections = 0;
  for (const id of ['avion', 'totem', 'duo']) {
    for (let attempt = 0; attempt < 2; attempt++) {
      await shoot(id);
      assert((await page.locator('.cam').count()) === 0, 'appareil photo resté ouvert');
      await page.click('[data-action="photo-validate"]');
      await settle();
      if (await page.locator('.modal').count()) {
        assert(norm(await page.locator('.modal').innerText()).includes('refusé'), 'pop-up de refus absente');
        rejections++;
        await page.click('[data-modal-cancel]');
        await settle();
        continue;
      }
      break;
    }
  }
  assert(rejections === 1, `refus capricieux : ${rejections} (1 attendu)`);
  assert((await state()).q3.rejected, 'refus non mémorisé');
  assert((await page.locator('.model-card.is-done').count()) === 3, '3 photos non validées');
  await clickText('Valider la Quête 3');
  assert(await has('Défi photo réussi'), 'réussite absente');
});

await step('Photos enregistrées sur le serveur pour les organisateurs', async () => {
  await page.waitForTimeout(500);
  const t = (await api('photos')).equipes.find((x) => x.equipe === 'Les Testeurs');
  assert(t && t.photos.length === 3, 'photos absentes du serveur');
  const img = await fetch(BASE + t.photos[0].url + '?code=' + SUIVI_CODE);
  assert(img.ok && img.headers.get('content-type') === 'image/jpeg', 'photo illisible');
  const zip = await fetch(BASE + 'api/photos.zip?code=' + SUIVI_CODE);
  const buf = Buffer.from(await zip.arrayBuffer());
  assert(zip.ok && buf.slice(0, 2).toString() === 'PK', 'archive ZIP invalide');
  assert(buf.readUInt16LE(buf.length - 12) === 3, 'archive ZIP incomplète');
  const denied = await fetch(BASE + 'api/photos.zip');
  assert(denied.status === 401, 'archive accessible sans code');
});

console.log('\nQuête 4 : l\'enquête du Support 44');

await step('Mot secret ETOILE → terminal du Support 44', async () => {
  await clickText('Découvrir la suite');
  await answer('étoile');
  assert(await has('Terminal de sécurité du Support 44'), 'terminal absent');
  await clickText("Lancer l'investigation");
  assert(await has('Module 1/4') && (await page.locator('.portrait').count()) === 4, 'module 1 absent');
});

await step('Joker déjà utilisé : bouton désactivé et règle côté logique', async () => {
  const btn = page.locator('.btn-joker');
  assert(await btn.isDisabled(), 'bouton joker encore actif');
  assert((await page.evaluate(() => window.GQ.useJoker('q4-0'))) === false, 'le joker a pu être réutilisé');
});

await step('Module 1 : 2 erreurs → gel, puis module validé d\'office', async () => {
  await page.click('.portrait[data-i="0"]');
  await page.click('[data-action="module-choice"]');
  await settle();
  assert(await has('Il vous reste 1 essai'), 'avertissement absent');
  await page.click('.portrait[data-i="3"]');
  await page.click('[data-action="module-choice"]');
  await settle();
  assert(await frozen(), 'pas de gel après la 2e erreur');
  await admin('Lever le gel');
  assert(await has('validé ce module automatiquement') && await has('Module 2/4'), 'module non validé d\'office');
});

await step('Modules 2 à 4 : matricule, service, nom → badge de Barnabé SIX-SEVEN', async () => {
  await answer('2575');
  assert(await has('Module 3/4'), 'matricule refusé');
  await page.click('.choice[data-i="1"]');
  await page.click('[data-action="module-choice"]');
  await settle();
  assert(await has('Module 4/4'), 'service refusé');
  await answer('six-seven');
  assert(await has('Dossier déverrouillé') && await has('Barnabé SIX-SEVEN') && await has('2575'), 'badge absent');
  await clickText('Localiser le badge');
  assert(await has('BADGE LOCALISÉ') && await has('33ᵉ étage'), 'géolocalisation absente');
});

console.log('\nQuête 5 : la traque finale');

const forbidden = async () => /\b(salle|porte)s?\b/i.test(await text());

await step('Mot secret CADEAU → transmission à usage unique, jamais « salle » ni « porte »', async () => {
  assert(!(await forbidden()), '« salle » ou « porte » affiché trop tôt');
  await answer('CADEAU');
  assert(await has('usage unique'), 'avertissement absent');
  assert(!(await forbidden()), '« salle » ou « porte » affiché trop tôt');
  await clickText('Lancer la vidéo');
  const src = await page.locator('.cctv-video source').first().getAttribute('src');
  assert(src && src.endsWith('.mp4'), 'vidéo animée absente');
  const r = await fetch(BASE + src);
  assert(r.ok && (r.headers.get('content-type') || '').includes('video/mp4'), 'fichier vidéo non servi');
  // Lecture réelle (version WebM dans le navigateur de test) : sous-titres
  // synchronisés et pas de blocage.
  await page.waitForFunction(() => { const v = document.querySelector('.cctv-video'); return v && v.currentTime > 4; }, null, { timeout: 15000 });
  assert((await page.locator('.cctv-sub').innerText()).length > 10, 'sous-titres absents');
  // Fin de la vidéo → passage automatique au rapport.
  await page.evaluate(() => { const v = document.querySelector('.cctv-video'); v.currentTime = v.duration - 0.5; });
  await page.waitForFunction(() => window.GQ.state.phase[5] === 'report', null, { timeout: 8000 });
  await settle();
  assert(await has('Le décalage horaire') && await has('Touchez pour analyser'), 'rapport absent après la vidéo');
  // Vidéo interrompue (rechargement pendant la lecture) : autodétruite.
  await page.evaluate(() => { window.GQ.setPhase(5, 'video'); window.GQ.render(); });
  assert(await has('autodétruite'), 'la vidéo peut être revue');
  await clickText('Continuer');
  assert(await has('Rapport d\'analyse'), 'rapport absent');
  // Indices interactifs : un appui révèle l'analyse.
  assert(!(await has('son nom actuel')), 'analyse affichée trop tôt');
  for (let i = 0; i < 4; i++) await page.click(`[data-action="clue"][data-i="${i}"]`);
  assert(await has('son nom actuel') && await has('pas du français'), 'analyse des indices absente');
  assert(!(await has('Soleil-Levant')) && !(await has('Japon')) && !(await has('634')), 'le rapport en dit trop');
  assert(!(await forbidden()), '« salle » ou « porte » affiché trop tôt');
});

await step('Code du repaire : 1 seul essai, gel, puis nouvel essai → TOKYO', async () => {
  await answer('kyoto');
  assert(await frozen(), 'pas de gel après une erreur');
  const ms = await gelMs();
  assert(ms > 0 && ms <= SHORT, `gel inattendu : ${ms} ms`);
  await page.waitForTimeout(ms + 1200);
  assert((await page.locator('.answer-form').count()) === 1, 'saisie non rétablie');
  await answer('Tokyo');
  assert(await has('SALLE TOKYO') && await has('Appeler Barnabé'), 'lutin démasqué absent');
});

await step('Appel de Barnabé puis écran de fin, conservé au rechargement', async () => {
  await page.click('[data-action="call"]');
  // Sous-titres synchronisés sur la voix (fichier fourni) après la sonnerie.
  await page.waitForFunction(() => { const el = document.querySelector('[data-call-line]'); return el && el.textContent.length > 10; }, null, { timeout: 10000 });
  assert(await has('Barnabé SIX-SEVEN') && await has('MDR'), 'message vocal absent');
  await page.evaluate(() => {
    window.__sfx = [];
    const f = window.GQ.audio.sfx;
    window.GQ.audio.sfx = (n) => { window.__sfx.push(n); return f(n); };
  });
  await page.click('[data-action="hang-up"]');
  await settle();
  assert((await page.evaluate(() => window.__sfx)).includes('hangup'), 'pas de son de fin d\'appel');
  // Dans la salle : photo de groupe avec le paquet choisi.
  assert(await has('Le paquet mystère') && await has('un seul paquet'), 'étape du paquet absente');
  await page.click('[data-action="paquet-take"]');
  await page.waitForSelector('.cam video');
  await page.waitForFunction(() => { const v = document.querySelector('.cam video'); return v && v.videoWidth > 0; });
  await page.click('.cam-shutter');
  await page.waitForSelector('[data-action="paquet-validate"]');
  await page.click('[data-action="paquet-validate"]');
  await settle();
  assert(await has('Mission presque accomplie'), 'écran de fin absent');
  assert(await has('Les Testeurs') && await has('Rendez-vous au lieu de départ avec le paquet choisi'), 'consigne de fin absente');
  assert((await page.locator('.dance-elf .dance-frame').count()) === 4, 'le lutin ne danse pas');
  const fete = await fetch(BASE + 'assets/audio/musique-fete.mp3');
  assert(fete.ok, 'musique de fin absente');
  assert((await page.locator('.topbar').count()) === 0, 'l\'écran de fin garde l\'en-tête du jeu');
  assert((await state()).finished, 'fin non enregistrée');
  await reload();
  assert(await has('Mission presque accomplie'), 'fin perdue après rechargement');
  assert((await page.locator('.finale-home a[href="#/"]').count()) === 1, 'pas de retour à l\'accueil du site');
  await noHorizontalScroll();
});

console.log('\nOrganisateurs');

await step('Tableau de bord : code, avancement, galerie photos, réinitialisation à distance', async () => {
  const other = await browser.newContext({ viewport: { width: 375, height: 740 } });
  const p2 = await other.newPage();
  await p2.goto(BASE + '#/quest');
  await p2.waitForSelector('#loader', { state: 'detached' });
  await p2.getByText('Lancer la partie').first().click();
  await p2.fill('.answer-form .field', 'Équipe B');
  await p2.click('.answer-form button[type=submit]');
  await p2.waitForTimeout(200);
  await p2.evaluate(() => window.GQ.sync.push());

  await page.evaluate(() => window.GQ.sync.push());
  await go(BASE + '#/suivi');
  await answer('MAUVAIS');
  assert(await has('Code incorrect'), 'mauvais code accepté');
  await answer(SUIVI_CODE.toLowerCase());
  await page.waitForSelector('.team-card');
  await page.waitForSelector('.thumbs img');
  const a = norm(await page.locator('.team-card', { hasText: 'Les Testeurs' }).innerText());
  assert(a.includes('terminée') && a.includes('3/3'), 'avancement incomplet');
  assert((await page.locator('.thumbs img').count()) === 4, 'galerie photos incomplète (3 défis + paquet)');
  assert(await has('Le paquet choisi'), 'photo avec le paquet absente');
  assert(await has('Télécharger toutes les photos'), 'export ZIP absent');
  await noHorizontalScroll();

  const b = page.locator('.team-card', { hasText: 'Équipe B' });
  await b.locator('[data-action="suivi-reset"]').click();
  await page.click('[data-modal-ok]');
  await page.waitForTimeout(300);
  await p2.evaluate(() => window.GQ.sync.push());
  await p2.waitForTimeout(300);
  assert((await p2.evaluate(() => window.GQ.state.team)) === null, 'partie de l\'équipe B non réinitialisée');
  assert(!(await apiTeams()).some((x) => x.equipe === 'Équipe B'), 'équipe B encore dans le suivi');
  await other.close();
});

await step('Mode test : aller à une quête, simuler le mot secret, affichettes, réinitialiser', async () => {
  await go(BASE + '#/organisateur');
  await page.click('[data-action="test-jump"][data-n="3"]');
  await settle();
  assert((await hash()) === '#/quete/3' && (await state()).quest === 3, 'saut de quête impossible');
  await go(BASE + '#/organisateur');
  await clickText('Affichettes des mots secrets');
  assert((await page.locator('.poster-word').count()) === 5, 'affichettes absentes');
  assert(await has('GUIRLANDE'), 'mot secret absent des affichettes');
  await go(BASE + '#/organisateur');
  await clickText('Réinitialiser la partie');
  await page.click('[data-modal-ok]');
  await settle();
  assert((await state()).team === null, 'partie non réinitialisée');
  await clickText('Quitter le mode test');
  assert(!(await page.locator('.test-bar').count()), 'mode test encore actif');
});

console.log('\nChristmas Party et Wrap-Up');

await step('Party : code 2020 obligatoire, nom, 20 défis avec appareil photo, vidéo et galerie', async () => {
  await go(BASE + '#/party');
  assert(await has('Code secret de la Party'), 'code non demandé');
  await answer('1234');
  assert(await has('Mauvais code'), 'mauvais code accepté');
  await answer(CFG.party.code);
  assert(await has("C'est l'heure du goûter") && await has('sapin Gobinous'), 'présentation absente');
  await answer('Les Givrés');
  assert((await page.locator('.defi').count()) === 20, 'les 20 défis ne sont pas affichés');
  assert(await has('Treats & Chill') || await has('Treats &amp; Chill'), 'titre de la liste absent');
  await page.click('[data-action="defi-open"][data-n="12"]');
  assert((await page.locator('.modal [data-action="defi-camera"][data-mode="video"]').count()) === 1, 'caméra vidéo non proposée');
  assert((await page.locator('.modal [data-action="defi-camera"][data-mode="photo"]').count()) === 1, 'appareil photo non proposé');
  assert((await page.locator('.modal input[type=file][accept="image/*,video/*"]').count()) === 1, 'galerie non proposée');
  await page.click('[data-modal-cancel]');
});

await step('Party : défi validé par photo → Gobz comptés par le serveur, classement en direct', async () => {
  await page.click('[data-action="defi-open"][data-n="20"]');
  await page.click('[data-action="defi-camera"]');
  await page.waitForFunction(() => { const v = document.querySelector('.cam video'); return v && v.videoWidth > 0; });
  await page.click('.cam-shutter');
  await page.waitForSelector('[data-action="defi-send"]');
  await page.click('[data-action="defi-send"]');
  await page.waitForSelector('.defi.is-done');
  const pts = CFG.party.defis[19].points;
  const r = await (await fetch(BASE + 'api/party/classement')).json();
  const me = r.joueurs.find((x) => x.nom === 'Les Givrés');
  assert(me && me.points === pts, `points serveur inattendus : ${me && me.points}`);
  // Vidéo filmée dans l'appareil du jeu (onglet Vidéo, avec le son).
  await page.click('[data-action="defi-open"][data-n="12"]');
  await page.click('.modal [data-action="defi-camera"][data-mode="video"]');
  await page.waitForFunction(() => { const v = document.querySelector('.cam video'); return v && v.videoWidth > 0; });
  assert(await page.locator('.cam.is-video').count() === 1, 'mode vidéo non actif');
  await page.click('.cam-shutter');
  await page.waitForTimeout(1300);
  await page.click('.cam-shutter');
  await page.waitForSelector('.proof video');
  await page.click('[data-action="defi-send"]');
  await page.waitForFunction(() => document.querySelectorAll('.defi.is-done').length === 2);
  // Galerie : une vidéo envoyée depuis un fichier.
  await page.click('[data-action="defi-open"][data-n="8"]');
  await page.setInputFiles('.modal input[accept="image/*,video/*"]', { name: 'declaration.webm', mimeType: 'video/webm', buffer: Buffer.from('1a45dfa3', 'hex') });
  await page.waitForSelector('[data-action="defi-send"]');
  await page.click('[data-action="defi-send"]');
  await page.waitForFunction(() => document.querySelectorAll('.defi.is-done').length === 3);
  const r2 = await (await fetch(BASE + 'api/party/classement')).json();
  const me2 = r2.joueurs.find((x) => x.nom === 'Les Givrés');
  assert(me2.points === pts + CFG.party.defis[7].points + CFG.party.defis[11].points, `vidéos non comptées : ${me2.points}`);
  await page.waitForSelector('.ranking li.is-me');
  const d = await api('party');
  assert(d.joueurs[0].preuves.length === 3, 'preuves absentes côté organisateurs');
  assert(d.joueurs[0].preuves.some((p) => p.defi === 12 && /^video\//.test(p.type)), 'vidéo filmée absente côté organisateurs');
  await noHorizontalScroll();
});

await step('Wrap-Up : anonyme, questions obligatoires, réponses et indicateurs côté organisateurs', async () => {
  await go(BASE + '#/wrapup');
  assert(await has('100 % anonyme'), 'mention anonyme absente');
  assert((await page.locator('.wq').count()) === CFG.wrapup.questions.length && CFG.wrapup.questions.length <= 5, 'plus de 5 questions');
  await page.click('.wq-form button[type=submit]');
  await settle();
  assert(await has('Il manque une réponse obligatoire'), 'questionnaire incomplet accepté');
  await page.click('[data-q="note"][data-v="4"]');
  await page.click('[data-q="moment"][data-s="Christmas Party"]');
  await page.click('[data-q="encore"][data-s="Oui, carrément !"]');
  await page.fill('[data-wq-text="mot"]', 'Bravo aux lutins');
  await page.click('.wq-form button[type=submit]');
  await settle();
  assert(await has('Merci'), 'remerciement absent');
  const a = await api('avis');
  assert(a.avis.length === 1 && a.avis[0].reponses.note === 4 && a.avis[0].reponses.mot === 'Bravo aux lutins', 'réponses non enregistrées');
  await go(BASE + '#/suivi/avis');
  await page.waitForSelector('.kpi-big');
  assert(await has('4,0') && await has('Bravo aux lutins') && await has('Exporter en CSV'), 'indicateurs absents');
  await go(BASE + '#/suivi/party');
  await page.waitForSelector('.party-card');
  assert(await has('Les Givrés'), 'joueur absent de l\'onglet Party');
});

await step('Vlog : tous formats, vidéo lourde, plusieurs fichiers, archive ZIP pour les organisateurs', async () => {
  await go(BASE + '#/vlog');
  await answer('Les Givrés');
  const big = Buffer.alloc(30 * 1024 * 1024, 7); // 30 Mo, format .mov sans type déclaré
  await page.setInputFiles('[data-vlog-files]', [
    { name: 'souvenir.heic', mimeType: 'image/heic', buffer: Buffer.from('heicdata') },
    { name: 'video-longue.mov', mimeType: 'application/octet-stream', buffer: big },
    { name: 'clip.mkv', mimeType: 'video/x-matroska', buffer: Buffer.from('mkvdata') },
  ], { timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('.vlog-item.is-ok').length === 3, null, { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('.vlog-mine li').length === 3, null, { timeout: 8000 });
  const d = await api('vlog');
  assert(d.fichiers.length === 3 && d.fichiers.some((f) => f.fichier === 'video-longue.mov' && f.taille === big.length && /^video\//.test(f.type)), 'fichiers absents du serveur');
  const r = await fetch(BASE + 'api/vlog?id=abcdefgh12345678&fichier=notes.txt', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
  assert(r.status === 415, 'un fichier qui n\'est pas une photo ou une vidéo est accepté');
  const zipRes = await fetch(BASE + 'api/vlog.zip', { headers: { 'X-Code-Suivi': SUIVI_CODE } });
  const zipBuf = Buffer.from(await zipRes.arrayBuffer());
  assert(zipRes.ok && zipBuf.readUInt32LE(0) === 0x04034b50 && zipBuf.length > big.length, 'archive ZIP invalide');
  const zp = join(mkdtempSync(join(tmpdir(), 'gq-')), 'vlog.zip');
  writeFileSync(zp, zipBuf);
  const test = spawnSync('python3', ['-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(len(z.namelist()))', zp], { encoding: 'utf8' });
  assert(test.status === 0 && test.stdout.trim() === '3', `ZIP illisible : ${test.stderr}`);
  await go(BASE + '#/suivi/vlog');
  await page.waitForSelector('[data-action="vlog-del"]');
  assert(await has('video-longue.mov'), 'fichier absent de l\'onglet Vlog');
});

await step('Wrap-Up : tirage du Secret Santa, un numéro unique par téléphone', async () => {
  await go(BASE + '#/wrapup');
  await page.click('[data-action="santa-draw"]');
  await page.waitForSelector('.santa-help', { timeout: 8000 });
  const mine = await page.evaluate(() => window.GQ.wrapup.state().santa);
  assert(mine >= 1 && mine <= CFG.wrapup.santa.total, `numéro inattendu : ${mine}`);
  await reload();
  assert((await page.evaluate(() => window.GQ.wrapup.state().santa)) === mine && await has('Allez chercher le cadeau'), 'numéro perdu au rechargement');
  const again = await (await fetch(BASE + 'api/santa/tirage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: await page.evaluate(() => window.GQ.wrapup.state().id) }) })).json();
  assert(again.numero === mine, 'un téléphone a tiré deux numéros');
  const seen = new Set([mine]);
  for (let i = 0; i < 5; i++) {
    const o = await (await fetch(BASE + 'api/santa/tirage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'autretelephone' + i + 'x' }) })).json();
    assert(!seen.has(o.numero), 'numéro tiré deux fois');
    seen.add(o.numero);
  }
  const sa = await api('santa');
  assert(sa.tires.length === 6, 'tirages non enregistrés');
});

await step('Affichage ordinateur (1280 px) sans débordement', async () => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await go(BASE);
  await noHorizontalScroll();
});

await step('Aucune erreur JavaScript', async () => {
  assert(!jsErrors.length, jsErrors.join(' | '));
});

await browser.close();
server.kill();
console.log(`\n${passed} réussi(s), ${failures.length} échec(s)`);
process.exit(failures.length ? 1 : 0);
