/* Quête 4 : l'enquête du Support 44. Un terminal de sécurité, 4 modules
 * successifs ; chaque module validé complète le badge du suspect. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var C = GQ.C;
  var E = GQ.cfg.quetes.enquete;
  var T = GQ.cfg.textes;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;

  /* Badge du suspect : les champs se dévoilent module après module. */
  function badge(step, final) {
    var f = E.fiche;
    var hidden = '<span class="redacted">▓▓▓▓▓▓</span>';
    function field(k, v, i) {
      return '<div class="id-field"><dt>' + esc(k) + '</dt><dd>' + (final || step > i ? t(v) : hidden) + '</dd></div>';
    }
    return (
      '<div class="id-card' + (final ? ' is-final' : '') + '">' +
      '<p class="id-head">' + icon('badge') + esc(f.titre) + '</p>' +
      '<div class="id-body">' +
      '<div class="id-photo">' + (final || step > 0 ? '<img src="' + esc(f.photo) + '" alt="Photo du suspect">' : '<span>?</span>') + '</div>' +
      '<dl class="id-fields">' +
      field('Nom', f.nom, 3) + field('Matricule', f.matricule, 1) + field('Service', f.service, 2) +
      '</dl></div></div>'
    );
  }

  function terminalHead(step) {
    var m = E.modules[step];
    return (
      '<div class="terminal-head">' +
      '<p class="terminal-title">' + esc(E.terminalTitre) + '</p>' +
      (m ? '<p class="terminal-module">Module ' + (step + 1) + '/' + E.modules.length + ' · ' + esc(m.sousTitre) + '</p>' : '') +
      '<div class="terminal-bar" aria-hidden="true">' + E.modules.map(function (_, i) {
        return '<i class="' + (i < step ? 'is-done' : i === step ? 'is-current' : '') + '"></i>';
      }).join('') + '</div></div>'
    );
  }

  function moduleBody(m, step) {
    var expected = m.reponses || null;
    if (m.choix && m.choix[0].image) {
      return (
        '<p class="terminal-text">' + t(m.indice) + '</p>' +
        '<ul class="portraits" role="radiogroup" aria-label="' + esc(m.titre) + '">' + m.choix.map(function (c, i) {
          var sel = GQ.ui.sel === i;
          var isGood = GQ.letterIndex(m.reponse) === i && GQ.test.isActive() && GQ.test.opt('showAnswers');
          return '<li><button type="button" role="radio" aria-checked="' + sel + '" class="portrait' + (sel ? ' is-selected' : '') + '" data-action="select" data-scope="q4" data-i="' + i + '">' +
            '<img src="' + esc(c.image) + '" alt="' + esc(c.label) + '"><span>' + esc(c.label) + '</span>' +
            (isGood ? '<span class="test-badge">bonne réponse</span>' : '') + '</button></li>';
        }).join('') + '</ul>' +
        C.feedbackSlot() + GQ.jokerBlock('q4-' + step, m.indiceJoker) +
        C.cta(C.btn(esc(T.general.validerReponse), 'module-choice', GQ.ui.sel == null ? ' aria-disabled="true"' : '', 'btn-red'))
      );
    }
    if (m.choix) {
      return (
        (m.intro ? '<p class="terminal-text">' + t(m.intro) + '</p>' : '') +
        '<ol class="audit">' + m.indices.map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ol>' +
        C.choices({ question: m.titre, choix: m.choix, reponse: m.reponse }, { scope: 'q4', selected: GQ.ui.sel }) +
        C.feedbackSlot() + GQ.jokerBlock('q4-' + step, m.indiceJoker) +
        C.cta(C.btn(esc(T.general.validerReponse), 'module-choice', GQ.ui.sel == null ? ' aria-disabled="true"' : '', 'btn-red'))
      );
    }
    var top = m.consignes
      ? '<ul class="terminal-list">' + m.consignes.map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ul>'
      : (m.intro ? '<p class="terminal-text">' + t(m.intro) + '</p>' : '') +
        '<ol class="equations">' + m.equations.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
    return top + GQ.jokerBlock('q4-' + step, m.indiceJoker) +
      C.textAnswer({ form: 'module', label: m.label, button: T.general.validerReponse, caps: !m.chiffres, numeric: !!m.chiffres, max: m.chiffres || 30, fieldCls: 'field-code', expected: expected, btnCls: 'btn-red' });
  }

  function play() {
    var step = GQ.state.q4.step;
    var m = E.modules[step];
    var gel = GQ.freezeRemaining();
    var html =
      '<h1 class="sr-only" tabindex="-1">' + t(E.titre) + ' · ' + t(m.titre) + '</h1>' +
      '<section class="terminal">' + terminalHead(step) +
      badge(step) +
      (GQ.ui.notice ? '<p class="notice">' + icon('valide') + '<span>' + t(GQ.ui.notice) + '</span></p>' : '') +
      '<h2 class="terminal-h">' + t(m.titre) + '</h2>' +
      (gel ? C.freezeView() + (m.indice ? '<p class="terminal-text">' + t(m.indice) + '</p>' : '') : moduleBody(m, step)) +
      '</section>';
    return {
      key: 'q4-play-' + step + (gel ? '-gel' : ''),
      frozen: !!gel,
      elf: gel ? { say: 'blocage' } : null,
      after: gel ? C.freezeAfter : null,
      html: html,
    };
  }

  function intro() {
    return {
      key: 'q4-intro',
      after: C.runTypewriters,
      html:
        C.questHead(4) +
        '<section class="terminal">' + terminalHead(-1) +
        C.typewriter('q4-intro', t(E.intro), 'terminal-text') +
        '</section>' +
        C.cta(C.btn(esc(E.boutonIntro) + icon('fleche'), 'intro-next', ' data-n="4"', 'btn-red')),
    };
  }

  GQ.questScreens[4] = function () {
    var passed = GQ.freezeCheck();
    if (passed && passed.indexOf('q4-') === 0) GQ.ui.notice = E.moduleForce;
    var ph = GQ.state.phase[4];
    if (ph === 'play') return play();
    if (ph === 'success') {
      return {
        key: 'q4-success',
        celebrate: 'big',
        elf: { say: 'reussite' },
        html:
          C.questHead(4) +
          '<section class="success">' +
          '<h2 class="success-title" tabindex="-1">' + t(E.reussiteTitre) + '</h2>' +
          badge(4, true) +
          '<p class="terminal-ok">' + t(E.reussiteTexte) + '</p>' +
          '</section>' +
          C.cta(C.btn(icon('pin') + esc(E.bouton), 'complete-quest', ' data-n="4"', 'btn-red')),
      };
    }
    return intro();
  };

  function handle(res, value) {
    if (!res) return GQ.render();
    if (res.ok) {
      GQ.uiReset();
      if (!res.done) GQ.ui.notice = E.moduleValide;
      return GQ.render();
    }
    if (res.frozen) { GQ.uiReset(); return GQ.render(); }
    if (value != null) return C.formError(value, C.wrongText(res.left, E.erreur));
    GQ.ui.sel = null;
    GQ.ui.msg = { kind: 'error', text: C.wrongText(res.left, E.erreur), shake: true };
    GQ.render();
  }

  GQ.actions['module-choice'] = function () {
    if (GQ.ui.sel == null) {
      GQ.ui.msg = { kind: 'error', text: T.general.choixVide, shake: true };
      return GQ.render();
    }
    handle(GQ.moduleAnswer(GQ.ui.sel));
  };

  GQ.forms.module = function (form, value) {
    if (!value.trim()) return C.formError(value, T.general.reponseVide);
    handle(GQ.moduleAnswer(value), value);
  };
})();
