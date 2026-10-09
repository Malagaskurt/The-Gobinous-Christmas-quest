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

  var minutesLabel = GQ.durationLabel;

  function cta(inner) { return '<div class="sticky-cta">' + inner + '</div>'; }

  /* ------------------------------------------------------------------ */
  /* Composants                                                          */
  /* ------------------------------------------------------------------ */

  /* Titre brodé (image tricotée) + texte réel pour l'accessibilité. */
  function knitTitle(text, opts) {
    opts = opts || {};
    return '<h1 class="k-title ' + (opts.cls || '') + '" tabindex="-1"><span class="sr-only">' + t(text) + '</span>' +
      GQ.knit.title(plain(text), { alt: '', color: opts.color, max: opts.max || 10, outline: true, cls: 'k-title-img' }) + '</h1>';
  }
  GQ.knitTitle = knitTitle;

  function questHead(n, sub) {
    return (
      '<div class="quest-head">' +
      GQ.knit.icon(GQ.questIcon(n), 'quest-ico') +
      '<p class="kicker">' + t(T.general.queteNumero, { n: n }) + ' / ' + GQ.QUEST_COUNT + (sub ? ' · ' + t(sub) : '') + '</p>' +
      knitTitle(GQ.questCfg(n).titre) +
      '</div>'
    );
  }

  /* Carte écrue à double filet (« cadre »). */
  function frame(inner, cls) {
    return '<div class="frame ' + (cls || '') + '"><div class="frame-in">' + inner + '</div></div>';
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

  /* Bloc de réussite : pictogramme tricoté, mot brodé, titre, texte. */
  function successBlock(o) {
    var script = o.script == null ? T.general.bravo : o.script;
    return (
      '<section class="success">' +
      (o.art === '' ? '' : '<div class="success-art">' + (o.art || GQ.knit.icon('star', 'success-ico')) + '</div>') +
      (o.score ? '<p class="score"><span class="sr-only">' + esc(o.score) + '</span>' + GQ.knit.text(o.score, { alt: '', color: o.scoreKind === 'red' ? '#E4323A' : '#00ADE1', outline: true, cls: 'score-img' }) + '</p>' : '') +
      (String(script).trim() ? '<p class="success-script">' + GQ.knit.title(plain(script).replace(/\s*!$/, '!'), { alt: plain(script), color: '#E4323A', outline: true, cls: 'script-img' }) + '</p>' : '') +
      '<h2 class="success-title" tabindex="-1">' + t(o.title) + '</h2>' +
      (o.html ? frame(o.html, 'frame-center') : '') + '</section>' +
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
    return {
      key: 'home',
      bare: true,
      html:
        '<main class="screen-home">' +
        '<div class="garland" aria-hidden="true"></div>' +
        '<div class="home-logo" data-action="logo-tap">' + GQ.logo('clair') + '</div>' +
        '<div class="home-hero">' +
        opt(A.surtitre, '<p class="kicker">' + t(A.surtitre) + '</p>') +
        '<h1 class="home-title" tabindex="-1"><span class="sr-only">' + t(A.titre) + ' ' + t(A.titreSuite) + '</span>' +
        GQ.knit.text(plain(A.titre).toUpperCase(), { alt: '', color: '#E4323A', outline: true, cls: 'home-knit-title' }) +
        '<span class="home-sub" aria-hidden="true">' + t(A.titreSuite) + '</span></h1>' +
        opt(A.sousTitre, '<p class="home-subtitle">' + t(A.sousTitre) + '</p>') +
        GQ.knit.scene('home-scene') +
        opt(A.accroche, '<p class="home-lead">' + t(A.accroche) + '</p>') +
        '</div>' +
        '<div class="home-cta">' + action + '</div>' +
        '</main>',
    };
  };

  /* Bandeau des écrans d'entrée : même univers que les écrans de jeu. */
  function miniHeader() {
    return '<div class="garland" aria-hidden="true"></div>';
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
        '<div class="center-head">' + GQ.knit.icon('gift', 'head-ico') + knitTitle(E.titreCourt || E.titre) + '</div>' +
        frame('<p class="frame-lead">' + t(E.titre) + '</p><p class="muted small">' + t(E.aide) + '</p>' +
          textAnswer({ form: 'team', label: E.label, button: E.bouton, placeholder: E.placeholder, btnCls: 'btn-red' })) +
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
        '<div class="center-head">' + knitTitle(PL.titre, { max: 8 }) + '</div>' +
        GQ.board.html() +
        frame('<ul class="legend">' + PL.regles.map(function (r) {
          return '<li>' + GQ.knit.icon(r.icone, 'legend-ico') + '<span>' + t(r.texte, GQ.ruleVars()) + '</span></li>';
        }).join('') + '</ul>', 'frame-legend') +
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
        frame('<p class="intro-text">' + t(qc.intro) + '</p>') +
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
        frame('<p class="card-label">' + icon('loupe') + esc(L.surtitre) + '</p><p class="clue-text">' + t(p.indice) + '</p>') +
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
      frame(GQ.knit.icon('pin', 'found-ico') +
      '<h2 class="found-title">' + t(L.trouveTitre) + '</h2>' +
      '<p class="found-place">' + t(L.trouveSousTitre, { lieu: p.nom }) + '</p>' +
      (p.texteValidation ? '<p>' + t(p.texteValidation) + '</p>' : ''), 'frame-center');
    if (P.lieux && P.lieux.scanObligatoire === false) {
      html += cta(btn(esc(L.boutonArrivee), 'arrive', ' data-place="' + esc(id) + '"'));
    } else {
      html +=
        '<div class="scan-card">' + GQ.knit.icon('qr', 'scan-ico') + '<p>' + t(L.scanConsigne) + '</p></div>' +
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

  /* Blocage (quiz gelé ou gel après une erreur) : compte à rebours géant
   * en chiffres tricotés. o = { titre, texte, compteur } */
  function lockDevice(lock, o) {
    return (
      '<div class="lock" role="timer" aria-label="' + esc(o.compteur) + '">' +
      GQ.knit.icon('flake', 'lock-ico') +
      '<p class="kicker">' + esc(o.titre) + '</p>' +
      '<div class="lock-digits" data-countdown>' + lockDigits(GQ.mmss(lock + 999), o.compteur) + '</div>' +
      '<p class="lock-text">' + t(o.texte) + '</p>' +
      '</div>'
    );
  }

  function lockDigits(label, compteur) {
    return '<span class="sr-only">' + esc(compteur) + ' ' + label + '</span>' +
      GQ.knit.text(label, { alt: '', color: '#E4323A', outline: true, cls: 'lock-img' });
  }

  function startCountdown(left, compteur) {
    var last = '';
    GQ.every(250, function () {
      var ms = left();
      if (!ms) { GQ.uiReset(); GQ.render(); return; }
      var label = GQ.mmss(ms + 999);
      var el = document.querySelector('[data-countdown]');
      if (el && label !== last) {
        last = label;
        el.innerHTML = lockDigits(label, compteur);
      }
    });
  }

  function quizLockTexts() {
    var X = QZ.textes;
    return { titre: X.bloqueTitre, texte: X.bloqueTexte, compteur: X.bloqueCompteur };
  }

  /* Gel après une mauvaise réponse (quêtes 2 à 4). */
  function freezeTexts() {
    var G = T.general;
    return { titre: G.gelTitre, texte: G.gelTexte, compteur: G.gelCompteur };
  }
  function freezeAfter() { startCountdown(GQ.freezeRemaining, T.general.gelCompteur); }

  function quizThemes() {
    var X = QZ.textes;
    var q = GQ.state.quiz;
    var lock = GQ.quizLockRemaining();
    var maxFail = (P.quiz && P.quiz.tentativesAvantBlocage) || 2;
    var failed = GQ.failedThemeIds();
    var html = questHead(1) + '<h2 class="section-title">' + t(X.choixTitre) + '</h2>';
    if (lock) {
      html += lockDevice(lock, quizLockTexts());
    } else if (q.failedSinceLock > 0) {
      html += '<p class="attempts">' + icon('cadenas') + t(X.tentatives, { n: q.failedSinceLock, max: maxFail }) + '</p>';
    }
    html += (lock ? '' : '<p class="muted small center">' + t(X.choixAide) + '</p>') + '<ul class="themes">';
    QZ.themes.forEach(function (th) {
      var available = GQ.themeAvailable(th.id);
      var disabled = lock || !available;
      html +=
        '<li><button type="button" class="theme-card' + (failed[th.id] ? ' is-failed' : '') + '" data-action="start-theme" data-id="' + esc(th.id) + '"' + (disabled ? ' disabled' : '') + '>' +
        '<span class="theme-icon">' + GQ.knit.icon({ miroir: 'star', tour: 'tower', materiaux: 'dice', flocon: 'flake', etoile: 'star', cadeau: 'gift' }[th.icone] || 'star', 'theme-knit') + '</span>' +
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
      after: lock ? function () { startCountdown(GQ.quizLockRemaining, QZ.textes.bloqueCompteur); } : null,
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
    GQ.quizCheckPass();
    var ph = GQ.state.phase[1];
    var X = QZ.textes;
    if (ph === 'intro') return introScreen(1);
    if (ph === 'play' && GQ.state.quiz.current) return quizPlay();
    if (ph === 'result') return quizResult();
    if (ph === 'success') {
      var r = GQ.state.quiz.lastResult;
      var forced = !!(r && r.forced);
      return {
        key: 'q1-success',
        celebrate: true,
        elf: { say: 'reussite' },
        html: successBlock({
          art: forced ? GQ.knit.icon('flake', 'success-ico') : undefined,
          score: forced ? '' : r ? r.score + '/' + r.total : '8/8',
          title: forced ? X.reussiteApresGelTitre : X.reussiteTitre,
          html: '<p>' + t(forced ? X.reussiteApresGelTexte : X.reussiteTexte) + '</p>',
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
    var gel = GQ.freezeRemaining();
    return {
      key: 'q' + n + '-enigma' + (gel ? '-gel' : ''),
      elf: gel ? { say: 'blocage' } : null,
      after: gel ? freezeAfter : null,
      html:
        questHead(n) +
        (gel ? lockDevice(gel, freezeTexts()) : '') +
        frame('<p class="card-label">' + icon('etoile') + 'Énigme</p><p class="riddle">' + t(qc.enigme) + '</p>') +
        (gel
          ? ''
          : GQ.jokerBlock('q' + n, qc.indiceJoker) + textAnswer({ form: 'enigma', label: qc.label || T.general.votreReponse, button: T.general.validerReponse, expected: expected, attrs: ' data-n="' + n + '"' })),
    };
  }

  function forced(n) { return !!(GQ.state.forced && GQ.state.forced[n]); }

  function quest2() {
    GQ.penaltyCheckPass();
    var ph = GQ.state.phase[2];
    var E = Q.enigme;
    if (ph === 'enigma') return enigmaScreen(2);
    if (ph === 'success') {
      var f = forced(2);
      return {
        key: 'q2-success',
        celebrate: true,
        elf: { say: 'reussite' },
        html: successBlock({
          art: f ? GQ.knit.icon('flake', 'success-ico') : undefined,
          title: f ? E.reussiteApresGelTitre : E.reussiteTitre,
          html: '<p>' + t(f ? E.reussiteApresGelTexte : E.reussiteTexte) + '</p>',
          cta: btn(esc(E.boutonIndice) + icon('fleche'), 'to-place', ' data-n="2"'),
        }),
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
    var passed = GQ.penaltyCheckPass();
    if (passed && passed.indexOf('q3-') === 0) {
      // Question gelée puis validée d'office : on montre la bonne réponse.
      GQ.uiReset();
      GQ.ui.correct = { scope: 'defi', index: Number(passed.slice(3)), done: GQ.state.phase[3] === 'success', forced: true };
    }
    var ph = GQ.state.phase[3];
    var D = Q.defi;
    var fb = GQ.ui.correct && GQ.ui.correct.scope === 'defi' ? GQ.ui.correct : null;
    if (fb || ph === 'play') {
      var d = GQ.state.defi;
      var index = fb ? fb.index : d.index;
      var q = D.questions[index];
      var gel = fb ? 0 : GQ.freezeRemaining();
      var html = '<h1 class="sr-only" tabindex="-1">' + t(D.titre) + '</h1>' +
        progress(index, D.questions.length, function (i) { return i < d.index; });
      if (gel) {
        return {
          key: 'q3-play-' + index + '-gel',
          elf: { say: 'blocage' },
          after: freezeAfter,
          html: html + lockDevice(gel, freezeTexts()) + questionCard(q),
        };
      }
      html += questionCard(q) + choices(q, { scope: 'defi', selected: GQ.ui.sel, tried: fb ? [] : d.tried, reveal: !!fb });
      if (fb) {
        html +=
          '<div class="feedback-slot" aria-live="polite"><div class="feedback feedback-ok pop">' + icon('valide') + '<span><strong>' + t(fb.forced ? T.general.gelLeveReponse : T.general.bonneReponse) + '</strong>' +
          (q.explication ? '<br>' + t(q.explication) : '') + '</span></div></div>' +
          cta(btn(esc(fb.done ? T.general.terminer : T.general.questionSuivante) + icon('fleche'), 'next-question'));
      } else {
        html += feedbackSlot() + GQ.jokerBlock('q3-' + index, q.indiceJoker) +
          cta(btn(esc(T.general.validerReponse), 'validate-choice', GQ.ui.sel == null ? ' aria-disabled="true"' : ''));
      }
      return { key: 'q3-play-' + index + (fb ? '-ok' : ''), elf: fb && fb.forced ? { say: 'reussite' } : null, html: html };
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
    GQ.penaltyCheckPass();
    var ph = GQ.state.phase[4];
    var D = Q.dernierIndice;
    var p = GQ.place(GQ.finalPlaceId());
    if (ph === 'enigma') return enigmaScreen(4);
    if (ph === 'success') {
      return {
        key: 'q4-success',
        celebrate: 'big',
        html: successBlock({
          art: GQ.knit.icon('gift', 'success-ico'),
          title: forced(4) ? D.reussiteApresGelTitre : D.reussiteTitre,
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
          art: '<div class="elf-scene"><span class="elf-say">' + t(GQ.elf.line('fin')) + '</span>' + art.elf('elfWave', 'elf-big') + '</div>',
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
      '<div class="elf-scene"><span class="elf-say">' + t(GQ.elf.line('finale')) + '</span>' + art.elf('elfGift', 'elf-big') + '</div>' +
      '<p class="finale-script">' + GQ.knit.title(plain(H.script), { alt: plain(H.script), color: '#E4323A', outline: true, cls: 'script-img' }) + '</p>' +
      frame('<p class="finale-text">' + t(H.texte) + '</p><p class="found-place">' + t(H.rappelLieu, { lieu: p.nom }) + '</p>', 'frame-center') + '</section>';
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
      art: ok ? GQ.knit.icon('pin', 'success-ico') : GQ.knit.icon(r.status === 'trop-tot' ? 'lock' : 'qr', 'success-ico'),
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

  /* Accès organisateur caché : 5 appuis rapides sur le logo de l'accueil
   * (utile quand la barre d'adresse n'est pas accessible). Ouvre le mode
   * test s'il est activé, sinon le suivi des équipes. Un code est toujours
   * demandé. */
  var logoTaps = [];
  actions['logo-tap'] = function () {
    var testOn = P.modeTest && P.modeTest.actif;
    var suiviOn = !(P.suivi && P.suivi.actif === false);
    if (!testOn && !suiviOn) return;
    var now = Date.now();
    logoTaps = logoTaps.filter(function (t0) { return now - t0 < 2500; });
    logoTaps.push(now);
    if (logoTaps.length >= 5) {
      logoTaps = [];
      GQ.go(testOn ? 'organisateur' : 'suivi');
    }
  };
  actions['go-home'] = function () { GQ.go(''); };
  actions.resume = function () {
    var s = GQ.state;
    if (!s.team) return GQ.go('equipe');
    if (!s.rulesOk) return GQ.go('regles');
    goQuest();
  };

  actions['show-rules'] = function () {
    GQ.modal({ sheet: true, title: T.regles.titre, html: GQ.rulesHtml(), cancel: T.regles.boutonFermer });
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
    if (!res) { GQ.uiReset(); return GQ.render(); }
    if (res.correct) {
      GQ.uiReset();
      if (!(res.done && !question.explication)) GQ.ui.correct = { scope: 'defi', index: index, done: res.done };
      return GQ.render();
    }
    if (res.frozen) { GQ.uiReset(); return GQ.render(); }
    GQ.ui.sel = null;
    GQ.ui.msg = { kind: 'error', text: wrongText(res.left), shake: true };
    GQ.render();
  };

  /* Message d'erreur : prévient quand il ne reste qu'un essai avant le gel. */
  function wrongText(left) {
    return left === 1 ? T.general.mauvaiseReponseDernierEssai.replace('{duree}', GQ.ruleVars().duree) : T.general.mauvaiseReponse;
  }

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
    if (n !== GQ.state.quest || GQ.state.phase[n] !== 'enigma' || GQ.freezeRemaining()) return GQ.render();
    var res = GQ.enigmaAnswer(n, value);
    if (!res.ok) {
      if (res.frozen) { GQ.uiReset(); return GQ.render(); }
      return formError(value, wrongText(res.left));
    }
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
