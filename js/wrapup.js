/* Gobinous Christmas Wrap-Up (#/wrapup) : questionnaire de satisfaction
 * anonyme, sans code. Questions : config/wrapup.js. Les réponses partent
 * au serveur du jeu (une par téléphone, modifiables) ; les organisateurs
 * les retrouvent dans le tableau de bord (#/suivi/avis). */
(function () {
  'use strict';

  var GQ = window.GQ;
  var W = GQ.cfg.wrapup;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;
  var C = GQ.C;
  var screens = GQ.screens;
  var actions = GQ.actions;
  var KEY = 'gobinous-club:avis';

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.id) return s;
    } catch (e) { /* rien */ }
    var a = '';
    while (a.length < 16) a += Math.random().toString(36).slice(2);
    return { id: a.slice(0, 16), reponses: {}, envoye: false };
  }
  var me = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(me)); } catch (e) { /* mémoire seule */ }
  }
  GQ.wrapup = { state: function () { return me; } };

  function answered(q) {
    var v = me.reponses[q.id];
    return v != null && String(v).trim() !== '';
  }

  function field(q, i) {
    var v = me.reponses[q.id];
    var head = '<p class="wq-q" id="wq-' + q.id + '"><span class="wq-n">' + (i + 1) + '</span><span>' + t(q.question) + '</span>' +
      '<small class="wq-req">' + esc(q.obligatoire ? W.obligatoire : W.facultatif) + '</small></p>';
    var body = '';
    if (q.type === 'etoiles') {
      body = '<div class="wq-stars" role="radiogroup">' + [1, 2, 3, 4, 5].map(function (n) {
        return '<button type="button" role="radio" aria-checked="' + (v === n) + '" aria-label="' + n + ' sur 5" class="wq-star' + (v >= n ? ' is-on' : '') + '" data-action="wq-set" data-q="' + q.id + '" data-v="' + n + '">' + GQ.pix('star') + '</button>';
      }).join('') + '</div>';
    } else if (q.type === 'echelle') {
      body = '<div class="wq-scale" role="radiogroup">' + [1, 2, 3, 4, 5].map(function (n) {
        return '<button type="button" role="radio" aria-checked="' + (v === n) + '" class="wq-dot' + (v === n ? ' is-on' : '') + '" data-action="wq-set" data-q="' + q.id + '" data-v="' + n + '">' + n + '</button>';
      }).join('') + '</div><p class="wq-ends"><span>' + t(q.min) + '</span><span>' + t(q.max) + '</span></p>';
    } else if (q.type === 'choix') {
      body = '<div class="wq-choices" role="radiogroup">' + q.options.map(function (o) {
        return '<button type="button" role="radio" aria-checked="' + (v === o) + '" class="wq-chip' + (v === o ? ' is-on' : '') + '" data-action="wq-set" data-q="' + q.id + '" data-s="' + esc(o) + '">' + t(o) + '</button>';
      }).join('') + '</div>';
    } else {
      body = '<textarea class="field wq-text" rows="3" maxlength="600" data-wq-text="' + q.id + '" placeholder="' + esc(q.placeholder || '') + '">' + esc(v || '') + '</textarea>';
    }
    return '<div class="wq" role="group" aria-labelledby="wq-' + q.id + '">' + head + body + '</div>';
  }

  screens.wrapup = function () {
    var head = GQ.clubHeader({ href: 'programme', label: 'Programme' }) +
      '<main class="screen screen-plain screen-wrapup">' +
      '<div class="center-head">' + GQ.knit.icon('check', 'head-ico') + '<p class="kicker">Gobinous</p>' + C.knitTitle(W.titre.replace(/^Christmas\s+/i, '')) + '</div>';
    if (me.envoye && !GQ.ui.edit) {
      return {
        key: 'wrapup-merci',
        bare: true,
        celebrate: true,
        html: head +
          '<section class="success"><div class="success-art">' + GQ.knit.icon('gift', 'success-ico') + '</div>' +
          '<h2 class="success-title" tabindex="-1">' + t(W.merciTitre) + '</h2>' +
          C.frame('<p>' + t(W.merciTexte) + '</p>', 'frame-center') + '</section>' +
          '<p class="center"><button type="button" class="btn btn-ghost" data-action="wq-edit">' + esc(W.modifier) + '</button></p>' +
          C.cta('<a class="btn btn-red" href="#/programme">' + icon('retour') + 'Retour au programme</a>') +
          '</main>',
      };
    }
    return {
      key: 'wrapup',
      bare: true,
      html: head +
        GQ.elfTalk('<p class="elf-talk-big">' + t(W.bulle) + '</p><p>' + t(W.intro) + '</p>') +
        '<form class="wq-form" data-form="wrapup" novalidate>' +
        W.questions.map(field).join('') +
        C.feedbackSlot() +
        '<button class="btn btn-red" type="submit">' + esc(W.bouton) + icon('fleche') + '</button></form>' +
        '</main>',
    };
  }

  actions['wq-set'] = function (el) {
    var q = el.dataset.q;
    me.reponses[q] = el.dataset.v ? Number(el.dataset.v) : el.dataset.s;
    save();
    keepText();
    GQ.ui.msg = null;
    GQ.render();
  };

  // Les réponses libres sont conservées à chaque frappe.
  function keepText() {
    document.querySelectorAll('[data-wq-text]').forEach(function (a) { me.reponses[a.getAttribute('data-wq-text')] = a.value; });
    save();
  }
  document.addEventListener('input', function (e) {
    if (e.target.closest && e.target.closest('[data-wq-text]')) keepText();
  });

  actions['wq-edit'] = function () {
    GQ.uiReset();
    GQ.ui.edit = true;
    GQ.render();
  };

  GQ.forms.wrapup = function () {
    keepText();
    var missing = W.questions.filter(function (q) { return q.obligatoire && !answered(q); });
    if (missing.length) {
      GQ.ui.msg = { kind: 'error', text: W.erreurObligatoire, shake: true };
      GQ.render();
      var q = document.querySelector('[data-q="' + missing[0].id + '"], [data-wq-text="' + missing[0].id + '"]');
      if (q) q.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var reponses = {};
    W.questions.forEach(function (q) { if (answered(q)) reponses[q.id] = me.reponses[q.id]; });
    fetch(GQ.apiUrl('avis'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: me.id, reponses: reponses }),
    }).then(function (r) {
      if (!r.ok) throw new Error('http');
      me.envoye = true;
      save();
      GQ.uiReset();
      GQ.render();
    }).catch(function () {
      GQ.ui.msg = { kind: 'error', text: W.erreurEnvoi, shake: true };
      GQ.render();
    });
  };
})();
