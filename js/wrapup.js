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
      body = '<textarea class="field wq-text" rows="3" maxlength="2000" data-wq-text="' + q.id + '" placeholder="' + esc(q.placeholder || '') + '">' + esc(v || '') + '</textarea>';
    }
    return '<div class="wq" role="group" aria-labelledby="wq-' + q.id + '">' + head + body + '</div>';
  }

  /* Secret Santa : tirage au sort d'un numéro unique (fait par le serveur). */
  var S = W.santa || null;
  var drawing = false;
  function santaHtml() {
    if (!S) return '';
    var n = me.santa;
    return '<section class="santa">' +
      '<p class="santa-title">' + GQ.pix('gift', 'santa-pix') + t(S.titre) + '</p>' +
      (!n && !me.apporte
        // Étape 1 : le numéro du cadeau apporté, puis la zone disparaît.
        ? '<p class="santa-step">' + t(S.apporteTitre || '') + '</p>' +
          '<p class="santa-text">' + t(S.apporteTexte || '') + '</p>' +
          '<form class="answer-form santa-form" data-form="santa-apporte" novalidate autocomplete="off">' +
          '<label class="field-label" for="santa-apporte">' + esc(S.apporteLabel || '') + '</label>' +
          '<input id="santa-apporte" class="field field-code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" value="' + esc(GQ.ui.santaVal || '') + '">' +
          (GQ.ui.santaErr ? '<p class="feedback feedback-error shake">' + icon('croix') + '<span>' + t(GQ.ui.santaErr) + '</span></p>' : '') +
          '<button class="btn btn-red" type="submit">' + esc(S.apporteBouton || 'Valider') + '</button></form>'
        : n
        ? (me.apporte ? '<p class="santa-chip">' + t(S.apporteRappel || '', { n: me.apporte }) + '</p>' : '') +
          '<p class="santa-step">' + t(S.resultatTitre || S.resultat) + '</p>' +
          '<div class="santa-num">' + GQ.knit.text(String(n), { alt: '', color: '#E4323A', outline: true, cls: 'santa-img' }) + '</div>' +
          '<p class="santa-help">' + t(S.aide, { n: n }) + '</p>'
        : '<p class="santa-chip">' + t(S.apporteRappel || '', { n: me.apporte }) + '</p>' +
          '<p class="santa-text">' + t(S.texte) + '</p>' +
          '<div class="santa-num santa-roll" data-santa-roll hidden></div>' +
          (GQ.ui.santaErr ? '<p class="feedback feedback-error shake">' + icon('croix') + '<span>' + t(GQ.ui.santaErr) + '</span></p>' : '') +
          '<button type="button" class="btn btn-red" data-action="santa-draw"' + (drawing ? ' disabled' : '') + '>' + GQ.pix('star', 'btn-pix') + esc(S.bouton) + '</button>') +
      '</section>';
  }

  // Étape 1 du Secret Santa : numéro du cadeau apporté.
  GQ.forms['santa-apporte'] = function (form) {
    var input = form.querySelector('input');
    var v = Number(String(input.value || '').replace(/\D/g, ''));
    var total = S.total || 40;
    GQ.ui.santaVal = input.value;
    if (!(v >= 1 && v <= total)) {
      GQ.ui.santaErr = t(S.apporteErreur || '', { total: total });
      GQ.audio.sfx('error');
      return GQ.render();
    }
    me.apporte = v;
    save();
    GQ.ui.santaErr = null;
    GQ.ui.santaVal = '';
    GQ.audio.sfx('ok');
    GQ.render();
  };

  actions['santa-draw'] = function (el) {
    if (drawing || me.santa) return;
    drawing = true;
    el.disabled = true;
    var roll = document.querySelector('[data-santa-roll]');
    var tick = 0;
    var timer = setInterval(function () {
      if (!roll) return;
      roll.hidden = false;
      roll.innerHTML = GQ.knit.text(String(1 + Math.floor(Math.random() * (S.total || 40))), { alt: '', color: '#00ADE1', outline: true, cls: 'santa-img' });
      if (++tick % 3 === 0) GQ.audio.sfx('unlock');
    }, 90);
    var started = Date.now();
    fetch(GQ.apiUrl('santa/tirage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: me.id, apporte: me.apporte }),
    }).then(function (r) {
      return r.json().then(function (d) { if (!r.ok) throw new Error(d.erreur || 'http'); return d; });
    }).then(function (d) {
      // Le suspense dure au moins 1,6 s.
      return new Promise(function (ok) { setTimeout(function () { ok(d); }, Math.max(0, 1600 - (Date.now() - started))); });
    }).then(function (d) {
      clearInterval(timer);
      me.santa = d.numero;
      save();
      drawing = false;
      GQ.render();
      GQ.audio.sfx('win');
      GQ.celebrate(true);
    }, function (e) {
      clearInterval(timer);
      drawing = false;
      if (e.message === 'apporte-pris') { me.apporte = null; save(); }
      GQ.ui.santaErr = e.message === 'complet' ? S.complet : e.message === 'apporte-pris' ? S.apportePris : S.erreur;
      GQ.audio.sfx('error');
      GQ.render();
    });
  };

  screens.wrapup = function () {
    var head = GQ.clubHeader({ href: 'programme', label: 'Programme' }) +
      '<main class="screen screen-plain screen-wrapup">' +
      '<div class="center-head">' + GQ.knit.icon('gift', 'head-ico') + '<p class="kicker">Gobi\'Christmas</p>' + C.knitTitle(W.titre.replace(/^(Gobi'|Gobi’)?Christmas\s+/i, '')) + '</div>';
    // Réponse envoyée : définitive, plus de modification possible.
    if (me.envoye) {
      return {
        key: 'wrapup-merci',
        bare: true,
        celebrate: true,
        html: head +
          santaHtml() +
          '<section class="success"><div class="success-art">' + GQ.knit.icon('check', 'success-ico') + '</div>' +
          '<h2 class="success-title" tabindex="-1">' + t(W.merciTitre) + '</h2>' +
          C.frame('<p>' + t(W.merciTexte) + '</p>', 'frame-center') + '</section>' +
          (W.dejaRepondu ? '<p class="notice wq-locked">' + icon('cadenas') + '<span>' + t(W.dejaRepondu) + '</span></p>' : '') +
          C.cta('<a class="btn btn-red" href="#/programme">' + icon('retour') + 'Retour au programme</a>') +
          '</main>',
      };
    }
    return {
      key: 'wrapup',
      bare: true,
      html: head +
        santaHtml() +
        '<h2 class="section-title wq-head">' + t(W.avisTitre || 'Votre avis') + '</h2>' +
        GQ.elfTalk('<p class="elf-talk-big">' + t(W.bulle) + '</p><p>' + t(W.intro) + '</p>') +
        '<form class="wq-form" data-form="wrapup" novalidate>' +
        W.questions.map(field).join('') +
        C.feedbackSlot() +
        '<button class="btn btn-red" type="submit">' + esc(W.bouton) + icon('fleche') + '</button></form>' +
        '</main>',
    };
  }

  // Choix d'une réponse : mise à jour sur place (pas de nouveau rendu de la
  // page), pour un clic fluide, sans clignotement ni saut.
  actions['wq-set'] = function (el) {
    var q = el.dataset.q;
    var val = el.dataset.v ? Number(el.dataset.v) : el.dataset.s;
    me.reponses[q] = val;
    save();
    keepText();
    var group = el.parentNode;
    group.querySelectorAll('[data-action="wq-set"]').forEach(function (b) {
      var on = el.classList.contains('wq-star') ? Number(b.dataset.v) <= val : b === el;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', String(b === el));
    });
    var fb = document.querySelector('.wq-form .feedback');
    if (fb && GQ.ui.msg) { GQ.ui.msg = null; fb.remove(); }
  };

  // Les réponses libres sont conservées à chaque frappe.
  function keepText() {
    document.querySelectorAll('[data-wq-text]').forEach(function (a) { me.reponses[a.getAttribute('data-wq-text')] = a.value; });
    save();
  }
  document.addEventListener('input', function (e) {
    if (e.target.closest && e.target.closest('[data-wq-text]')) keepText();
  });

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
      // 409 : ce téléphone a déjà répondu, la réponse reste définitive.
      if (!r.ok && r.status !== 409) throw new Error('http');
      me.envoye = true;
      save();
      // Défi de la Party « Ton avis compte » : validé automatiquement.
      if (GQ.party && GQ.party.auto) {
        GQ.party.auto('avis').then(function (did) { if (did && GQ.cfg.party.autoValide) GQ.toast(GQ.cfg.party.autoValide, 'info'); });
      }
      GQ.uiReset();
      GQ.render();
    }).catch(function () {
      GQ.ui.msg = { kind: 'error', text: W.erreurEnvoi, shake: true };
      GQ.render();
    });
  };
})();
