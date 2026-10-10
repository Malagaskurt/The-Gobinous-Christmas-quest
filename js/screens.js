/* Écrans du parcours participant : composants communs, accueil, équipe,
 * règles, saisie du mot secret des étages et quête 1 (le grand quiz).
 * Les quêtes 2 à 5 sont dans js/q2-message.js … js/q5-traque.js. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var CFG = GQ.cfg;
  var T = CFG.textes;
  var QZ = CFG.quiz;
  var P = CFG.parametres;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;

  var screens = (GQ.screens = {});
  var actions = (GQ.actions = GQ.actions || {});
  var forms = (GQ.forms = GQ.forms || {});
  GQ.questScreens = GQ.questScreens || {};

  /* État d'affichage temporaire (sélection, message, saisie en cours).
   * Il n'est pas sauvegardé et est vidé à chaque changement d'écran. */
  GQ.ui = {};
  GQ.uiReset = function () { GQ.ui = {}; };

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

  function questHead(n, sub, title) {
    return (
      '<div class="quest-head">' +
      GQ.knit.icon(GQ.questIcon(n), 'quest-ico') +
      '<p class="kicker">' + t(T.general.queteNumero, { n: n }) + ' / ' + GQ.QUEST_COUNT + (sub ? ' · ' + t(sub) : '') + '</p>' +
      knitTitle(title || GQ.questCfg(n).titre) +
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
   * déjà écartées ; reveal : bonne réponse à révéler. */
  function choices(q, o) {
    var correct = GQ.letterIndex(q.reponse);
    var showTest = GQ.test.isActive() && GQ.test.opt('showAnswers');
    return '<ul class="choices" role="radiogroup" aria-labelledby="qtext">' + q.choix.map(function (c, i) {
      var label = typeof c === 'string' ? c : c.label;
      var tried = (o.tried || []).indexOf(i) !== -1;
      var sel = !o.reveal && o.selected === i;
      var ok = o.reveal && i === correct;
      var cls = (tried ? ' is-wrong' : '') + (sel ? ' is-selected' : '') + (ok ? ' is-correct' : '') + (o.reveal && !ok ? ' is-dim' : '');
      return (
        '<li><button type="button" role="radio" aria-checked="' + sel + '" class="choice' + cls + '" data-action="' + (o.action || 'select') + '" data-scope="' + o.scope + '" data-i="' + i + '"' + (tried || o.reveal ? ' disabled' : '') + '>' +
        '<span class="choice-letter">' + GQ.letter(i) + '</span>' +
        '<span class="choice-text">' + t(label) + '</span>' +
        (tried ? icon('croix', 'choice-icon') : '') + (ok ? icon('valide', 'choice-icon') : '') +
        (showTest && !o.reveal && i === correct ? '<span class="test-badge">bonne réponse</span>' : '') +
        '</button></li>'
      );
    }).join('') + '</ul>';
  }

  function questionCard(q) {
    return '<div class="question-card"><h2 class="question" id="qtext">' + t(q.question) + '</h2>' + testVerify(q.aVerifier) + '</div>';
  }

  /* Champ de réponse libre. */
  function textAnswer(o) {
    return (
      '<form class="answer-form" data-form="' + o.form + '"' + (o.attrs || '') + ' novalidate autocomplete="off">' +
      '<label class="field-label" for="answer-' + o.form + '">' + t(o.label) + '</label>' +
      '<input class="field' + (o.fieldCls ? ' ' + o.fieldCls : '') + '" id="answer-' + o.form + '" name="answer" type="text"' +
      ' inputmode="' + (o.numeric ? 'numeric' : 'text') + '" maxlength="' + (o.max || 80) + '" autocomplete="off" autocapitalize="' + (o.caps ? 'characters' : 'off') +
      '" autocorrect="off" spellcheck="false" enterkeyhint="done" value="' + esc(GQ.ui.value || '') + '"' + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + '>' +
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
      (o.after || '') +
      (o.cta ? cta(o.cta) : '')
    );
  }

  /* Texte « machine à écrire » : il s'écrit une seule fois par écran
   * (clé), puis s'affiche directement. Un appui le termine. */
  var typed = {};
  function typewriter(key, html, cls) {
    var done = typed[key];
    return '<p class="typewriter ' + (cls || '') + (done ? '' : ' is-typing') + '" data-type="' + esc(key) + '">' + html + '</p>';
  }

  function runTypewriters() {
    var reduce = navigator.webdriver || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    document.querySelectorAll('.typewriter.is-typing').forEach(function (el) {
      var key = el.getAttribute('data-type');
      var nodes = [];
      (function walk(n) {
        for (var c = n.firstChild; c; c = c.nextSibling) {
          if (c.nodeType === 3) nodes.push({ node: c, text: c.nodeValue });
          else walk(c);
        }
      })(el);
      function finish() {
        nodes.forEach(function (n) { n.node.nodeValue = n.text; });
        el.classList.remove('is-typing');
        typed[key] = true;
      }
      if (reduce) return finish();
      nodes.forEach(function (n) { n.node.nodeValue = ''; });
      var i = 0;
      var j = 0;
      el.classList.add('is-run');
      el.addEventListener('click', function () { i = nodes.length; finish(); }, { once: true });
      GQ.every(28, function () {
        if (i >= nodes.length) { if (el.classList.contains('is-typing')) finish(); return; }
        var n = nodes[i];
        j += 1;
        n.node.nodeValue = n.text.slice(0, j);
        if (j >= n.text.length) { i += 1; j = 0; }
      });
    });
  }

  /* Gel : compte à rebours géant en chiffres tricotés. */
  function lockDevice(ms, o) {
    return (
      '<div class="lock" role="timer" aria-label="' + esc(o.compteur) + '">' +
      GQ.knit.icon('flake', 'lock-ico') +
      '<p class="kicker">' + esc(o.titre) + '</p>' +
      '<div class="lock-digits" data-countdown>' + lockDigits(GQ.mmss(ms + 999), o.compteur) + '</div>' +
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

  /* Gel des étapes (hors quiz). o : { titre, texte } pour personnaliser. */
  function freezeView(o) {
    var G = T.general;
    o = o || {};
    return lockDevice(GQ.freezeRemaining(), { titre: o.titre || G.gelTitre, texte: o.texte || G.gelTexte, compteur: G.gelCompteur });
  }
  function freezeAfter() { startCountdown(GQ.freezeRemaining, T.general.gelCompteur); }

  /* Message d'erreur selon les essais restants. */
  function wrongText(left, custom) {
    if (custom) return custom.replace('{n}', left);
    return left === 1 ? T.general.mauvaiseReponseDernierEssai.replace('{duree}', GQ.ruleVars().duree) : T.general.mauvaiseReponse;
  }

  function formError(value, text, extra) {
    GQ.ui.value = value;
    GQ.ui.msg = { kind: 'error', text: text, shake: true };
    Object.assign(GQ.ui, extra || {});
    GQ.render();
    var input = document.querySelector('.answer-form .field');
    if (input) input.select();
  }

  function introScreen(n, extra) {
    var qc = GQ.questCfg(n);
    return {
      key: 'q' + n + '-intro',
      html:
        questHead(n) +
        frame('<p class="intro-text">' + t(qc.intro) + '</p>') +
        (extra || '') +
        cta(btn(esc(qc.boutonIntro) + icon('fleche'), 'intro-next', ' data-n="' + n + '"')),
    };
  }

  /* Composants partagés avec les modules des quêtes 2 à 5. */
  GQ.C = {
    btn: btn, cta: cta, frame: frame, plain: plain, knitTitle: knitTitle, questHead: questHead,
    feedbackSlot: feedbackSlot, testAnswers: testAnswers, choices: choices, questionCard: questionCard,
    progress: progress, textAnswer: textAnswer, successBlock: successBlock, typewriter: typewriter,
    runTypewriters: runTypewriters, freezeView: freezeView, freezeAfter: freezeAfter,
    wrongText: wrongText, formError: formError, introScreen: introScreen,
  };

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
  /* Mot secret de l'étage (début de chaque quête)                       */
  /* ------------------------------------------------------------------ */

  function accessScreen(n) {
    var A = T.acces;
    var st = GQ.stage(n);
    return {
      key: 'q' + n + '-access',
      elf: { say: 'lieu' },
      after: runTypewriters,
      html:
        '<div class="quest-head">' +
        GQ.knit.icon('pin', 'quest-ico') +
        '<p class="kicker">' + t(A.kicker, { n: n }) + '</p>' +
        knitTitle(st.titre || st.etage) +
        '</div>' +
        '<p class="floor-tag">' + icon('pin') + '<span>' + t(st.etage) + (st.lieu ? ' · ' + t(st.lieu) : '') + '</span></p>' +
        frame(typewriter('access-' + n, t(st.histoire), 'story')) +
        '<p class="muted center small">' + t(A.consigne) + '</p>' +
        textAnswer({ form: 'access', label: A.label, button: A.bouton, caps: true, max: 40, fieldCls: 'field-code', expected: [st.motSecret], attrs: ' data-n="' + n + '"', btnCls: 'btn-red' }),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Quête 1 : le grand quiz                                             */
  /* ------------------------------------------------------------------ */

  function quizLockTexts() {
    var X = QZ.textes;
    return { titre: X.bloqueTitre, texte: X.bloqueTexte, compteur: X.bloqueCompteur };
  }

  var THEME_ICONS = { sapin: 'tree', miroir: 'star', tour: 'tower', materiaux: 'dice', flocon: 'flake', etoile: 'star', cadeau: 'gift' };
  function themeIcon(th, hidden) {
    if (hidden || th.icone === 'mystere') return GQ.knit.text('?', { alt: '', color: '#E4323A', outline: true, cls: 'theme-knit theme-mystery' });
    return GQ.knit.icon(THEME_ICONS[th.icone] || 'star', 'theme-knit');
  }

  function quizThemes() {
    var X = QZ.textes;
    var q = GQ.state.quiz;
    var lock = GQ.quizLockRemaining();
    var maxFail = (P.quiz && P.quiz.tentativesAvantBlocage) || 2;
    var failed = GQ.failedThemeIds();
    var played = GQ.playedThemeIds();
    var html = questHead(1) + '<h2 class="section-title">' + t(X.choixTitre) + '</h2>';
    if (lock) {
      html += lockDevice(lock, quizLockTexts());
    } else if (q.failedSinceLock > 0) {
      html += '<p class="attempts">' + icon('cadenas') + t(X.tentatives, { n: q.failedSinceLock, max: maxFail }) + '</p>';
    }
    html += (lock ? '' : '<p class="muted small center">' + t(X.choixAide) + '</p>') + '<ul class="themes">';
    QZ.themes.forEach(function (th) {
      var available = GQ.themeAvailable(th.id) && !(played[th.id] && !failed[th.id]);
      var disabled = lock || !available;
      var hidden = th.mystere && !played[th.id];
      html +=
        '<li><button type="button" class="theme-card' + (failed[th.id] ? ' is-failed' : '') + (hidden ? ' is-mystery' : '') + '" data-action="start-theme" data-id="' + esc(th.id) + '"' + (disabled ? ' disabled' : '') + '>' +
        '<span class="theme-icon">' + themeIcon(th, hidden) + '</span>' +
        '<span class="theme-body"><span class="theme-title">' + t(hidden ? th.titreMystere : th.titre) + '</span>' +
        '<span class="theme-meta">' + (hidden && th.sousTitreMystere ? t(th.sousTitreMystere) : th.questions.length + ' questions') + '</span></span>' +
        (failed[th.id] ? '<span class="badge">' + esc(X.themeEchoue) + '</span>' : icon('fleche', 'theme-arrow')) +
        '</button></li>';
    });
    html += '</ul>';
    return {
      key: 'q1-themes' + (lock ? '-lock' : ''),
      frozen: !!lock,
      elf: lock ? { say: 'blocage' } : null,
      html: html,
      after: lock ? function () { startCountdown(GQ.quizLockRemaining, QZ.textes.bloqueCompteur); } : null,
    };
  }

  /* Thème mystère : révélation du vrai thème avant la 1re question. */
  function mysteryReveal(theme) {
    var X = QZ.textes;
    return {
      key: 'q1-reveal-' + theme.id,
      celebrate: true,
      html:
        '<section class="success reveal">' +
        '<div class="success-art">' + themeIcon(theme, true) + '</div>' +
        '<p class="kicker">' + t(theme.revelation) + '</p>' +
        knitTitle(theme.titre, { color: '#E4323A', max: 9 }) +
        frame('<p>' + t(theme.revelationTexte) + '</p>', 'frame-center') +
        '</section>' +
        cta(btn(esc(X.revelationBouton) + icon('fleche'), 'quiz-reveal', '', 'btn-red')),
    };
  }

  function quizPlay() {
    var X = QZ.textes;
    var cur = GQ.state.quiz.current;
    var theme = GQ.theme(cur.themeId);
    if (!cur.revealed) return mysteryReveal(theme);
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
        '<p class="theme-tag">' + t(theme.titre) + '</p>' +
        progress(cur.index, total, function (i) { return cur.answers[i] != null; }) +
        questionCard(q) +
        choices(q, { scope: 'quiz', selected: cur.answers[cur.index] }) +
        feedbackSlot() +
        cta(next + (cur.index > 0 ? btn(icon('retour') + esc(X.questionPrecedente), 'quiz-move', ' data-d="-1"', 'btn-ghost btn-inline') : '')) +
        '<button type="button" class="btn btn-ghost btn-abandon" data-action="abandon-theme">' + esc(X.changerTheme) + '</button>',
    };
  }

  /* Correction d'un thème : affichée une fois les 8 réponses validées. */
  function correction(r) {
    var X = QZ.textes;
    var theme = GQ.theme(r.themeId);
    if (!theme || !r.answers) return '';
    return (
      '<details class="correction"' + (GQ.ui.correctionOpen ? ' open' : '') + '><summary>' + icon('loupe') + esc(X.voirCorrection) + '</summary>' +
      '<ol class="correction-list">' + theme.questions.map(function (q, i) {
        var good = GQ.letterIndex(q.reponse);
        var mine = r.answers[i];
        var ok = mine === good;
        return '<li class="' + (ok ? 'is-ok' : 'is-ko') + '">' +
          '<p class="correction-q">' + t(q.question) + '</p>' +
          '<p class="correction-a">' + icon(ok ? 'valide' : 'croix') + '<span><b>' + esc(X.votreReponse) + ' :</b> ' + (mine != null ? GQ.letter(mine) + '. ' + t(q.choix[mine]) : '—') + '</span></p>' +
          (ok ? '' : '<p class="correction-good"><b>' + esc(X.bonneReponse) + ' :</b> ' + GQ.letter(good) + '. ' + t(q.choix[good]) + '</p>') +
          '</li>';
      }).join('') + '</ol></details>'
    );
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
        after: correction(r),
        cta: btn(esc(r.locked ? X.boutonMinuteur : X.boutonAutreTheme) + icon('fleche'), 'quiz-themes'),
      }),
    };
  }

  /* Après le quiz : le premier indice et l'étage à deviner. */
  function floorScreen() {
    var F = QZ.etage;
    var gel = GQ.freezeRemaining();
    var bonus = GQ.state.q1.floorBonus && !gel;
    var html =
      questHead(1, null, F.titre) +
      frame('<p class="card-label">' + icon('loupe') + esc(T.general.indice) + '</p>' + typewriter('floor', t(F.indice), 'story'));
    if (gel) {
      html += freezeView({ titre: F.gelTitre, texte: F.gelTexte });
    } else {
      if (bonus) html += '<div class="joker-hint bonus-hint" role="note"><p class="joker-hint-title">' + icon('etoile') + esc(F.bonusTitre) + '</p><p>' + t(F.bonus) + '</p></div>';
      html += '<h2 class="section-title">' + t(F.question) + '</h2>' +
        textAnswer({ form: 'floor', label: F.label, button: F.bouton, numeric: true, max: 12, fieldCls: 'field-code', expected: F.reponses });
    }
    return {
      key: 'q1-floor' + (gel ? '-gel' : bonus ? '-bonus' : ''),
      frozen: !!gel,
      elf: gel ? { say: 'blocage' } : null,
      after: function () { runTypewriters(); if (gel) freezeAfter(); },
      html: html,
    };
  }

  function quest1() {
    GQ.quizCheckPass();
    GQ.freezeCheck();
    var ph = GQ.state.phase[1];
    var X = QZ.textes;
    if (ph === 'intro') return introScreen(1);
    if (ph === 'play' && GQ.state.quiz.current) return quizPlay();
    if (ph === 'result') return quizResult();
    if (ph === 'floor') return floorScreen();
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
          after: r && !forced ? correction(r) : '',
          cta: btn(esc(X.boutonIndice) + icon('fleche'), 'to-floor'),
        }),
      };
    }
    return quizThemes();
  }
  GQ.questScreens[1] = quest1;

  /* ------------------------------------------------------------------ */
  /* Routage des quêtes                                                  */
  /* ------------------------------------------------------------------ */

  screens.quest = function (n) {
    var s = GQ.state;
    if (s.finished) n = 5;
    if (!(n >= 1 && n <= GQ.QUEST_COUNT)) n = s.quest;
    if (n !== s.quest) {
      GQ.toast(n > s.quest ? T.general.queteVerrouillee : T.general.queteTerminee, 'info');
      GQ.redirect('quete/' + s.quest);
      return { key: 'redirect', html: '' };
    }
    if (s.phase[n] === 'access') return accessScreen(n);
    return GQ.questScreens[n]();
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

  /* Écran d'introduction → début de la quête. */
  var START = {
    1: function () { GQ.setPhase(1, 'themes'); },
    2: function () { GQ.setPhase(2, 'play'); },
    3: function () { GQ.photosStart(); },
    4: function () { GQ.setPhase(4, 'play'); },
    5: function () { GQ.setPhase(5, 'intro'); },
  };
  actions['intro-next'] = function (el) {
    var n = Number(el.dataset.n);
    if (n !== GQ.state.quest || GQ.state.phase[n] !== 'intro') return GQ.render();
    START[n]();
    GQ.uiReset();
    GQ.render();
  };

  /* Quête terminée → saisie du mot secret de l'étage suivant. */
  actions['complete-quest'] = function (el) {
    GQ.completeQuest(Number(el.dataset.n));
    GQ.uiReset();
    goQuest();
  };

  actions['to-floor'] = function () {
    if (GQ.state.quest === 1 && GQ.state.phase[1] === 'success') GQ.setPhase(1, 'floor');
    GQ.uiReset();
    GQ.render();
  };

  actions['start-theme'] = function (el) {
    if (!GQ.quizStart(el.dataset.id)) {
      GQ.toast(GQ.quizLockRemaining() ? QZ.textes.bloqueTitre : T.general.queteVerrouillee, 'error');
    }
    GQ.uiReset();
    GQ.render();
  };

  actions['quiz-reveal'] = function () {
    GQ.quizReveal();
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
    document.querySelectorAll('.choice, .portrait').forEach(function (b) {
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
      var keep = GQ.ui.value;
      GQ.render();
      GQ.ui.value = keep;
      var hint = document.querySelector('.joker-hint');
      if (hint) hint.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  /* ------------------------------------------------------------------ */
  /* Formulaires                                                         */
  /* ------------------------------------------------------------------ */

  forms.team = function (form, value) {
    if (!value.trim()) return formError(value, T.equipe.erreurVide);
    GQ.setTeam(value);
    GQ.go(GQ.state.rulesOk ? 'quete/' + GQ.state.quest : 'regles');
  };

  forms.access = function (form, value) {
    var n = Number(form.dataset.n);
    if (!value.trim()) return formError(value, T.general.reponseVide);
    if (!GQ.unlockQuest(n, value)) return formError(value, T.acces.erreur);
    GQ.uiReset();
    GQ.render();
  };

  forms.floor = function (form, value) {
    if (!value.trim()) return formError(value, T.general.reponseVide);
    var res = GQ.floorAnswer(value);
    if (!res) return GQ.render();
    if (res.ok) { GQ.uiReset(); return goQuest(); }
    if (res.frozen) { GQ.uiReset(); GQ.toast(QZ.etage.erreur, 'error'); return GQ.render(); }
    return formError(value, QZ.etage.erreur);
  };
})();
