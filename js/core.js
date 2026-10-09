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
   * Gère \n, **gras**, les variables {nom} et les espaces insécables
   * avant ? ! : ; (typographie française). */
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
      .replace(/\n/g, '<br>');
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

  GQ.esc = esc;
  GQ.t = t;
  GQ.letter = function (i) { return LETTERS[i]; };
  GQ.letterIndex = letterIndex;
  GQ.normalize = normalize;
  GQ.matches = matches;

  /* ------------------------------------------------------------------ */
  /* Structure du jeu (ordre des quêtes, lieux)                          */
  /* ------------------------------------------------------------------ */

  var Q = CFG.quetes || {};
  GQ.QUEST_COUNT = 5;
  GQ.questCfg = function (n) {
    return [null, CFG.quiz, Q.enigme, Q.defi, Q.dernierIndice, Q.hotte][n] || {};
  };
  GQ.placeIdForQuest = function (n) {
    return n >= 1 && n <= 4 ? GQ.questCfg(n).lieu : null;
  };
  GQ.place = function (id) {
    return (CFG.lieux || {})[id] || null;
  };
  GQ.questForPlace = function (id) {
    for (var n = 1; n <= 4; n++) if (GQ.placeIdForQuest(n) === id) return n;
    return 0;
  };
  GQ.finalPlaceId = function () { return GQ.placeIdForQuest(4); };
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

  /* Identifiant aléatoire de la partie (suivi des équipes). */
  function newId() {
    var a = '';
    while (a.length < 16) a += Math.random().toString(36).slice(2);
    return a.slice(0, 16);
  }

  function defaults() {
    return {
      v: 1,
      id: newId(),
      team: null,
      startedAt: null,
      rulesOk: false,
      clockStart: null, // départ du chrono global (au « C'est parti ! »)
      quest: 1,
      phase: { 1: 'intro', 2: 'intro', 3: 'intro', 4: 'intro', 5: 'final' },
      quiz: {
        current: null, // { themeId, index, answers: [] }
        attempts: [], // { themeId, result: 'en-cours' | 'echec' | 'reussi', score, at }
        lastResult: null, // dernier résultat affiché { themeId, score, total, success, locked }
        failedSinceLock: 0,
        lockUntil: 0,
        lockTotal: 0,
        passAfterLock: false, // quiz validé d'office à la fin du blocage
        wonTheme: null,
      },
      gel: { until: 0, total: 0 }, // gel après une mauvaise réponse (quêtes 2 à 4)
      defi: { index: 0, tried: [] },
      places: {}, // id → { found: horodatage, arrived: horodatage }
      joker: { used: false, on: null, at: null },
      finished: null, // { at, by: 'code' | 'qr' | 'test' }
    };
  }

  function load() {
    var base = defaults();
    if (!GQ.storageOk) return base;
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return base;
      var s = JSON.parse(raw);
      if (!s || s.v !== 1) return base;
      ['phase', 'quiz', 'defi', 'joker', 'gel'].forEach(function (k) {
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
  /* Équipe et règles                                                    */
  /* ------------------------------------------------------------------ */

  GQ.setTeam = function (name) {
    var s = GQ.state;
    s.team = String(name).trim().slice(0, 40);
    if (!s.startedAt) s.startedAt = Date.now();
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
  /* Quête 1 : quiz                                                      */
  /* ------------------------------------------------------------------ */

  /* Durée effective d'un blocage (le mode test peut la raccourcir). */
  function durationMs(sec) {
    if (GQ.test && GQ.test.isActive() && GQ.test.opt('shortLock')) {
      sec = (P.modeTest && P.modeTest.dureeBlocageCourtSecondes) || 15;
    }
    return Math.max(0, Number(sec) || 0) * 1000;
  }

  /* Temps restant d'un blocage { until, total }. Horloge du téléphone
   * reculée : on ne dépasse jamais la durée initiale. */
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

  /* ------------------------------------------------------------------ */
  /* Gel après une mauvaise réponse (quêtes 2 à 4)                       */
  /* ------------------------------------------------------------------ */

  GQ.freezeRemaining = function () {
    return remaining(GQ.state.gel, 'until', 'total');
  };

  function freeze() {
    var g = P.gel || {};
    if (g.actif === false) return;
    var total = durationMs(g.dureeSecondes != null ? g.dureeSecondes : 50);
    if (!total) return;
    GQ.state.gel = { until: Date.now() + total, total: total };
  }

  GQ.failedThemeIds = function () {
    var out = {};
    GQ.state.quiz.attempts.forEach(function (a) { if (a.result === 'echec') out[a.themeId] = true; });
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
    q.current = { themeId: id, index: 0, answers: [] };
    q.lastResult = null;
    GQ.state.phase[1] = 'play';
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

  /* Correction du thème. Retour : { score, total, success, locked } */
  GQ.quizSubmit = function () {
    var q = GQ.state.quiz;
    var cur = q.current;
    if (!cur || !GQ.quizAllAnswered()) return null;
    var qs = GQ.theme(cur.themeId).questions;
    var score = 0;
    qs.forEach(function (question, i) {
      if (letterIndex(question.reponse) === cur.answers[i]) score++;
    });
    var res = { themeId: cur.themeId, score: score, total: qs.length, success: score === qs.length, locked: false, at: Date.now() };
    if (res.success) {
      var last = q.attempts[q.attempts.length - 1];
      if (last) { last.result = 'reussi'; last.score = score; }
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

  /* ------------------------------------------------------------------ */
  /* Quête 3 : défi (QCM, gel après chaque erreur)                       */
  /* ------------------------------------------------------------------ */

  GQ.defiAnswer = function (choiceIdx) {
    var d = GQ.state.defi;
    var qs = Q.defi.questions;
    var question = qs[d.index];
    if (!question || GQ.freezeRemaining() > 0) return null;
    if (letterIndex(question.reponse) === choiceIdx) {
      d.index += 1;
      d.tried = [];
      if (d.index >= qs.length) GQ.state.phase[3] = 'success';
      GQ.save();
      return { correct: true, done: d.index >= qs.length };
    }
    if (d.tried.indexOf(choiceIdx) === -1) d.tried.push(choiceIdx);
    freeze();
    GQ.save();
    return { correct: false };
  };

  /* ------------------------------------------------------------------ */
  /* Énigmes (quêtes 2 et 4)                                             */
  /* ------------------------------------------------------------------ */

  /* Une mauvaise réponse déclenche le gel. */
  GQ.enigmaAnswer = function (n, input) {
    if (GQ.freezeRemaining() > 0) return false;
    function wrong() { freeze(); GQ.save(); return false; }
    if (n === 2) {
      if (!matches(input, Q.enigme.reponses)) return wrong();
      GQ.state.phase[2] = 'success';
    } else if (n === 4) {
      var id = GQ.finalPlaceId();
      if (!matches(input, GQ.place(id).reponsesAcceptees)) return wrong();
      GQ.state.places[id] = Object.assign(GQ.state.places[id] || {}, { found: Date.now() });
      GQ.state.phase[4] = 'success';
    } else {
      return false;
    }
    GQ.save();
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* Lieux et QR codes                                                   */
  /* ------------------------------------------------------------------ */

  GQ.placeGuess = function (n, input) {
    var id = GQ.placeIdForQuest(n);
    if (!matches(input, GQ.place(id).reponsesAcceptees)) return false;
    GQ.state.places[id] = Object.assign(GQ.state.places[id] || {}, { found: Date.now() });
    GQ.state.phase[n] = 'travel';
    GQ.save();
    return true;
  };

  GQ.placeIdForCode = function (code) {
    var c = normCode(code);
    var L = CFG.lieux || {};
    for (var id in L) if (c && normCode(L[id].codeQR) === c) return id;
    return null;
  };

  /* Arrivée sur un lieu (scan du QR code, saisie du code ou bouton).
   * Retour : { status, placeId, next }
   *   status : 'ok' | 'deja' | 'trop-tot' | 'inconnu' | 'pas-de-partie'
   *            | 'fin' | 'deja-fini' | 'fin-desactivee' */
  GQ.arriveByCode = function (code) {
    var id = GQ.placeIdForCode(code);
    if (!id) return { status: 'inconnu' };
    return GQ.arriveAt(id);
  };

  GQ.arriveAt = function (id) {
    var s = GQ.state;
    var n = GQ.questForPlace(id);
    var res = { placeId: id };
    if (!s.team) return Object.assign(res, { status: 'pas-de-partie' });
    if (!n) return Object.assign(res, { status: 'inconnu' });

    if (n === 4) {
      // Lieu final : le QR code peut clôturer la partie.
      if (s.finished) return Object.assign(res, { status: 'deja-fini' });
      var ready = s.quest === 5 || (s.quest === 4 && s.phase[4] === 'success');
      if (!ready) return Object.assign(res, { status: 'trop-tot' });
      if (!(P.finDePartie && P.finDePartie.qrFinalActif)) return Object.assign(res, { status: 'fin-desactivee' });
      s.places[id] = Object.assign(s.places[id] || {}, { arrived: Date.now() });
      GQ.finish('qr');
      return Object.assign(res, { status: 'fin' });
    }

    if (s.quest > n) return Object.assign(res, { status: 'deja', next: n + 1 });
    var p = s.places[id];
    if (s.quest < n || !p || !p.found) return Object.assign(res, { status: 'trop-tot' });
    s.places[id] = Object.assign(p, { arrived: Date.now() });
    s.phase[n] = 'done';
    s.quest = n + 1;
    s.phase[n + 1] = n + 1 === 5 ? 'final' : 'intro';
    GQ.save();
    return Object.assign(res, { status: 'ok', next: n + 1 });
  };

  /* Passage de la quête 4 (lieu final trouvé) à la quête 5. */
  GQ.goToFinale = function () {
    var s = GQ.state;
    if (s.quest !== 4 || s.phase[4] !== 'success') return false;
    s.phase[4] = 'done';
    s.quest = 5;
    s.phase[5] = 'final';
    GQ.save();
    return true;
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

  GQ.checkOrganizerCode = function (input) {
    var code = P.finDePartie && P.finDePartie.codeOrganisateur;
    return !!code && normCode(input) === normCode(code);
  };

  GQ.finish = function (by) {
    var s = GQ.state;
    for (var k = 1; k <= 4; k++) s.phase[k] = 'done';
    s.quest = 5;
    s.phase[5] = 'final';
    s.finished = { at: Date.now(), by: by };
    GQ.save();
  };

  /* ------------------------------------------------------------------ */
  /* Navigation directe (mode test, ou reprise sur un autre téléphone)   */
  /* ------------------------------------------------------------------ */

  GQ.jumpTo = function (n) {
    var s = GQ.state;
    if (!s.team) s.team = 'Équipe test';
    if (!s.startedAt) s.startedAt = Date.now();
    s.rulesOk = true;
    if (!s.clockStart) s.clockStart = Date.now();
    s.finished = null;
    s.gel = defaults().gel;
    s.quest = n;
    for (var k = 1; k <= 5; k++) {
      if (k < n) s.phase[k] = 'done';
      else s.phase[k] = k === 5 ? 'final' : 'intro';
      var id = GQ.placeIdForQuest(k);
      if (!id) continue;
      if (k < n) s.places[id] = { found: Date.now(), arrived: k < 4 ? Date.now() : null };
      else delete s.places[id];
    }
    if (n <= 1) {
      s.quiz = defaults().quiz;
    } else {
      s.quiz.current = null;
      s.quiz.lastResult = null;
      if (!s.quiz.wonTheme) s.quiz.wonTheme = CFG.quiz.themes[0].id;
    }
    if (n <= 3) s.defi = { index: 0, tried: [] };
    GQ.save();
  };
})();
