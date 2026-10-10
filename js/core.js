/* Cœur du jeu : utilitaires, sauvegarde locale et règles.
 * Aucune manipulation du DOM ici : uniquement l'état de la partie. */
(function () {
  'use strict';

  var GQ = (window.GQ = window.GQ || {});
  var CFG = (GQ.cfg = window.GAME_CONFIG || {});
  var P = CFG.parametres || {};
  var LETTERS = 'ABCD';

  /* ------------------------------------------------------------------ */
  /* Utilitaires texte                                                   */
  /* ------------------------------------------------------------------ */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Texte de configuration → HTML sûr.
   * Gère \n, **gras**, les variables {nom}, les pictogrammes [[nom]] et
   * les espaces insécables avant ? ! : ; (typographie française). */
  function t(tpl, vars) {
    var html = esc(tpl == null ? '' : tpl);
    if (vars) {
      html = html.replace(/\{(\w+)\}/g, function (m, k) {
        return Object.prototype.hasOwnProperty.call(vars, k) ? esc(vars[k]) : m;
      });
    }
    return html
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/Saint-Gobain/g, '<span class="nowrap">Saint-Gobain</span>')
      .replace(/ ([?!:;»])/g, ' $1')
      .replace(/« /g, '« ')
      .replace(/\n/g, '<br>')
      // [[nom]] → pictogramme pixel du jeu (cloche, sapin, cadeau…).
      .replace(/\[\[(\w+)\]\]/g, function (m, k) { return GQ.pix ? GQ.pix(k, 'pix-inline') : m; });
  }

  function letterIndex(l) {
    return LETTERS.indexOf(String(l || '').trim().toUpperCase());
  }

  /* Normalisation d'une réponse libre : minuscules, sans accents ni
   * ponctuation, sans article initial. */
  function normalize(s) {
    var x = String(s == null ? '' : s)
      .toLowerCase()
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    for (var i = 0; i < 2; i++) {
      x = x.replace(/^(le|la|les|l|un|une|des|du|de|d|au|aux) (?=\S)/, '');
    }
    return x;
  }

  function levenshtein(a, b) {
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }

  /* Comparaison tolérante d'une saisie avec une liste de réponses. */
  function matches(input, accepted) {
    var a = normalize(input);
    if (!a) return false;
    var tol = (P.reponses && P.reponses.toleranceFautes) || 0;
    return (accepted || []).some(function (raw) {
      var b = normalize(raw);
      if (!b) return false;
      if (a === b || a.replace(/ /g, '') === b.replace(/ /g, '')) return true;
      if (!tol || b.length < 6 || /\d/.test(a + b)) return false;
      // Les mots très courts (« a », « b », « 2e »…) doivent être identiques.
      var ta = a.split(' '), tb = b.split(' ');
      if (ta.length !== tb.length) return false;
      for (var i = 0; i < tb.length; i++) {
        if ((tb[i].length <= 2 || ta[i].length <= 2) && ta[i] !== tb[i]) return false;
      }
      return levenshtein(a, b) <= tol;
    });
  }

  function normCode(s) {
    return String(s == null ? '' : s).trim().toUpperCase().replace(/[\s_]+/g, '');
  }

  /* Durée lisible : « 45 secondes », « 3 minutes ». */
  function durationLabel(ms) {
    var sec = Math.round(ms / 1000);
    if (sec < 60) return sec + ' secondes';
    var m = Math.round(sec / 60);
    return m + (m > 1 ? ' minutes' : ' minute');
  }

  GQ.durationLabel = durationLabel;
  GQ.esc = esc;
  GQ.t = t;
  GQ.letter = function (i) { return LETTERS[i]; };
  GQ.letterIndex = letterIndex;
  GQ.normalize = normalize;
  GQ.matches = matches;


  /* ------------------------------------------------------------------ */
  /* Structure du jeu                                                    */
  /*   Chaque quête N se débloque en saisissant le mot secret affiché à   */
  /*   son étage (config/etapes.js). Le récit qui mène à l'étage s'affiche */
  /*   sur l'écran de saisie du mot secret.                               */
  /* ------------------------------------------------------------------ */

  var Q = CFG.quetes || {};
  GQ.QUEST_COUNT = 5;
  GQ.questCfg = function (n) {
    return [null, CFG.quiz, Q.message, Q.photos, Q.enquete, Q.traque][n] || {};
  };
  GQ.stage = function (n) { return (CFG.etapes || {})[n] || {}; };
  GQ.theme = function (id) {
    return ((CFG.quiz && CFG.quiz.themes) || []).filter(function (th) { return th.id === id; })[0] || null;
  };

  /* ------------------------------------------------------------------ */
  /* Sauvegarde locale (localStorage)                                    */
  /* ------------------------------------------------------------------ */

  var KEY = 'gobinous-quest:' + (P.cleSauvegarde || 'default');
  GQ.storageKey = KEY;

  GQ.storageOk = (function () {
    try {
      localStorage.setItem(KEY + ':probe', '1');
      localStorage.removeItem(KEY + ':probe');
      return true;
    } catch (e) {
      return false;
    }
  })();

  /* Identifiant aléatoire de la partie (suivi des équipes, photos). */
  function newId() {
    var a = '';
    while (a.length < 16) a += Math.random().toString(36).slice(2);
    return a.slice(0, 16);
  }

  function defaults() {
    return {
      v: 2,
      id: newId(),
      team: null,
      roles: null, // { chef, reporter } : Gobinous Capitaine et Gobinous Reporter
      startedAt: null,
      rulesOk: false,
      clockStart: null, // départ du chrono global (au « C'est parti ! »)
      quest: 1,
      // access : saisie du mot secret de l'étage ; done : quête terminée.
      phase: { 1: 'access', 2: 'access', 3: 'access', 4: 'access', 5: 'access' },
      quiz: {
        current: null, // { themeId, index, answers: [], revealed }
        attempts: [], // { themeId, result: 'en-cours' | 'echec' | 'reussi', score, answers, at }
        lastResult: null, // { themeId, score, total, success, locked, answers } | { forced }
        failedSinceLock: 0,
        lockUntil: 0,
        lockTotal: 0,
        passAfterLock: false, // quiz validé d'office à la fin du blocage
        wonTheme: null,
      },
      // Gel en cours (quêtes 1 à 5 hors quiz) : clé de l'étape, erreurs par
      // étape et suite prévue à la fin du gel ('valider' ou 'reessayer').
      gel: { until: 0, total: 0, key: null, after: null, fails: {} },
      q1: { floorBonus: false },
      q2: { forced: false },
      // photos : modèle → { at, thumb, sent } ; caprice : rang de la photo
      // que le lutin refusera une fois ; rejected : modèle refusé.
      q3: { photos: {}, caprice: null, rejected: false },
      q4: { step: 0, forced: {} },
      q5: { videoSeen: false },
      arrivals: {}, // n → horodatage de saisie du mot secret
      joker: { used: false, on: null, at: null },
      finished: null, // { at, by }
    };
  }

  function load() {
    var base = defaults();
    if (!GQ.storageOk) return base;
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return base;
      var s = JSON.parse(raw);
      if (!s || s.v !== base.v) return base;
      ['phase', 'quiz', 'gel', 'q1', 'q2', 'q3', 'q4', 'q5', 'arrivals', 'joker'].forEach(function (k) {
        s[k] = Object.assign(base[k], s[k] || {});
      });
      if (!s.id) s.id = base.id;
      return Object.assign(base, s);
    } catch (e) {
      return base;
    }
  }

  GQ.state = load();

  GQ.save = function () {
    if (!GQ.storageOk) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(GQ.state));
    } catch (e) { /* stockage plein ou bloqué : on continue en mémoire */ }
  };

  GQ.reload = function () { GQ.state = load(); };

  GQ.resetGame = function () {
    var old = GQ.state.id;
    GQ.state = defaults();
    GQ.save();
    if (GQ.sync && old) GQ.sync.forget(old);
  };

  /* ------------------------------------------------------------------ */
  /* Équipe, règles, chrono                                              */
  /* ------------------------------------------------------------------ */

  GQ.setTeam = function (name) {
    var s = GQ.state;
    s.team = String(name).trim().slice(0, 40);
    if (!s.startedAt) s.startedAt = Date.now();
    GQ.save();
  };

  GQ.setRoles = function (chef, reporter) {
    GQ.state.roles = { chef: String(chef).trim().slice(0, 40), reporter: String(reporter).trim().slice(0, 40) };
    GQ.save();
  };

  GQ.acceptRules = function () {
    GQ.state.rulesOk = true;
    if (!GQ.state.clockStart) GQ.state.clockStart = Date.now();
    GQ.save();
  };

  /* Chrono global : temps restant sur la durée prévue. Il s'arrête à la
   * fin de l'aventure et ne bloque jamais le jeu une fois écoulé. */
  GQ.clock = function () {
    var c = P.chrono || {};
    var s = GQ.state;
    if (c.actif === false || !s.clockStart) return null;
    var total = Math.max(1, Number(c.dureeMinutes) || 30) * 60000;
    var end = s.finished ? s.finished.at : Date.now();
    var elapsed = Math.max(0, end - s.clockStart);
    return { total: total, elapsed: elapsed, remaining: total - elapsed, frozen: !!s.finished };
  };

  GQ.setPhase = function (n, phase) {
    GQ.state.phase[n] = phase;
    GQ.save();
  };

  /* ------------------------------------------------------------------ */
  /* Mots secrets des étages                                             */
  /* ------------------------------------------------------------------ */

  /* Saisie du mot secret de l'étage de la quête n. Retourne true si la
   * quête n est débloquée. */
  GQ.unlockQuest = function (n, input) {
    var s = GQ.state;
    if (s.quest !== n || s.phase[n] !== 'access') return false;
    if (!matches(input, [GQ.stage(n).motSecret].concat(GQ.stage(n).variantes || []))) return false;
    s.arrivals[n] = Date.now();
    s.phase[n] = 'intro';
    GQ.save();
    return true;
  };

  /* Code d'entrée du jeu pas encore saisi (mot secret de la quête 1). */
  GQ.gameLocked = function () {
    var s = GQ.state;
    return s.quest === 1 && s.phase[1] === 'access';
  };

  /* Quête n terminée : on passe à la saisie du mot secret de la suivante. */
  GQ.completeQuest = function (n) {
    var s = GQ.state;
    if (s.quest !== n) return false;
    s.phase[n] = 'done';
    if (n < GQ.QUEST_COUNT) {
      s.quest = n + 1;
      s.phase[n + 1] = 'access';
    }
    GQ.save();
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* Durées et gels                                                      */
  /* ------------------------------------------------------------------ */

  /* Durée effective d'un blocage (le mode test peut la raccourcir). */
  function durationMs(sec) {
    sec = Math.max(0, Number(sec) || 0);
    if (GQ.test && GQ.test.isActive() && GQ.test.opt('shortLock')) {
      sec = Math.min(sec, (P.modeTest && P.modeTest.dureeBlocageCourtSecondes) || 15);
    }
    return sec * 1000;
  }

  /* Temps restant d'un blocage. Horloge du téléphone reculée : on ne
   * dépasse jamais la durée initiale. */
  function remaining(o, untilKey, totalKey) {
    var left = (o[untilKey] || 0) - Date.now();
    if (left <= 0) return 0;
    if (o[totalKey] && left > o[totalKey]) {
      o[untilKey] = Date.now() + o[totalKey];
      GQ.save();
      return o[totalKey];
    }
    return left;
  }

  /* Règle de pénalité d'une étape (config/parametres.js → penalites). */
  function rule(name) {
    var r = (P.penalites || {})[name] || {};
    return {
      tries: Math.max(1, Number(r.essais) || 2),
      sec: r.gelSecondes != null ? r.gelSecondes : 45,
      after: r.apresGel === 'reessayer' ? 'reessayer' : 'valider',
    };
  }
  GQ.penaltyRule = rule;

  /* Variables des textes : {duree} (gel du quiz), {chrono}. */
  GQ.ruleVars = function () {
    var c = P.chrono || {};
    return {
      duree: durationLabel(Math.max(0, Number((P.quiz || {}).dureeBlocageSecondes) || 0) * 1000),
      chrono: (Number(c.dureeMinutes) || 30) + ' minutes',
    };
  };

  GQ.freezeRemaining = function () {
    return remaining(GQ.state.gel, 'until', 'total');
  };

  /* Erreur sur une étape (clé : etage, q2, q4-0…q4-3, q5) soumise à la
   * règle `name`. Retour : { frozen, left } (left : essais restants). */
  GQ.penalize = function (key, name) {
    var r = rule(name);
    var g = GQ.state.gel;
    g.fails[key] = (g.fails[key] || 0) + 1;
    if (g.fails[key] < r.tries) {
      GQ.save();
      return { frozen: false, left: r.tries - g.fails[key] };
    }
    g.fails[key] = 0;
    g.total = durationMs(r.sec);
    g.until = Date.now() + g.total;
    g.key = key;
    g.after = r.after;
    GQ.save();
    return { frozen: true, left: 0 };
  };

  /* Gestionnaires « valider d'office » par étape, appelés à la fin d'un
   * gel dont la suite est 'valider'. */
  var passHandlers = {};
  GQ.onFreezePass = function (prefix, fn) { passHandlers[prefix] = fn; };

  /* À appeler avant d'afficher une étape : applique la fin d'un gel.
   * Retourne la clé de l'étape validée d'office, ou null. */
  GQ.freezeCheck = function () {
    var g = GQ.state.gel;
    if (!g.key || GQ.freezeRemaining() > 0) return null;
    var key = g.key;
    var after = g.after;
    g.key = null;
    g.after = null;
    var done = null;
    if (after === 'valider') {
      var fn = passHandlers[key.split('-')[0]];
      if (fn && fn(key)) done = key;
    }
    GQ.save();
    return done;
  };

  /* ------------------------------------------------------------------ */
  /* Quête 1 : le grand quiz                                             */
  /* ------------------------------------------------------------------ */

  GQ.lockDurationMs = function () {
    return durationMs((P.quiz || {}).dureeBlocageSecondes);
  };

  GQ.quizLockRemaining = function () {
    return remaining(GQ.state.quiz, 'lockUntil', 'lockTotal');
  };

  /* Blocage du quiz (deuxième thème raté, ou mode test). */
  GQ.quizLock = function () {
    var q = GQ.state.quiz;
    q.lockTotal = GQ.lockDurationMs();
    q.lockUntil = Date.now() + q.lockTotal;
    q.failedSinceLock = 0;
    q.passAfterLock = (P.quiz || {}).valideApresBlocage !== false;
  };

  /* Fin du blocage : si le quiz est validé d'office, l'équipe passe
   * directement à l'écran de réussite. Retourne true si c'est le cas. */
  GQ.quizCheckPass = function () {
    var s = GQ.state;
    var q = s.quiz;
    if (!q.passAfterLock || s.quest !== 1 || GQ.quizLockRemaining() > 0) return false;
    if (['themes', 'result'].indexOf(s.phase[1]) === -1) return false;
    q.passAfterLock = false;
    q.current = null;
    q.wonTheme = q.wonTheme || 'gel';
    q.lastResult = { forced: true, at: Date.now() };
    s.phase[1] = 'success';
    GQ.save();
    return true;
  };

  GQ.failedThemeIds = function () {
    var out = {};
    GQ.state.quiz.attempts.forEach(function (a) { if (a.result === 'echec') out[a.themeId] = true; });
    return out;
  };

  /* Thèmes déjà joués (réussis ou ratés) : ils ne peuvent plus être
   * rejoués, et leur correction peut être consultée. */
  GQ.playedThemeIds = function () {
    var out = {};
    GQ.state.quiz.attempts.forEach(function (a) { if (a.result !== 'en-cours') out[a.themeId] = true; });
    return out;
  };

  GQ.themeAvailable = function (id) {
    var themes = CFG.quiz.themes;
    var failed = GQ.failedThemeIds();
    var allFailed = themes.every(function (th) { return failed[th.id]; });
    return allFailed || !failed[id];
  };

  GQ.quizStart = function (id) {
    var q = GQ.state.quiz;
    if (q.current || GQ.quizLockRemaining() > 0 || !GQ.theme(id) || !GQ.themeAvailable(id)) return false;
    q.attempts.push({ themeId: id, result: 'en-cours', at: Date.now() });
    q.current = { themeId: id, index: 0, answers: [], revealed: !GQ.theme(id).mystere };
    q.lastResult = null;
    GQ.state.phase[1] = 'play';
    GQ.save();
    return true;
  };

  /* Thème mystère : l'équipe a vu la révélation du thème. */
  GQ.quizReveal = function () {
    var cur = GQ.state.quiz.current;
    if (!cur) return false;
    cur.revealed = true;
    GQ.save();
    return true;
  };

  /* Tentative échouée (thème raté ou abandonné). Retourne true si le
   * quiz se bloque. */
  function failCurrentTheme(score) {
    var q = GQ.state.quiz;
    var last = q.attempts[q.attempts.length - 1];
    if (last && last.result === 'en-cours') {
      last.result = 'echec';
      if (score != null) last.score = score;
      if (q.current) last.answers = q.current.answers.slice();
    }
    q.current = null;
    q.failedSinceLock += 1;
    var locked = false;
    if (q.failedSinceLock >= ((P.quiz && P.quiz.tentativesAvantBlocage) || 2)) {
      GQ.quizLock();
      locked = true;
    }
    return locked;
  }

  /* Abandon volontaire du thème en cours → tentative échouée. */
  GQ.quizAbandon = function () {
    if (!GQ.state.quiz.current) return false;
    var locked = failCurrentTheme(null);
    GQ.state.phase[1] = 'themes';
    GQ.save();
    return { locked: locked };
  };

  /* Un nouvel échec déclencherait-il le blocage ? */
  GQ.quizNextFailLocks = function () {
    return GQ.state.quiz.failedSinceLock + 1 >= ((P.quiz && P.quiz.tentativesAvantBlocage) || 2);
  };

  /* Les réponses ne sont corrigées qu'à la fin du thème : on enregistre
   * simplement le choix de l'équipe pour la question en cours. */
  GQ.quizSelect = function (choiceIdx) {
    var cur = GQ.state.quiz.current;
    if (!cur) return false;
    var question = GQ.theme(cur.themeId).questions[cur.index];
    if (!(choiceIdx >= 0 && choiceIdx < question.choix.length)) return false;
    cur.answers[cur.index] = choiceIdx;
    GQ.save();
    return true;
  };

  GQ.quizMove = function (delta) {
    var cur = GQ.state.quiz.current;
    if (!cur) return false;
    var total = GQ.theme(cur.themeId).questions.length;
    if (delta > 0 && cur.answers[cur.index] == null) return false;
    var next = cur.index + delta;
    if (next < 0 || next >= total) return false;
    cur.index = next;
    GQ.save();
    return true;
  };

  GQ.quizAllAnswered = function () {
    var cur = GQ.state.quiz.current;
    if (!cur) return false;
    var qs = GQ.theme(cur.themeId).questions;
    for (var i = 0; i < qs.length; i++) if (cur.answers[i] == null) return false;
    return true;
  };

  /* Correction du thème. Retour : { score, total, success, locked, answers } */
  GQ.quizSubmit = function () {
    var q = GQ.state.quiz;
    var cur = q.current;
    if (!cur || !GQ.quizAllAnswered()) return null;
    var qs = GQ.theme(cur.themeId).questions;
    var score = 0;
    qs.forEach(function (question, i) {
      if (letterIndex(question.reponse) === cur.answers[i]) score++;
    });
    var res = {
      themeId: cur.themeId, score: score, total: qs.length, success: score === qs.length,
      locked: false, answers: cur.answers.slice(), at: Date.now(),
    };
    if (res.success) {
      var last = q.attempts[q.attempts.length - 1];
      if (last) { last.result = 'reussi'; last.score = score; last.answers = res.answers; }
      q.wonTheme = cur.themeId;
      q.current = null;
      GQ.state.phase[1] = 'success';
    } else {
      res.locked = failCurrentTheme(score);
      GQ.state.phase[1] = 'result';
    }
    q.lastResult = res;
    GQ.save();
    return res;
  };

  /* Après le quiz : deviner l'étage de la quête 2. Une erreur gèle le jeu
   * quelques secondes, puis l'indice bonus apparaît. */
  GQ.floorAnswer = function (input) {
    var s = GQ.state;
    var F = (CFG.quiz && CFG.quiz.etage) || {};
    if (s.quest !== 1 || s.phase[1] !== 'floor' || GQ.freezeRemaining() > 0) return null;
    if (matches(input, F.reponses)) {
      GQ.completeQuest(1);
      return { ok: true };
    }
    s.q1.floorBonus = true;
    return Object.assign({ ok: false }, GQ.penalize('etage', 'etage'));
  };

  /* ------------------------------------------------------------------ */
  /* Quête 2 : le message codé                                           */
  /* ------------------------------------------------------------------ */

  GQ.messageAnswer = function (input) {
    var s = GQ.state;
    if (s.quest !== 2 || s.phase[2] !== 'play' || GQ.freezeRemaining() > 0) return null;
    if (matches(input, Q.message.reponses)) {
      s.phase[2] = 'success';
      GQ.save();
      return { ok: true };
    }
    return Object.assign({ ok: false }, GQ.penalize('q2', 'message'));
  };

  GQ.onFreezePass('q2', function () {
    var s = GQ.state;
    if (s.quest !== 2 || s.phase[2] !== 'play') return false;
    s.q2.forced = true;
    s.phase[2] = 'success';
    return true;
  });

  /* ------------------------------------------------------------------ */
  /* Quête 3 : le défi photo                                             */
  /* ------------------------------------------------------------------ */

  function photoCount() { return Math.max(1, Number(Q.photos && Q.photos.nombre) || 3); }
  GQ.photoCount = photoCount;

  /* Début du défi : le lutin choisit en secret laquelle des photos il
   * refusera (rang de validation, tiré au hasard). */
  GQ.photosStart = function () {
    var q3 = GQ.state.q3;
    if (q3.caprice == null) q3.caprice = Math.floor(Math.random() * photoCount());
    GQ.state.phase[3] = 'play';
    GQ.save();
  };

  GQ.photosValidated = function () {
    return Object.keys(GQ.state.q3.photos).length;
  };

  /* Validation d'une photo. Le lutin refuse la première tentative d'une
   * des photos (une seule fois par équipe) : la photo reprise ensuite est
   * toujours acceptée. Retour : 'rejet' | 'ok' | null. */
  GQ.photoValidate = function (modelId, info) {
    var q3 = GQ.state.q3;
    if (GQ.state.quest !== 3 || GQ.state.phase[3] !== 'play') return null;
    if (q3.photos[modelId] || GQ.photosValidated() >= photoCount()) return null;
    if (!q3.rejected && q3.caprice != null && GQ.photosValidated() === q3.caprice) {
      q3.rejected = modelId;
      GQ.save();
      return 'rejet';
    }
    q3.photos[modelId] = Object.assign({ at: Date.now() }, info || {});
    GQ.save();
    return 'ok';
  };

  GQ.photoSent = function (modelId) {
    var p = GQ.state.q3.photos[modelId];
    if (!p) return;
    p.sent = true;
    GQ.save();
  };

  GQ.photosComplete = function () {
    var s = GQ.state;
    if (s.quest !== 3 || s.phase[3] !== 'play' || GQ.photosValidated() < photoCount()) return false;
    s.phase[3] = 'success';
    GQ.save();
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* Quête 4 : l'enquête du Support 44                                   */
  /* ------------------------------------------------------------------ */

  function q4Advance(forced) {
    var s = GQ.state;
    if (forced) s.q4.forced[s.q4.step] = true;
    s.q4.step += 1;
    if (s.q4.step >= Q.enquete.modules.length) s.phase[4] = 'success';
  }

  /* Réponse au module en cours (choix : index ; saisie : texte). */
  GQ.moduleAnswer = function (value) {
    var s = GQ.state;
    var m = Q.enquete.modules[s.q4.step];
    if (s.quest !== 4 || s.phase[4] !== 'play' || !m || GQ.freezeRemaining() > 0) return null;
    var ok = m.choix
      ? letterIndex(m.reponse) === Number(value)
      : matches(value, m.reponses);
    if (ok) {
      q4Advance(false);
      GQ.save();
      return { ok: true, done: s.phase[4] === 'success' };
    }
    return Object.assign({ ok: false }, GQ.penalize('q4-' + s.q4.step, 'enquete'));
  };

  GQ.onFreezePass('q4', function (key) {
    var s = GQ.state;
    if (s.quest !== 4 || s.phase[4] !== 'play' || 'q4-' + s.q4.step !== key) return false;
    q4Advance(true);
    return true;
  });

  /* ------------------------------------------------------------------ */
  /* Quête 5 : la traque du 33ᵉ étage                                    */
  /* ------------------------------------------------------------------ */

  /* La vidéo ne peut être lue qu'une fois : marquée vue dès le lancement. */
  GQ.videoStart = function () {
    var s = GQ.state;
    if (s.q5.videoSeen) return false;
    s.q5.videoSeen = true;
    s.phase[5] = 'video';
    GQ.save();
    return true;
  };

  GQ.lairAnswer = function (input) {
    var s = GQ.state;
    if (s.quest !== 5 || s.phase[5] !== 'report' || GQ.freezeRemaining() > 0) return null;
    if (matches(input, Q.traque.reponses)) {
      s.phase[5] = 'found';
      GQ.save();
      return { ok: true };
    }
    return Object.assign({ ok: false }, GQ.penalize('q5', 'repaire'));
  };

  /* ------------------------------------------------------------------ */
  /* Joker                                                               */
  /* ------------------------------------------------------------------ */

  GQ.useJoker = function (key) {
    var j = GQ.state.joker;
    if (j.used) return false;
    GQ.state.joker = { used: true, on: key, at: Date.now() };
    GQ.save();
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* Fin de partie                                                       */
  /* ------------------------------------------------------------------ */

  GQ.finish = function (by) {
    var s = GQ.state;
    for (var k = 1; k <= 4; k++) s.phase[k] = 'done';
    s.quest = 5;
    s.phase[5] = 'end';
    if (!s.finished) s.finished = { at: Date.now(), by: by };
    GQ.save();
  };

  /* ------------------------------------------------------------------ */
  /* Navigation directe (mode test, ou reprise sur un autre téléphone)   */
  /*   phase : 'access' (avant le mot secret) ou 'intro' (par défaut).   */
  /* ------------------------------------------------------------------ */

  GQ.jumpTo = function (n, phase) {
    var s = GQ.state;
    var base = defaults();
    if (!s.team) s.team = 'Équipe test';
    if (!s.startedAt) s.startedAt = Date.now();
    s.rulesOk = true;
    if (!s.clockStart) s.clockStart = Date.now();
    s.finished = null;
    s.quest = n;
    s.gel = base.gel;
    for (var k = 1; k <= GQ.QUEST_COUNT; k++) {
      s.phase[k] = k < n ? 'done' : k === n ? phase || 'intro' : 'access';
      if (k < n) s.arrivals[k] = s.arrivals[k] || Date.now();
      else if (k > n || phase === 'access') delete s.arrivals[k];
    }
    if (n <= 1) {
      s.quiz = base.quiz;
      s.q1 = base.q1;
    } else {
      s.quiz.current = null;
      s.quiz.lastResult = null;
      if (!s.quiz.wonTheme) s.quiz.wonTheme = CFG.quiz.themes[0].id;
    }
    if (n <= 2) s.q2 = base.q2;
    if (n <= 3) s.q3 = base.q3;
    if (n <= 4) s.q4 = base.q4;
    s.q5 = base.q5;
    GQ.save();
  };
})();
