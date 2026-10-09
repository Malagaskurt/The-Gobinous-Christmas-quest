/* Écrans du parcours participant et actions associées. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var CFG = GQ.cfg;
  var T = CFG.textes;
  var QZ = CFG.quiz;
  var Q = CFG.quetes;
  var P = CFG.parametres;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;
  var art = GQ.art;

  var screens = (GQ.screens = {});
  var actions = (GQ.actions = GQ.actions || {});
  var forms = (GQ.forms = GQ.forms || {});

  /* État d'affichage temporaire (sélection, message, saisie en cours).
   * Il n'est pas sauvegardé et est vidé à chaque changement d'écran. */
  GQ.ui = {};
  GQ.uiReset = function () { GQ.ui = {}; };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function plain(s) { return String(s == null ? '' : s); }

  function btn(label, action, attrs, cls) {
    return '<button type="button" class="btn ' + (cls || 'btn-primary') + '" data-action="' + action + '"' + (attrs || '') + '>' + label + '</button>';
  }

  function feedbackSlot() {
    var m = GQ.ui.msg;
    return '<div class="feedback-slot" aria-live="polite">' +
      (m ? '<p class="feedback feedback-' + m.kind + (m.shake ? ' shake' : '') + '">' + icon(m.kind === 'error' ? 'croix' : 'valide') + '<span>' + t(m.text) + '</span></p>' : '') +
      '</div>';
  }

  function testAnswers(list) {
    if (!GQ.test.isActive() || !GQ.test.opt('showAnswers') || !list) return '';
    return '<p class="test-note">Mode test · réponses acceptées : ' + list.map(esc).join(' / ') + '</p>';
  }

  function testVerify(note) {
    if (!note || !GQ.test.isActive()) return '';
    return '<p class="test-note test-note-warn">À vérifier : ' + esc(note) + '</p>';
  }

  function minutesLabel(ms) {
    var sec = Math.round(ms / 1000);
    if (sec < 60) return sec + ' secondes';
    var m = Math.round(sec / 60);
    return m + (m > 1 ? ' minutes' : ' minute');
  }

  function cta(inner) { return '<div class="sticky-cta">' + inner + '</div>'; }

  /* ------------------------------------------------------------------ */
  /* Composants                                                          */
  /* ------------------------------------------------------------------ */

  function questHead(n, sub) {
    return (
      '<div class="quest-head">' +
      '<p class="quest-script">' + t(T.general.queteNumero, { n: n }) + '<span class="quest-of"> / ' + GQ.QUEST_COUNT + '</span></p>' +
      '<h1 class="quest-title" tabindex="-1">' + t(GQ.questCfg(n).titre) + '</h1>' +
      (sub ? '<p class="eyebrow">' + t(sub) + '</p>' : '') +
      '</div>'
    );
  }

  GQ.jokerBlock = function (key, hint) {
    if (!hint || !String(hint).trim()) return '';
    var j = GQ.state.joker;
    if (j.used && j.on === key) {
      return '<div class="joker-hint" role="note"><p class="joker-hint-title">' + icon('etoile') + esc(T.joker.titreIndice) + '</p><p>' + t(hint) + '</p></div>';
    }
    if (j.used) {
      return '<button type="button" class="btn btn-joker" disabled>' + icon('etoile') + esc(T.joker.dejaUtilise) + '</button>';
    }
    return '<button type="button" class="btn btn-joker" data-action="joker" data-key="' + esc(key) + '">' + icon('etoile') + esc(T.joker.bouton) + '</button>';
  };

  function progress(index, total, answered) {
    var states = [];
    for (var i = 0; i < total; i++) states.push(i === index ? 'current' : answered(i) ? 'done' : 'todo');
    return (
      '<div class="q-progress"><span class="q-count">' + t(T.general.questionNumero, { n: index + 1, total: total }) + '</span>' +
      '<span class="dots" aria-hidden="true">' + states.map(function (st) { return '<i class="dot dot-' + st + '"></i>'; }).join('') + '</span></div>'
    );
  }

  /* Liste de propositions. selected : index choisi ; tried : propositions
   * déjà écartées (quête 3) ; correct : bonne réponse à révéler. */
  function choices(q, o) {
    var correct = GQ.letterIndex(q.reponse);
    var showTest = GQ.test.isActive() && GQ.test.opt('showAnswers');
    return '<ul class="choices" role="radiogroup" aria-labelledby="qtext">' + q.choix.map(function (c, i) {
      var tried = (o.tried || []).indexOf(i) !== -1;
      var sel = !o.reveal && o.selected === i;
      var ok = o.reveal && i === correct;
      var cls = (tried ? ' is-wrong' : '') + (sel ? ' is-selected' : '') + (ok ? ' is-correct' : '') + (o.reveal && !ok ? ' is-dim' : '');
      return (
        '<li><button type="button" role="radio" aria-checked="' + sel + '" class="choice' + cls + '" data-action="select" data-scope="' + o.scope + '" data-i="' + i + '"' + (tried || o.reveal ? ' disabled' : '') + '>' +
        '<span class="choice-letter">' + GQ.letter(i) + '</span>' +
        '<span class="choice-text">' + t(c) + '</span>' +
        (tried ? icon('croix', 'choice-icon') : '') + (ok ? icon('valide', 'choice-icon') : '') +
        (showTest && !o.reveal && i === correct ? '<span class="test-badge">bonne réponse</span>' : '') +
        '</button></li>'
      );
    }).join('') + '</ul>';
  }

  function questionCard(q) {
    return '<div class="question-card"><h2 class="question" id="qtext">' + t(q.question) + '</h2>' + testVerify(q.aVerifier) + '</div>';
  }

  /* Champ de réponse libre (énigmes, lieux, codes). */
  function textAnswer(o) {
    return (
      '<form class="answer-form" data-form="' + o.form + '"' + (o.attrs || '') + ' novalidate autocomplete="off">' +
      '<label class="field-label" for="answer-' + o.form + '">' + t(o.label) + '</label>' +
      '<input class="field" id="answer-' + o.form + '" name="answer" type="text" maxlength="80" autocomplete="off" autocapitalize="' + (o.caps ? 'characters' : 'off') + '" autocorrect="off" spellcheck="false" enterkeyhint="done" value="' + esc(GQ.ui.value || '') + '"' + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + '>' +
      feedbackSlot() +
      testAnswers(o.expected) +
      '<button class="btn ' + (o.btnCls || 'btn-primary') + '" type="submit">' + esc(o.button) + '</button>' +
      '</form>'
    );
  }

  /* Bloc de réussite : pictogramme, mot manuscrit, titre, texte. */
  function successBlock(o) {
    var script = o.script == null ? T.general.bravo : o.script;
    return (
      '<section class="success">' +
      (o.art === '' ? '' : '<div class="success-art">' + (o.art || art.check('success-check')) + '</div>') +
      (o.score ? '<p class="score' + (o.scoreKind === 'red' ? ' score-red' : '') + '">' + esc(o.score) + '</p>' : '') +
      (String(script).trim() ? '<p class="pixel-text success-script">' + t(script) + '</p>' : '') +
      '<h1 class="success-title" tabindex="-1">' + t(o.title) + '</h1>' + (o.html || '') + '</section>' +
      (o.cta ? cta(o.cta) : '')
    );
  }

  /* ------------------------------------------------------------------ */
  /* Accueil, équipe, règles                                             */
  /* ------------------------------------------------------------------ */

  screens.home = function () {
    var A = T.accueil;
    var s = GQ.state;
    var opt = function (v, html) { return String(v || '').trim() ? html : ''; };
    var action = s.team
      ? '<p class="home-resume">' + t(A.partieEnCours, { equipe: s.team }) + '</p>' + btn(esc(A.boutonReprendre) + icon('fleche'), 'resume', '', 'btn-red')
      : btn(esc(A.bouton) + icon('fleche'), 'start', '', 'btn-red');
    var notes = opt(A.noteGauche + A.noteDroite, '<div class="home-notes"><p>' + t(A.noteGauche) + '</p><p>' + t(A.noteDroite) + '</p></div>');
    return {
      key: 'home',
      bare: true,
      elf: { walk: '.band', say: 'accueil' },
      html:
        '<main class="screen-home knit">' +
        '<div class="home-top"><span class="corner corner-l" aria-hidden="true"></span>' + opt(A.annee, '<span class="pixel-text home-year">' + t(A.annee) + '</span>') + '<span class="corner corner-r" aria-hidden="true"></span></div>' +
        '<div class="home-logo">' + GQ.logo('clair') + '</div>' +
        '<div class="home-hero">' +
        GQ.knit.img('star', 'home-star') +
        opt(A.surtitre, '<p class="home-club">' + t(A.surtitre) + '</p>') +
        '<h1 class="home-title" tabindex="-1">' + GQ.knit.text(plain(A.titre), { cls: 'home-knit-title', outline: true }) +
        '<span class="pixel-text home-pixel">' + t(A.titreSuite) + '</span></h1>' +
        opt(A.sousTitre, '<p class="home-subtitle">' + t(A.sousTitre) + '</p>') +
        opt(A.accroche, '<p class="home-lead">' + t(A.accroche) + '</p>') +
        '</div>' +
        '<div class="home-cta">' + action + '</div>' +
        '<div class="band" aria-hidden="true"></div>' +
        (notes || '<div class="home-spacer"></div>') +
        '</main>',
    };
  };

  /* Bandeau des écrans d'entrée : même univers que les écrans de jeu. */
  function miniHeader() {
    return '<header class="topbar topbar-mini"><div class="topbar-row topbar-center">' + GQ.logo('clair', 'brand-logo') + '</div></header><div class="garland" aria-hidden="true"></div>';
  }
  GQ.miniHeader = miniHeader;

  screens.team = function () {
    var E = T.equipe;
    if (GQ.ui.value == null && GQ.state.team) GQ.ui.value = GQ.state.team;
    return {
      key: 'team',
      bare: true,
      elf: { say: 'equipe' },
      html:
        miniHeader() +
        '<main class="screen screen-plain">' +
        '<a class="back-link" href="#/">' + icon('retour') + 'Accueil</a>' +
        '<div class="plain-head">' + art.gift('plain-art') +
        '<h1 class="page-title" tabindex="-1">' + t(E.titre) + '</h1>' +
        '<p class="muted">' + t(E.aide) + '</p></div>' +
        textAnswer({ form: 'team', label: E.label, button: E.bouton, placeholder: E.placeholder }) +
        '</main>',
    };
  };

  screens.rules = function () {
    var PL = T.plateau;
    return {
      key: 'rules',
      bare: true,
      after: GQ.board.animate,
      html:
        miniHeader() +
        '<main class="screen screen-plain screen-board">' +
        '<h1 class="page-title rules-title" tabindex="-1">' + t(PL.titre) + '</h1>' +
        GQ.board.html() +
        '<ul class="key-rules">' + PL.regles.map(function (r, i) {
          return '<li class="b-pop" style="animation-delay:' + (2.4 + i * 0.15).toFixed(2) + 's">' + GQ.pixel.img(r.icone, 'key-ico') + '<span>' + t(r.texte) + '</span></li>';
        }).join('') + '</ul>' +
        '<button type="button" class="btn btn-ghost" data-action="show-rules">' + esc(PL.detail) + '</button>' +
        cta(btn(esc(T.regles.bouton) + icon('fleche'), 'accept-rules', '', 'btn-red btn-start')) +
        '</main>',
    };
  };

  /* ------------------------------------------------------------------ */
  /* Écrans communs aux quêtes                                           */
  /* ------------------------------------------------------------------ */

  function introScreen(n) {
    var qc = GQ.questCfg(n);
    return {
      key: 'q' + n + '-intro',
      html:
        questHead(n) +
        '<div class="intro-card">' + art.gift('intro-art') + '<p class="intro-text">' + t(qc.intro) + '</p></div>' +
        cta(btn(esc(qc.boutonIntro) + icon('fleche'), 'intro-next', ' data-n="' + n + '"')),
    };
  }

  function placeGuessScreen(n) {
    var id = GQ.placeIdForQuest(n);
    var p = GQ.place(id);
    var L = T.lieux;
    return {
      key: 'q' + n + '-place',
      html:
        questHead(n, L.surtitre) +
        '<h2 class="section-title">' + t(L.titre) + '</h2>' +
        '<p class="muted">' + t(L.consigne) + '</p>' +
        '<div class="clue-card"><p class="card-label">' + icon('loupe') + esc(L.surtitre) + '</p><p class="clue-text">' + t(p.indice) + '</p></div>' +
        GQ.jokerBlock('lieu-' + id, p.indiceJoker) +
        textAnswer({ form: 'place', label: L.label, button: L.bouton, expected: p.reponsesAcceptees, attrs: ' data-n="' + n + '"' }),
    };
  }

  function travelScreen(n) {
    var id = GQ.placeIdForQuest(n);
    var p = GQ.place(id);
    var L = T.lieux;
    var html =
      questHead(n) +
      '<section class="found-card">' + icon('pin', 'found-icon') +
      '<h2 class="found-title">' + t(L.trouveTitre) + '</h2>' +
      '<p class="found-place">' + t(L.trouveSousTitre, { lieu: p.nom }) + '</p>' +
      (p.texteValidation ? '<p>' + t(p.texteValidation) + '</p>' : '') +
      '</section>';
    if (P.lieux && P.lieux.scanObligatoire === false) {
      html += cta(btn(esc(L.boutonArrivee), 'arrive', ' data-place="' + esc(id) + '"'));
    } else {
      html +=
        '<div class="scan-card">' + icon('qr', 'scan-icon') + '<p>' + t(L.scanConsigne) + '</p></div>' +
        '<details class="manual-code"' + (GQ.ui.codeOpen ? ' open' : '') + '><summary>' + t(L.codeManuelTitre) + '</summary>' +
        textAnswer({ form: 'code', label: L.codeManuelLabel, button: L.codeManuelBouton, caps: true, expected: GQ.test.isActive() ? [p.codeQR] : null, attrs: ' data-place="' + esc(id) + '"' }) +
        '<p class="hint">' + t(L.conseilNavigateur) + '</p></details>' +
        (GQ.test.isActive() ? btn('Test : simuler le scan', 'test-scan', ' data-code="' + esc(p.codeQR) + '"', 'btn-test') : '');
    }
    return { key: 'q' + n + '-travel', elf: { say: 'lieu' }, html: html };
  }

  /* ------------------------------------------------------------------ */
  /* Quête 1 : le grand quiz                                             */
  /* ------------------------------------------------------------------ */

  /* Blocage du quiz : minuteur rétro à cristaux liquides. */
  function lockDevice(lock) {
    var X = QZ.textes;
    var total = GQ.state.quiz.lockTotal || lock;
    return (
      '<div class="timer-device" role="timer" aria-label="' + esc(X.bloqueCompteur) + '">' +
      '<div class="td-top"><span class="td-label">' + esc(X.bloqueTitre) + '</span>' + art.flake('td-flake') + '</div>' +
      '<div class="td-screen"><span class="td-small">' + esc(X.bloqueCompteur) + '</span>' +
      '<span class="td-digits" data-countdown>' + GQ.mmss(lock + 999) + '</span>' +
      '<span class="td-bar"><i data-ring style="width:' + ((100 * lock) / total).toFixed(1) + '%"></i></span></div>' +
      '</div>' +
      '<p class="lock-text">' + t(X.bloqueTexte) + '</p>'
    );
  }

  function startCountdown() {
    GQ.every(250, function () {
      var left = GQ.quizLockRemaining();
      if (!left) { GQ.render(); return; }
      var total = GQ.state.quiz.lockTotal || left;
      var el = document.querySelector('[data-countdown]');
      var bar = document.querySelector('[data-ring]');
      if (el) el.textContent = GQ.mmss(left + 999);
      if (bar) bar.style.width = ((100 * left) / total).toFixed(1) + '%';
    });
  }

  function quizThemes() {
    var X = QZ.textes;
    var q = GQ.state.quiz;
    var lock = GQ.quizLockRemaining();
    var maxFail = (P.quiz && P.quiz.tentativesAvantBlocage) || 2;
    var failed = GQ.failedThemeIds();
    var html = questHead(1) + '<h2 class="section-title">' + t(X.choixTitre) + '</h2>';
    if (lock) {
      html += lockDevice(lock);
    } else if (q.failedSinceLock > 0) {
      html += '<p class="attempts">' + icon('cadenas') + t(X.tentatives, { n: q.failedSinceLock, max: maxFail }) + '</p>';
    }
    html += '<p class="muted small">' + t(X.choixAide) + '</p><ul class="themes">';
    QZ.themes.forEach(function (th) {
      var available = GQ.themeAvailable(th.id);
      var disabled = lock || !available;
      html +=
        '<li><button type="button" class="theme-card' + (failed[th.id] ? ' is-failed' : '') + '" data-action="start-theme" data-id="' + esc(th.id) + '"' + (disabled ? ' disabled' : '') + '>' +
        '<span class="theme-icon">' + icon(th.icone || 'etoile') + '</span>' +
        '<span class="theme-body"><span class="theme-title">' + t(th.titre) + '</span>' +
        '<span class="theme-meta">' + th.questions.length + ' questions</span></span>' +
        (failed[th.id] ? '<span class="badge">' + esc(X.themeEchoue) + '</span>' : icon('fleche', 'theme-arrow')) +
        '</button></li>';
    });
    html += '</ul>';
    return {
      key: 'q1-themes' + (lock ? '-lock' : ''),
      elf: lock ? { say: 'blocage' } : null,
      html: html,
      after: lock ? startCountdown : null,
    };
  }

  function quizPlay() {
    var X = QZ.textes;
    var cur = GQ.state.quiz.current;
    var theme = GQ.theme(cur.themeId);
    var total = theme.questions.length;
    var q = theme.questions[cur.index];
    var last = cur.index === total - 1;
    var answered = cur.answers[cur.index] != null;
    var next = last
      ? btn(esc(X.validerTout), 'quiz-submit', answered ? '' : ' aria-disabled="true"', 'btn-red')
      : btn(esc(X.questionSuivante) + icon('fleche'), 'quiz-move', ' data-d="1"' + (answered ? '' : ' aria-disabled="true"'));
    return {
      key: 'q1-play-' + theme.id + '-' + cur.index,
      html:
        '<h1 class="sr-only" tabindex="-1">' + t(QZ.titre) + ' · ' + t(theme.titre) + '</h1>' +
        progress(cur.index, total, function (i) { return cur.answers[i] != null; }) +
        questionCard(q) +
        choices(q, { scope: 'quiz', selected: cur.answers[cur.index] }) +
        feedbackSlot() +
        cta(next + (cur.index > 0 ? btn(icon('retour') + esc(X.questionPrecedente), 'quiz-move', ' data-d="-1"', 'btn-ghost btn-inline') : '')) +
        '<button type="button" class="btn btn-ghost btn-abandon" data-action="abandon-theme">' + esc(X.changerTheme) + '</button>',
    };
  }

  function quizResult() {
    var X = QZ.textes;
    var r = GQ.state.quiz.lastResult || { score: 0, total: 8 };
    var dur = minutesLabel(GQ.state.quiz.lockTotal || GQ.lockDurationMs());
    var note = r.locked ? X.echecBlocage : GQ.quizNextFailLocks() ? X.echecAvertissement : '';
    return {
      key: 'q1-result',
      elf: { say: 'echec' },
      html: successBlock({
        art: '',
        score: r.score + '/' + r.total,
        scoreKind: 'red',
        script: '',
        title: r.total - r.score <= 2 ? X.echecTitre : X.echecTitreLoin,
        html: '<p class="sr-only">' + t(X.resultatScore, { score: r.score, total: r.total }) + '</p>' +
          '<p>' + t(X.echecTexte) + '</p>' + (note ? '<p class="notice notice-warn">' + icon('cadenas') + '<span>' + t(note.replace('{minutes}', dur)) + '</span></p>' : ''),
        cta: btn(esc(r.locked ? X.boutonMinuteur : X.boutonAutreTheme) + icon('fleche'), 'quiz-themes'),
      }),
    };
  }

  function quest1() {
    var ph = GQ.state.phase[1];
    var X = QZ.textes;
    if (ph === 'intro') return introScreen(1);
    if (ph === 'play' && GQ.state.quiz.current) return quizPlay();
    if (ph === 'result') return quizResult();
    if (ph === 'success') {
      var r = GQ.state.quiz.lastResult;
      return {
        key: 'q1-success',
        celebrate: true,
        elf: { say: 'reussite' },
        html: successBlock({
          score: r ? r.score + '/' + r.total : '8/8',
          title: X.reussiteTitre,
          html: '<p>' + t(X.reussiteTexte) + '</p>',
          cta: btn(esc(X.boutonIndice) + icon('fleche'), 'to-place', ' data-n="1"'),
        }),
      };
    }
    if (ph === 'location') return placeGuessScreen(1);
    if (ph === 'travel') return travelScreen(1);
    return quizThemes();
  }

  /* ------------------------------------------------------------------ */
  /* Quêtes 2 et 4 : énigmes                                             */
  /* ------------------------------------------------------------------ */

  function enigmaScreen(n) {
    var qc = GQ.questCfg(n);
    var expected = n === 2 ? qc.reponses : GQ.place(GQ.finalPlaceId()).reponsesAcceptees;
    return {
      key: 'q' + n + '-enigma',
      html:
        questHead(n) +
        '<div class="riddle-card"><p class="card-label">' + icon('etoile') + 'Énigme</p><p class="riddle">' + t(qc.enigme) + '</p></div>' +
        GQ.jokerBlock('q' + n, qc.indiceJoker) +
        textAnswer({ form: 'enigma', label: qc.label || T.general.votreReponse, button: T.general.validerReponse, expected: expected, attrs: ' data-n="' + n + '"' }),
    };
  }

  function quest2() {
    var ph = GQ.state.phase[2];
    var E = Q.enigme;
    if (ph === 'enigma') return enigmaScreen(2);
    if (ph === 'success') {
      return {
        key: 'q2-success',
        celebrate: true,
        elf: { say: 'reussite' },
        html: successBlock({ title: E.reussiteTitre, html: '<p>' + t(E.reussiteTexte) + '</p>', cta: btn(esc(E.boutonIndice) + icon('fleche'), 'to-place', ' data-n="2"') }),
      };
    }
    if (ph === 'location') return placeGuessScreen(2);
    if (ph === 'travel') return travelScreen(2);
    return introScreen(2);
  }

  /* ------------------------------------------------------------------ */
  /* Quête 3 : le défi Saint-Gobain (correction immédiate)               */
  /* ------------------------------------------------------------------ */

  function quest3() {
    var ph = GQ.state.phase[3];
    var D = Q.defi;
    var fb = GQ.ui.correct && GQ.ui.correct.scope === 'defi' ? GQ.ui.correct : null;
    if (fb || ph === 'play') {
      var d = GQ.state.defi;
      var index = fb ? fb.index : d.index;
      var q = D.questions[index];
      var html = '<h1 class="sr-only" tabindex="-1">' + t(D.titre) + '</h1>' +
        progress(index, D.questions.length, function (i) { return i < d.index; }) +
        questionCard(q) +
        choices(q, { scope: 'defi', selected: GQ.ui.sel, tried: fb ? [] : d.tried, reveal: !!fb });
      if (fb) {
        html +=
          '<div class="feedback-slot" aria-live="polite"><div class="feedback feedback-ok pop">' + icon('valide') + '<span><strong>' + t(T.general.bonneReponse) + '</strong>' +
          (q.explication ? '<br>' + t(q.explication) : '') + '</span></div></div>' +
          cta(btn(esc(fb.done ? T.general.terminer : T.general.questionSuivante) + icon('fleche'), 'next-question'));
      } else {
        html += feedbackSlot() + GQ.jokerBlock('q3-' + index, q.indiceJoker) +
          cta(btn(esc(T.general.validerReponse), 'validate-choice', GQ.ui.sel == null ? ' aria-disabled="true"' : ''));
      }
      return { key: 'q3-play-' + index + (fb ? '-ok' : ''), html: html };
    }
    if (ph === 'success') {
      return {
        key: 'q3-success',
        celebrate: true,
        elf: { say: 'reussite' },
        html: successBlock({ title: D.reussiteTitre, html: '<p>' + t(D.reussiteTexte) + '</p>', cta: btn(esc(D.boutonIndice) + icon('fleche'), 'to-place', ' data-n="3"') }),
      };
    }
    if (ph === 'location') return placeGuessScreen(3);
    if (ph === 'travel') return travelScreen(3);
    return introScreen(3);
  }

  /* ------------------------------------------------------------------ */
  /* Quête 4 : le dernier indice                                         */
  /* ------------------------------------------------------------------ */

  function quest4() {
    var ph = GQ.state.phase[4];
    var D = Q.dernierIndice;
    var p = GQ.place(GQ.finalPlaceId());
    if (ph === 'enigma') return enigmaScreen(4);
    if (ph === 'success') {
      return {
        key: 'q4-success',
        celebrate: 'big',
        html: successBlock({
          art: art.gift('success-gift'),
          title: D.reussiteTitre,
          html: '<p class="found-place">' + t(D.reussiteLieu, { lieu: p.nom }) + '</p>' +
            (p.texteValidation ? '<p>' + t(p.texteValidation) + '</p>' : '') +
            '<p class="notice">' + icon('pin') + '<span>' + t(D.consigneOrganisateurs) + '</span></p>',
          cta: btn(esc(D.bouton) + icon('fleche'), 'to-finale'),
        }),
      };
    }
    return introScreen(4);
  }

  /* ------------------------------------------------------------------ */
  /* Quête 5 : la hotte secrète                                          */
  /* ------------------------------------------------------------------ */

  function quest5() {
    var s = GQ.state;
    var H = Q.hotte;
    var F = T.fin;
    var p = GQ.place(GQ.finalPlaceId());
    if (s.finished) {
      var d = new Date(s.finished.at);
      var c = GQ.clock();
      return {
        key: 'q5-finished',
        celebrate: 'big',
        html: successBlock({
          art: '<div class="elf-scene"><span class="elf-say pixel-text">' + t(GQ.elf.line('fin')) + '</span>' + art.elf('elfWave', 'elf-big') + '</div>',
          script: '',
          title: F.termineeTitre,
          html: '<p>' + t(F.termineeTexte, { equipe: s.team }) + '</p>' +
            (c ? '<p class="final-time">' + t(T.chrono.tempsFinal, { temps: GQ.mmss(c.elapsed) }) + '</p>' : '') +
            '<p class="muted small">' + t(F.termineeLe, {
              date: d.toLocaleDateString('fr-FR'),
              heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            }) + '</p>',
        }),
      };
    }
    var code = P.finDePartie && P.finDePartie.codeOrganisateur;
    var html =
      questHead(5) +
      '<section class="finale">' +
      '<div class="elf-scene"><span class="elf-say pixel-text">' + t(GQ.elf.line('finale')) + '</span>' + art.elf('elfGift', 'elf-big') + '</div>' +
      '<p class="pixel-text finale-script">' + t(H.script) + '</p>' +
      '<p class="finale-text">' + t(H.texte) + '</p>' +
      '<p class="found-place">' + t(H.rappelLieu, { lieu: p.nom }) + '</p></section>';
    if (code) {
      html +=
        '<details class="manual-code organizer"' + (GQ.ui.codeOpen ? ' open' : '') + '><summary>' + icon('cadenas') + t(F.organisateurTitre) + '</summary>' +
        '<p class="hint">' + t(F.organisateurAide) + '</p>' +
        textAnswer({ form: 'organizer', label: F.organisateurLabel, button: F.organisateurBouton, caps: true, expected: GQ.test.isActive() ? [code] : null }) +
        '</details>';
    }
    if (GQ.test.isActive() && P.finDePartie && P.finDePartie.qrFinalActif) {
      html += btn('Test : simuler le scan final', 'test-scan', ' data-code="' + esc(p.codeQR) + '"', 'btn-test');
    }
    return { key: 'q5-final', celebrate: 'big', html: html };
  }

  /* ------------------------------------------------------------------ */
  /* Écran de scan d'un QR code (#/scan/CODE)                            */
  /* ------------------------------------------------------------------ */

  screens.scan = function (code) {
    var S = T.scan;
    if (!GQ.ui.scan) GQ.ui.scan = GQ.arriveByCode(code);
    var r = GQ.ui.scan;
    var s = GQ.state;
    var p = r.placeId ? GQ.place(r.placeId) : null;
    var back = btn(esc(S.boutonRetour), 'resume');
    var title, body, action, ok = false;

    // Un second affichage du même scan reste un succès tant que la quête n'a pas commencé.
    if (r.status === 'deja' && s.quest === r.next && s.phase[r.next] === 'intro') r = Object.assign({}, r, { status: 'ok' });

    switch (r.status) {
      case 'ok':
        ok = true;
        title = S.okTitre;
        body = '<p>' + t(S.okTexte, { lieu: p.nom, n: r.next }) + '</p>';
        action = btn(esc(S.boutonSuite.replace('{n}', r.next)) + icon('fleche'), 'resume');
        break;
      case 'fin':
      case 'deja-fini':
        GQ.redirect('quete/5');
        return { key: 'redirect', html: '' };
      case 'fin-desactivee':
        title = T.fin.organisateurTitre;
        body = '<p>' + t(S.finDesactiveeTexte) + '</p>';
        action = back;
        break;
      case 'deja':
        title = S.dejaTitre;
        body = '<p>' + t(S.dejaTexte) + '</p>';
        action = back;
        break;
      case 'trop-tot':
        title = S.tropTotTitre;
        body = '<p>' + t(S.tropTotTexte) + '</p>';
        action = back;
        break;
      case 'pas-de-partie':
        title = S.pasDePartieTitre;
        body = '<p>' + t(S.pasDePartieTexte) + '</p>';
        action = btn(esc(S.boutonAccueil), 'go-home', '', 'btn-red');
        break;
      default:
        title = S.inconnuTitre;
        body = '<p>' + t(S.inconnuTexte) + '</p>';
        action = s.team ? back : btn(esc(S.boutonAccueil), 'go-home', '', 'btn-red');
    }
    var inGame = s.team && s.rulesOk;
    var block = successBlock({
      art: ok ? null : '<div class="scan-art">' + icon(r.status === 'trop-tot' ? 'cadenas' : 'qr') + '</div>',
      script: ok ? T.general.bravo : ' ',
      title: title,
      html: body,
      cta: action,
    });
    return {
      key: 'scan-' + code + '-' + r.status,
      bare: !inGame,
      celebrate: ok,
      html: inGame ? block : miniHeader() + '<main class="screen screen-plain">' + block + '</main>',
    };
  };

  /* ------------------------------------------------------------------ */
  /* Routage des quêtes                                                  */
  /* ------------------------------------------------------------------ */

  screens.quest = function (n) {
    var s = GQ.state;
    if (!(n >= 1 && n <= GQ.QUEST_COUNT)) n = s.quest;
    if (n !== s.quest) {
      GQ.toast(n > s.quest ? T.general.queteVerrouillee : T.general.queteTerminee, 'info');
      GQ.redirect('quete/' + s.quest);
      return { key: 'redirect', html: '' };
    }
    return [null, quest1, quest2, quest3, quest4, quest5][n]();
  };

  /* ------------------------------------------------------------------ */
  /* Actions (boutons)                                                   */
  /* ------------------------------------------------------------------ */

  function goQuest() { GQ.go('quete/' + GQ.state.quest); }

  actions.start = function () { GQ.go('equipe'); };
  actions['go-home'] = function () { GQ.go(''); };
  actions.resume = function () {
    var s = GQ.state;
    if (!s.team) return GQ.go('equipe');
    if (!s.rulesOk) return GQ.go('regles');
    goQuest();
  };

  actions['show-rules'] = function () {
    GQ.modal({ title: T.regles.titre, html: GQ.rulesHtml(), cancel: T.regles.boutonFermer });
  };

  actions['accept-rules'] = function () {
    GQ.acceptRules();
    goQuest();
  };

  actions['intro-next'] = function (el) {
    var n = Number(el.dataset.n);
    var next = { 1: 'themes', 2: 'enigma', 3: 'play', 4: 'enigma' }[n];
    if (n !== GQ.state.quest || GQ.state.phase[n] !== 'intro') return GQ.render();
    GQ.setPhase(n, next);
    GQ.uiReset();
    GQ.render();
  };

  actions['to-place'] = function (el) {
    var n = Number(el.dataset.n);
    if (n !== GQ.state.quest || GQ.state.phase[n] !== 'success') return GQ.render();
    GQ.setPhase(n, 'location');
    GQ.uiReset();
    GQ.render();
  };

  actions['to-finale'] = function () {
    GQ.goToFinale();
    GQ.uiReset();
    GQ.go('quete/5');
  };

  actions['start-theme'] = function (el) {
    if (!GQ.quizStart(el.dataset.id)) {
      GQ.toast(GQ.quizLockRemaining() ? QZ.textes.bloqueTitre : T.general.queteVerrouillee, 'error');
    }
    GQ.uiReset();
    GQ.render();
  };

  actions['quiz-themes'] = function () {
    if (GQ.state.quest === 1 && GQ.state.phase[1] === 'result') GQ.setPhase(1, 'themes');
    GQ.uiReset();
    GQ.render();
  };

  actions['abandon-theme'] = function () {
    var X = QZ.textes;
    var locks = GQ.quizNextFailLocks();
    GQ.modal({
      title: X.abandonTitre,
      text: locks ? X.abandonTexteBlocage.replace('{minutes}', minutesLabel(GQ.lockDurationMs())) : X.abandonTexte,
      confirm: X.abandonConfirmer,
      cancel: X.abandonAnnuler,
      icon: 'cadenas',
    }).then(function (ok) {
      if (!ok) return;
      GQ.quizAbandon();
      GQ.uiReset();
      GQ.render();
    });
  };

  /* Sélection d'une proposition : mise à jour directe, sans réaffichage. */
  actions.select = function (el) {
    var i = Number(el.dataset.i);
    if (el.dataset.scope === 'quiz') {
      if (!GQ.quizSelect(i)) return GQ.render();
    } else {
      GQ.ui.sel = i;
    }
    GQ.ui.msg = null;
    document.querySelectorAll('.choice').forEach(function (b) {
      var on = Number(b.dataset.i) === i;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    document.querySelectorAll('.sticky-cta [aria-disabled]').forEach(function (b) { b.removeAttribute('aria-disabled'); });
    var slot = document.querySelector('.feedback-slot');
    if (slot) slot.innerHTML = '';
  };

  actions['quiz-move'] = function (el) {
    var d = Number(el.dataset.d);
    if (!GQ.quizMove(d)) {
      if (d > 0) GQ.ui.msg = { kind: 'error', text: T.general.choixVide, shake: true };
      return GQ.render();
    }
    GQ.uiReset();
    GQ.render();
  };

  actions['quiz-submit'] = function () {
    var X = QZ.textes;
    if (!GQ.quizAllAnswered()) {
      GQ.ui.msg = { kind: 'error', text: T.general.choixVide, shake: true };
      return GQ.render();
    }
    GQ.modal({ title: X.confirmTitre, text: X.confirmTexte, confirm: X.confirmOui, cancel: X.confirmNon, icon: 'valide' }).then(function (ok) {
      if (!ok) return;
      GQ.quizSubmit();
      GQ.uiReset();
      GQ.render();
    });
  };

  /* Quête 3 : correction immédiate de la question. */
  actions['validate-choice'] = function () {
    var sel = GQ.ui.sel;
    if (sel == null) {
      GQ.ui.msg = { kind: 'error', text: T.general.choixVide, shake: true };
      return GQ.render();
    }
    var index = GQ.state.defi.index;
    var question = Q.defi.questions[index];
    var res = GQ.defiAnswer(sel);
    if (!res) return GQ.render();
    if (res.correct) {
      GQ.uiReset();
      if (!(res.done && !question.explication)) GQ.ui.correct = { scope: 'defi', index: index, done: res.done };
      return GQ.render();
    }
    GQ.ui.sel = null;
    GQ.ui.msg = { kind: 'error', text: T.general.mauvaiseReponse, shake: true };
    GQ.render();
  };

  actions['next-question'] = function () {
    GQ.uiReset();
    GQ.render();
  };

  actions.joker = function (el) {
    var key = el.dataset.key;
    if (GQ.state.joker.used) {
      GQ.toast(T.joker.dejaUtilise, 'error');
      return GQ.render();
    }
    GQ.modal({
      title: T.joker.confirmationTitre,
      text: T.joker.confirmationTexte,
      confirm: T.joker.confirmer,
      cancel: T.joker.annuler,
      icon: 'etoile',
    }).then(function (ok) {
      if (!ok) {
        GQ.toast(T.joker.conserve, 'info');
        return;
      }
      if (!GQ.useJoker(key)) GQ.toast(T.joker.dejaUtilise, 'error');
      GQ.render();
      var hint = document.querySelector('.joker-hint');
      if (hint) hint.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  actions.arrive = function (el) {
    GQ.uiReset();
    GQ.ui.scan = GQ.arriveAt(el.dataset.place);
    var code = GQ.place(el.dataset.place).codeQR;
    GQ.go('scan/' + encodeURIComponent(code), true);
  };

  /* ------------------------------------------------------------------ */
  /* Formulaires                                                         */
  /* ------------------------------------------------------------------ */

  function formError(value, text, extra) {
    GQ.ui.value = value;
    GQ.ui.msg = { kind: 'error', text: text, shake: true };
    Object.assign(GQ.ui, extra || {});
    GQ.render();
    var input = document.querySelector('.answer-form .field');
    if (input) input.select();
  }

  forms.team = function (form, value) {
    if (!value.trim()) return formError(value, T.equipe.erreurVide);
    GQ.setTeam(value);
    GQ.go(GQ.state.rulesOk ? 'quete/' + GQ.state.quest : 'regles');
  };

  forms.enigma = function (form, value) {
    var n = Number(form.dataset.n);
    if (!value.trim()) return formError(value, T.general.reponseVide);
    if (n !== GQ.state.quest || GQ.state.phase[n] !== 'enigma') return GQ.render();
    if (!GQ.enigmaAnswer(n, value)) return formError(value, T.general.mauvaiseReponse);
    GQ.uiReset();
    GQ.render();
  };

  forms.place = function (form, value) {
    var n = Number(form.dataset.n);
    if (!value.trim()) return formError(value, T.general.reponseVide);
    if (n !== GQ.state.quest || GQ.state.phase[n] !== 'location') return GQ.render();
    if (!GQ.placeGuess(n, value)) return formError(value, T.lieux.incorrect);
    GQ.uiReset();
    GQ.render();
  };

  forms.code = function (form, value) {
    if (!value.trim()) return formError(value, T.general.reponseVide, { codeOpen: true });
    if (GQ.placeIdForCode(value) !== form.dataset.place) return formError(value, T.lieux.codeIncorrect, { codeOpen: true });
    GQ.uiReset();
    GQ.go('scan/' + encodeURIComponent(value.trim().toUpperCase()));
  };

  forms.organizer = function (form, value) {
    if (!GQ.checkOrganizerCode(value)) return formError(value, T.fin.organisateurErreur, { codeOpen: true });
    GQ.finish('code');
    GQ.uiReset();
    GQ.render();
  };
})();
