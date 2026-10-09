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

  var screens = (GQ.screens = {});
  var actions = (GQ.actions = GQ.actions || {});
  var forms = (GQ.forms = GQ.forms || {});

  /* État d'affichage temporaire (sélection, message, saisie en cours).
   * Il n'est pas sauvegardé et est vidé à chaque changement d'écran. */
  GQ.ui = {};
  GQ.uiReset = function () { GQ.ui = {}; };

  function pad(n) { return (n < 10 ? '0' : '') + n; }

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
    if (!GQ.test.isActive() || !GQ.test.opt('showAnswers')) return '';
    return '<p class="test-note">Mode test · réponses acceptées : ' + (list || []).map(esc).join(' / ') + '</p>';
  }

  function testVerify(note) {
    if (!note || !GQ.test.isActive()) return '';
    return '<p class="test-note test-note-warn">À vérifier : ' + esc(note) + '</p>';
  }

  /* ------------------------------------------------------------------ */
  /* Composants                                                          */
  /* ------------------------------------------------------------------ */

  function questHead(n, sub) {
    return (
      '<div class="quest-head">' +
      '<span class="quest-num" aria-hidden="true">' + pad(n) + '</span>' +
      '<div><p class="eyebrow">' + esc(T.general.quete) + ' ' + n + ' sur ' + GQ.QUEST_COUNT + (sub ? ' · ' + t(sub) : '') + '</p>' +
      '<h1 class="quest-title" tabindex="-1">' + t(GQ.questCfg(n).titre) + '</h1></div>' +
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

  /* QCM : une question, des propositions, un bouton de validation. */
  function mcq(o) {
    var q = o.question;
    var correct = GQ.letterIndex(q.reponse);
    var fb = !!o.feedback;
    var showTest = GQ.test.isActive() && GQ.test.opt('showAnswers');
    var items = q.choix.map(function (c, i) {
      var tried = !fb && o.tried.indexOf(i) !== -1;
      var sel = !fb && GQ.ui.sel === i;
      var ok = fb && i === correct;
      var cls = (tried ? ' is-wrong' : '') + (sel ? ' is-selected' : '') + (ok ? ' is-correct' : '') + (fb && !ok ? ' is-dim' : '');
      return (
        '<li><button type="button" role="radio" aria-checked="' + sel + '" class="choice' + cls + '" data-action="select" data-i="' + i + '"' + (tried || fb ? ' disabled' : '') + '>' +
        '<span class="choice-letter">' + GQ.letter(i) + '</span>' +
        '<span class="choice-text">' + t(c) + '</span>' +
        (tried ? icon('croix', 'choice-icon') : '') + (ok ? icon('valide', 'choice-icon') : '') +
        (showTest && !fb && i === correct ? '<span class="test-badge">bonne réponse</span>' : '') +
        '</button></li>'
      );
    }).join('');
    var pct = Math.round(((o.index + (fb ? 1 : 0)) / o.total) * 100);
    var html =
      '<div class="q-progress"><span class="q-count">' + t(T.general.questionNumero, { n: o.index + 1, total: o.total }) + '</span>' +
      '<span class="bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span></div>' +
      '<div class="question-card"><h2 class="question" id="qtext">' + t(q.question) + '</h2>' + testVerify(q.aVerifier) + '</div>' +
      '<ul class="choices" role="radiogroup" aria-labelledby="qtext">' + items + '</ul>';
    if (fb) {
      html +=
        '<div class="feedback-slot" aria-live="polite"><div class="feedback feedback-ok pop">' + icon('valide') + '<span><strong>' + t(T.general.bonneReponse) + '</strong>' +
        (q.explication ? '<br>' + t(q.explication) : '') + '</span></div></div>' +
        '<div class="sticky-cta">' + btn(esc(o.done ? T.general.terminer : T.general.questionSuivante) + icon('fleche'), 'next-question', ' data-scope="' + o.scope + '"') + '</div>';
    } else {
      html +=
        feedbackSlot() +
        GQ.jokerBlock(o.jokerKey, q.indiceJoker) +
        '<div class="sticky-cta">' + btn(esc(T.general.validerReponse), 'validate-choice', ' data-scope="' + o.scope + '"' + (GQ.ui.sel == null ? ' aria-disabled="true"' : '')) + '</div>';
    }
    return html;
  }

  /* Champ de réponse libre (énigmes, lieux, codes). */
  function textAnswer(o) {
    return (
      '<form class="answer-form" data-form="' + o.form + '"' + (o.attrs || '') + ' novalidate autocomplete="off">' +
      '<label class="field-label" for="answer-' + o.form + '">' + t(o.label) + '</label>' +
      '<input class="field" id="answer-' + o.form + '" name="answer" type="text" maxlength="80" autocomplete="off" autocapitalize="' + (o.caps ? 'characters' : 'off') + '" autocorrect="off" spellcheck="false" enterkeyhint="done" value="' + esc(GQ.ui.value || '') + '"' + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + '>' +
      feedbackSlot() +
      testAnswers(o.expected) +
      '<button class="btn btn-primary" type="submit">' + esc(o.button) + '</button>' +
      '</form>'
    );
  }

  function successBlock(title, html, cta, art) {
    return (
      '<section class="success">' + (art || GQ.art.check()) +
      '<h1 class="success-title" tabindex="-1">' + t(title) + '</h1>' + html + '</section>' + cta
    );
  }

  /* ------------------------------------------------------------------ */
  /* Accueil, équipe, règles                                             */
  /* ------------------------------------------------------------------ */

  screens.home = function () {
    var A = T.accueil;
    var s = GQ.state;
    var cta = s.team
      ? '<p class="home-resume">' + t(A.partieEnCours, { equipe: s.team }) + '</p>' + btn(esc(A.boutonReprendre) + icon('fleche'), 'resume')
      : btn(esc(A.bouton) + icon('fleche'), 'start');
    return {
      key: 'home',
      bare: true,
      html:
        '<main class="screen screen-home">' +
        '<div class="home-brand">' + GQ.brandSlot() + '</div>' +
        '<div class="home-art">' + GQ.art.hero() + '</div>' +
        '<p class="eyebrow eyebrow-center">' + t(A.surtitre) + '</p>' +
        '<h1 class="home-title" tabindex="-1"><span class="display">' + t(A.titre) + '</span><span class="home-title-sub">' + t(A.titreSuite) + '</span></h1>' +
        '<p class="home-subtitle">' + t(A.sousTitre) + '</p>' +
        '<p class="home-lead">' + t(A.accroche) + '</p>' +
        '<div class="home-cta">' + cta + '</div>' +
        '</main>',
    };
  };

  screens.team = function () {
    var E = T.equipe;
    if (GQ.ui.value == null && GQ.state.team) GQ.ui.value = GQ.state.team;
    return {
      key: 'team',
      bare: true,
      html:
        '<main class="screen screen-form">' +
        '<a class="back-link" href="#/">' + icon('retour') + 'Accueil</a>' +
        '<div class="form-art">' + GQ.art.gift() + '</div>' +
        '<h1 class="page-title" tabindex="-1">' + t(E.titre) + '</h1>' +
        '<p class="muted">' + t(E.aide) + '</p>' +
        textAnswer({ form: 'team', label: E.label, button: E.bouton, placeholder: E.placeholder, attrs: '' }) +
        '</main>',
    };
  };

  screens.rules = function () {
    return {
      key: 'rules',
      bare: true,
      html:
        '<main class="screen screen-rules">' +
        '<h1 class="rules-title display" tabindex="-1">' + t(T.regles.titre) + '</h1>' +
        GQ.rulesHtml() +
        '<div class="sticky-cta">' + btn(esc(T.regles.bouton), 'accept-rules') + '</div>' +
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
        '<div class="intro-card">' + GQ.art.gift('intro-art') + '<p class="intro-text">' + t(qc.intro) + '</p></div>' +
        '<div class="sticky-cta">' + btn(esc(qc.boutonIntro) + icon('fleche'), 'intro-next', ' data-n="' + n + '"') + '</div>',
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
      html += '<div class="sticky-cta">' + btn(esc(L.boutonArrivee), 'arrive', ' data-place="' + esc(id) + '"') + '</div>';
    } else {
      html +=
        '<div class="scan-card">' + icon('qr', 'scan-icon') + '<p>' + t(L.scanConsigne) + '</p></div>' +
        '<details class="manual-code"' + (GQ.ui.codeOpen ? ' open' : '') + '><summary>' + t(L.codeManuelTitre) + '</summary>' +
        textAnswer({ form: 'code', label: L.codeManuelLabel, button: L.codeManuelBouton, caps: true, expected: GQ.test.isActive() ? [p.codeQR] : null, attrs: ' data-place="' + esc(id) + '"' }) +
        '<p class="hint">' + t(L.conseilNavigateur) + '</p></details>' +
        (GQ.test.isActive() ? btn('Test : simuler le scan', 'test-scan', ' data-code="' + esc(p.codeQR) + '"', 'btn-test') : '');
    }
    return { key: 'q' + n + '-travel', celebrate: true, html: html };
  }

  /* ------------------------------------------------------------------ */
  /* Quête 1 : le grand quiz                                             */
  /* ------------------------------------------------------------------ */

  function formatDuration(ms) {
    var sec = Math.ceil(ms / 1000);
    return Math.floor(sec / 60) + ':' + pad(sec % 60);
  }

  function minutesLabel(ms) {
    var sec = Math.round(ms / 1000);
    if (sec < 60) return sec + ' secondes';
    var m = Math.round(sec / 60);
    return m + (m > 1 ? ' minutes' : ' minute');
  }

  function quizThemes() {
    var X = QZ.textes;
    var q = GQ.state.quiz;
    var lock = GQ.quizLockRemaining();
    var maxFail = (P.quiz && P.quiz.tentativesAvantBlocage) || 2;
    var failed = GQ.failedThemeIds();
    var html = questHead(1) + '<h2 class="section-title">' + t(X.choixTitre) + '</h2>';
    if (lock) {
      html +=
        '<div class="lock-card" role="status">' + icon('cadenas', 'lock-icon') +
        '<h3>' + t(X.bloqueTitre) + '</h3><p>' + t(X.bloqueTexte) + '</p>' +
        '<p class="lock-count">' + t(X.bloqueCompteur) + ' <span class="countdown" data-countdown>' + formatDuration(lock) + '</span></p></div>';
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
      html: html,
      after: function () {
        if (!lock) return;
        GQ.every(1000, function () {
          var left = GQ.quizLockRemaining();
          var el = document.querySelector('[data-countdown]');
          if (!left) { GQ.render(); return; }
          if (el) el.textContent = formatDuration(left);
        });
      },
    };
  }

  function quizPlay() {
    var X = QZ.textes;
    var fb = GQ.ui.correct && GQ.ui.correct.scope === 'quiz' ? GQ.ui.correct : null;
    var cur = GQ.state.quiz.current;
    var themeId = fb ? fb.themeId : cur.themeId;
    var theme = GQ.theme(themeId);
    var index = fb ? fb.index : cur.index;
    var max = P.quiz && P.quiz.erreursAutoriseesParTheme;
    var html =
      questHead(1, theme.titre) +
      mcq({
        scope: 'quiz',
        question: theme.questions[index],
        index: index,
        total: theme.questions.length,
        tried: fb ? [] : cur.tried,
        feedback: !!fb,
        done: fb && fb.done,
        jokerKey: 'quiz-' + theme.id + '-' + index,
      });
    if (!fb) {
      if (max !== null && max !== undefined) {
        html += '<p class="attempts small">' + t(X.erreurs, { n: cur.errors, max: max }) + '</p>';
      }
      html += '<button type="button" class="btn btn-ghost" data-action="abandon-theme">' + esc(X.changerTheme) + '</button>';
    }
    return { key: 'q1-play-' + themeId + '-' + index + (fb ? '-ok' : ''), html: html };
  }

  function quest1() {
    var ph = GQ.state.phase[1];
    var X = QZ.textes;
    if (GQ.ui.correct && GQ.ui.correct.scope === 'quiz') return quizPlay();
    if (ph === 'intro') return introScreen(1);
    if (ph === 'play' && GQ.state.quiz.current) return quizPlay();
    if (ph === 'success') {
      return {
        key: 'q1-success',
        celebrate: true,
        html: successBlock(X.reussiteTitre, '<p>' + t(X.reussiteTexte) + '</p>',
          '<div class="sticky-cta">' + btn(esc(X.boutonIndice) + icon('fleche'), 'to-place', ' data-n="1"') + '</div>'),
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
        html: successBlock(E.reussiteTitre, '<p>' + t(E.reussiteTexte) + '</p>',
          '<div class="sticky-cta">' + btn(esc(E.boutonIndice) + icon('fleche'), 'to-place', ' data-n="2"') + '</div>'),
      };
    }
    if (ph === 'location') return placeGuessScreen(2);
    if (ph === 'travel') return travelScreen(2);
    return introScreen(2);
  }

  /* ------------------------------------------------------------------ */
  /* Quête 3 : le défi Saint-Gobain                                      */
  /* ------------------------------------------------------------------ */

  function quest3() {
    var ph = GQ.state.phase[3];
    var D = Q.defi;
    var fb = GQ.ui.correct && GQ.ui.correct.scope === 'defi' ? GQ.ui.correct : null;
    if (fb || ph === 'play') {
      var index = fb ? fb.index : GQ.state.defi.index;
      return {
        key: 'q3-play-' + index + (fb ? '-ok' : ''),
        html:
          questHead(3) +
          mcq({
            scope: 'defi',
            question: D.questions[index],
            index: index,
            total: D.questions.length,
            tried: fb ? [] : GQ.state.defi.tried,
            feedback: !!fb,
            done: fb && fb.done,
            jokerKey: 'q3-' + index,
          }),
      };
    }
    if (ph === 'success') {
      return {
        key: 'q3-success',
        celebrate: true,
        html: successBlock(D.reussiteTitre, '<p>' + t(D.reussiteTexte) + '</p>',
          '<div class="sticky-cta">' + btn(esc(D.boutonIndice) + icon('fleche'), 'to-place', ' data-n="3"') + '</div>'),
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
        html: successBlock(
          D.reussiteTitre,
          '<p class="found-place">' + t(D.reussiteLieu, { lieu: p.nom }) + '</p>' +
            (p.texteValidation ? '<p>' + t(p.texteValidation) + '</p>' : '') +
            '<p class="notice">' + icon('pin') + '<span>' + t(D.consigneOrganisateurs) + '</span></p>',
          '<div class="sticky-cta">' + btn(esc(D.bouton) + icon('fleche'), 'to-finale') + '</div>',
          GQ.art.gift('success-gift')
        ),
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
      return {
        key: 'q5-finished',
        celebrate: 'big',
        html:
          '<section class="success finished">' + GQ.art.check() +
          '<p class="eyebrow eyebrow-center">Gobinous Christmas Quest</p>' +
          '<h1 class="success-title display-strong" tabindex="-1">' + t(F.termineeTitre) + '</h1>' +
          '<p>' + t(F.termineeTexte, { equipe: s.team }) + '</p>' +
          '<p class="muted small">' + t(F.termineeLe, {
            date: d.toLocaleDateString('fr-FR'),
            heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          }) + '</p></section>',
      };
    }
    var code = P.finDePartie && P.finDePartie.codeOrganisateur;
    var html =
      questHead(5) +
      '<section class="finale">' + GQ.art.gift('finale-art') +
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
    var title, body, cta, art = GQ.art.check(), celebrate = false, ok = false;

    // Un second affichage du même scan reste un succès tant que la quête n'a pas commencé.
    if (r.status === 'deja' && s.quest === r.next && s.phase[r.next] === 'intro') r = Object.assign({}, r, { status: 'ok' });

    switch (r.status) {
      case 'ok':
        ok = true;
        celebrate = true;
        title = S.okTitre;
        body = '<p>' + t(S.okTexte, { lieu: p.nom, n: r.next }) + '</p>';
        cta = btn(esc(S.boutonSuite.replace('{n}', r.next)) + icon('fleche'), 'resume');
        break;
      case 'fin':
      case 'deja-fini':
        GQ.redirect('quete/5');
        return { key: 'redirect', html: '' };
      case 'fin-desactivee':
        title = T.fin.organisateurTitre;
        body = '<p>' + t(S.finDesactiveeTexte) + '</p>';
        cta = back;
        break;
      case 'deja':
        title = S.dejaTitre;
        body = '<p>' + t(S.dejaTexte) + '</p>';
        cta = back;
        break;
      case 'trop-tot':
        title = S.tropTotTitre;
        body = '<p>' + t(S.tropTotTexte) + '</p>';
        cta = back;
        break;
      case 'pas-de-partie':
        title = S.pasDePartieTitre;
        body = '<p>' + t(S.pasDePartieTexte) + '</p>';
        cta = btn(esc(S.boutonAccueil), 'go-home');
        break;
      default:
        title = S.inconnuTitre;
        body = '<p>' + t(S.inconnuTexte) + '</p>';
        cta = s.team ? back : btn(esc(S.boutonAccueil), 'go-home');
    }
    if (!ok) art = '<div class="scan-art">' + icon(r.status === 'trop-tot' ? 'cadenas' : 'qr') + '</div>';
    return {
      key: 'scan-' + code + '-' + r.status,
      bare: !s.team || !s.rulesOk,
      celebrate: celebrate,
      html: (s.team && s.rulesOk ? '' : '<main class="screen">') +
        '<section class="success' + (ok ? '' : ' is-neutral') + '">' + art +
        '<h1 class="success-title" tabindex="-1">' + t(title) + '</h1>' + body + '</section>' +
        '<div class="sticky-cta">' + cta + '</div>' +
        (s.team && s.rulesOk ? '' : '</main>'),
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

  actions.select = function (el) {
    var i = Number(el.dataset.i);
    GQ.ui.sel = i;
    GQ.ui.msg = null;
    document.querySelectorAll('.choice').forEach(function (b) {
      var on = Number(b.dataset.i) === i;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    var v = document.querySelector('[data-action="validate-choice"]');
    if (v) v.removeAttribute('aria-disabled');
    var slot = document.querySelector('.feedback-slot');
    if (slot) slot.innerHTML = '';
  };

  actions['validate-choice'] = function (el) {
    var scope = el.dataset.scope;
    var sel = GQ.ui.sel;
    if (sel == null) {
      GQ.ui.msg = { kind: 'error', text: T.general.choixVide, shake: true };
      return GQ.render();
    }
    var index, themeId, question, res;
    if (scope === 'quiz') {
      var cur = GQ.state.quiz.current;
      if (!cur) return GQ.render();
      themeId = cur.themeId;
      index = cur.index;
      question = GQ.theme(themeId).questions[index];
      res = GQ.quizAnswer(sel);
    } else {
      index = GQ.state.defi.index;
      question = Q.defi.questions[index];
      res = GQ.defiAnswer(sel);
    }
    if (!res) return GQ.render();
    if (res.correct) {
      GQ.uiReset();
      if (!(res.done && !question.explication)) {
        GQ.ui.correct = { scope: scope, themeId: themeId, index: index, done: res.done };
      }
      return GQ.render();
    }
    if (res.failed) {
      GQ.uiReset();
      GQ.render();
      GQ.modal({
        title: QZ.textes.tropErreurs,
        text: res.locked ? QZ.textes.bloqueTexte : '',
        cancel: T.general.continuer,
        icon: 'cadenas',
      });
      return;
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
