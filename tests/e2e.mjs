// Test de bout en bout du parcours complet et des cas d'erreur.
// Prérequis (une seule fois) :
//   npm install --no-save playwright && npx playwright install chromium
// Lancement :
//   npm test
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
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

await step('Accueil épuré : titre et bouton « Lancer la partie »', async () => {
  assert(await has('CHRISTMAS QUEST'), 'titre absent');
  assert(await has('Lancer la partie'), 'bouton absent');
  await noHorizontalScroll();
});

await step('Nom d\'équipe vide refusé, puis accepté', async () => {
  await clickText('Lancer la partie');
  await answer('   ');
  assert(await has("Indiquez un nom d'équipe"), 'message d\'erreur absent');
  await answer('Les Testeurs');
  assert((await hash()) === '#/regles', 'pas redirigé vers les règles');
});

await step('Suivi : la progression de l\'équipe est envoyée au serveur', async () => {
  await page.evaluate(() => window.GQ.sync.push());
  const t = (await apiTeams()).find((x) => x.equipe === 'Les Testeurs');
  assert(t && t.quete === 1, 'équipe absente du suivi');
  const r = await fetch(BASE + 'api/equipes', { headers: { 'X-Code-Suivi': 'MAUVAIS' } });
  assert(r.status === 401, 'liste accessible sans le bon code');
});

await step('Carte « Comment jouer ? » et règles plein écran dans la DA du jeu', async () => {
  assert((await page.locator('.board-svg').count()) === 1, 'plateau absent');
  await clickText('Lire les règles détaillées');
  const modal = norm(await page.locator('.modal').innerText());
  for (const s of ['Les règles', 'Le mot secret de l\'étage', '1 joker, 1 seule fois', 'Attention au gel', '30 minutes chrono', 'Votre objectif']) {
    assert(modal.includes(norm(s)), `texte manquant dans les règles : ${s}`);
  }
  assert((await page.locator('.modal-sheet .rule').count()) === 6, 'règles illustrées absentes');
  await page.click('[data-modal-cancel]');
  await clickText("C'est parti");
  assert((await hash()) === '#/quete/1', 'pas sur la quête 1');
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
  for (const f of ['musique-noel-1.mp3', 'musique-noel-2.mp3', 'musique-japon.mp3', 'barnabe-appel.mp3', 'barnabe-video-1.mp3']) {
    const r = await fetch(BASE + 'assets/audio/' + f);
    assert(r.ok && r.headers.get('content-type') === 'audio/mpeg', `musique absente : ${f}`);
  }
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
  assert(await has('si ce deuxième thème est raté'), 'avertissement absent');
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
  assert(await has('tout est gelé'), 'annonce du gel absente');
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
  await go(BASE);
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
  assert(await has('particulièrement capricieux'), 'avertissement absent');
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
  assert((await page.locator('.cctv').count()) === 1, 'vidéo absente');
  await page.waitForTimeout(1500);
  assert((await page.locator('.cctv-sub').innerText()).length > 10, 'sous-titres absents');
  await reload();
  assert(await has('autodétruite'), 'la vidéo peut être revue');
  await clickText('Continuer');
  assert(await has('UTC+9'), 'rapport absent');
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
  await page.waitForTimeout(600);
  assert(await has('Barnabé SIX-SEVEN') && await has('speedrun'), 'message vocal absent');
  await page.click('[data-action="hang-up"]');
  await settle();
  assert(await has('Mission accomplie') && await has('Votre temps'), 'écran de fin absent');
  assert(await has('Les Testeurs') && await has('Dernière ligne droite'), 'bilan de fin incomplet');
  assert((await page.locator('.topbar').count()) === 0, 'l\'écran de fin garde l\'en-tête du jeu');
  assert((await state()).finished, 'fin non enregistrée');
  await reload();
  assert(await has('Mission accomplie'), 'fin perdue après rechargement');
  await noHorizontalScroll();
});

console.log('\nOrganisateurs');

await step('Tableau de bord : code, avancement, galerie photos, réinitialisation à distance', async () => {
  const other = await browser.newContext({ viewport: { width: 375, height: 740 } });
  const p2 = await other.newPage();
  await p2.goto(BASE);
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
  assert((await page.locator('.thumbs img').count()) === 3, 'galerie photos incomplète');
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
