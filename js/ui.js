/* Composants d'interface : illustrations SVG, en-tête, messages,
 * fenêtres de confirmation, animations. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var T = GQ.cfg.textes;
  var t = GQ.t;
  var esc = GQ.esc;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Petites icônes (24 × 24, trait). */
  var ICONS = {
    miroir: '<rect x="6" y="3" width="12" height="15" rx="6"/><path d="M12 18v3M8 21h8M9.5 8.5l3-3M10 12l5-5"/>',
    tour: '<path d="M8 21V7l4-4 4 4v14M5 21h14M10.5 9h3M10.5 12.5h3M10.5 16h3"/>',
    materiaux: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/>',
    flocon: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
    etoile: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    cadeau: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1.5S9 9 12 9zM12 9c2-4 6-4 6-1.5S15 9 12 9z"/>',
    loupe: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    cadenas: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    livre: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20"/>',
    fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    retour: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    croix: '<path d="M6 6l12 12M18 6L6 18"/>',
    valide: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    photo: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    tel: '<path d="M6.5 3.5l3 .5 1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5.5 3c0 1-1 2-2 2C11 19.5 4.5 13 4.5 5.5c0-1 1-2 2-2z"/>',
    badge: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6.5 16c.5-1.5 1.5-2 2.5-2s2 .5 2.5 2M14 10h4M14 13h3"/>',
    chrono: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M12 2.5v3.5"/>',
  };

  GQ.icon = function (name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.etoile) + '</svg>';
  };

  /* ------------------------------------------------------------------ */
  /* Logo                                                                */
  /* ------------------------------------------------------------------ */

  /* variant : 'clair' (sur fond foncé) ou 'fonce' (sur fond clair). */
  GQ.logo = function (variant, cls) {
    var m = GQ.cfg.parametres.marque || {};
    var file = variant === 'fonce' ? m.logoFonce : m.logoClair;
    if (!file) return '';
    return '<img class="logo ' + (cls || '') + '" src="' + esc(file) + '" alt="' + esc(m.logoAlt || 'Saint-Gobain') + '">';
  };

  /* ------------------------------------------------------------------ */
  /* Chrono global                                                       */
  /* ------------------------------------------------------------------ */

  function mmss(ms) {
    var sec = Math.floor(Math.abs(ms) / 1000);
    return (sec >= 3600 ? Math.floor(sec / 3600) + ':' : '') +
      ('0' + Math.floor((sec % 3600) / 60)).slice(-2) + ':' + ('0' + (sec % 60)).slice(-2);
  }
  GQ.mmss = mmss;

  GQ.clockHtml = function () {
    if (!GQ.clock()) return '';
    return '<span class="clock" data-clock role="timer" aria-live="off"></span>';
  };

  /* Met à jour tous les chronos affichés (appelé chaque seconde). */
  GQ.updateClocks = function () {
    var c = GQ.clock();
    document.querySelectorAll('[data-clock]').forEach(function (el) {
      if (!c) { el.hidden = true; return; }
      var over = c.remaining < 0;
      var low = !over && c.remaining <= 5 * 60000;
      el.className = 'clock' + (over ? ' is-over' : low ? ' is-low' : '') + (c.frozen ? ' is-frozen' : '');
      el.innerHTML = GQ.icon('chrono') + '<span class="clock-digits">' + (over ? '+' : '') + mmss(over ? -c.remaining : c.remaining) + '</span>';
      el.setAttribute('aria-label', (over ? T.chrono.depasse : T.chrono.restant) + ' : ' + mmss(c.remaining));
    });
  };

  /* ------------------------------------------------------------------ */
  /* En-tête des écrans de jeu (bandeau tricoté)                         */
  /* ------------------------------------------------------------------ */

  GQ.header = function (currentQuest) {
    var s = GQ.state;
    var steps = '';
    for (var n = 1; n <= GQ.QUEST_COUNT; n++) {
      var cls = s.finished || n < s.quest ? 'done' : n === s.quest ? 'current' : '';
      steps +=
        '<li class="step ' + cls + '"' + (n === currentQuest ? ' aria-current="step"' : '') + '>' +
        GQ.knit.icon(GQ.questIcon(n), 'step-ico') +
        '<span class="sr-only">' + esc(T.general.quete) + ' ' + n + (cls === 'done' ? ' (terminée)' : '') + '</span></li>';
    }
    var used = s.joker.used;
    return (
      '<div class="garland" aria-hidden="true"></div>' +
      '<header class="topbar">' +
      '<div class="topbar-row">' +
      (GQ.clockHtml() || '<span></span>') +
      '<button type="button" class="link-btn" data-action="show-rules" aria-label="' + esc(T.general.regles) + '">' + GQ.icon('livre') + '</button>' +
      '</div>' +
      '<div class="topbar-row topbar-sub">' +
      '<ol class="stepper" aria-label="Progression">' + steps + '</ol>' +
      '<span class="joker-chip ' + (used ? 'is-used' : '') + '" title="' + esc(s.team) + '">' + GQ.icon('etoile') +
      esc(used ? T.joker.statutUtilise : T.joker.statutDisponible) + '</span>' +
      '</div>' +
      '</header>'
    );
  };

  var toastTimer;
  GQ.toast = function (msg, kind) {
    var el = document.getElementById('toast');
    el.className = 'toast is-visible ' + (kind || '');
    el.innerHTML = t(msg);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 4200);
  };

  /* ------------------------------------------------------------------ */
  /* Fenêtre de confirmation                                             */
  /* ------------------------------------------------------------------ */

  GQ.modal = function (opts) {
    return new Promise(function (resolve) {
      var root = document.getElementById('modal-root');
      var prevFocus = document.activeElement;
      root.innerHTML =
        '<div class="modal-backdrop" data-modal-close></div>' +
        '<div class="modal' + (opts.sheet ? ' modal-sheet' : '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        (opts.sheet ? '<div class="garland" aria-hidden="true"></div><div class="sheet-in">' : '') +
        (opts.knit ? GQ.knit.icon(opts.knit, 'modal-knit') : opts.icon ? '<div class="modal-icon">' + GQ.icon(opts.icon) + '</div>' : '') +
        (opts.sheet
          ? '<h2 id="modal-title" class="sheet-title"><span class="sr-only">' + t(opts.title) + '</span>' +
            GQ.knit.title(String(opts.title).toUpperCase(), { alt: '', max: 10, outline: true, cls: 'k-title-img' }) + '</h2>'
          : '<h2 id="modal-title" class="modal-title">' + t(opts.title) + '</h2>') +
        (opts.html || (opts.text ? '<p>' + t(opts.text) + '</p>' : '')) +
        '<div class="modal-actions">' +
        (opts.confirm ? '<button type="button" class="btn btn-primary" data-modal-ok>' + esc(opts.confirm) + '</button>' : '') +
        (opts.cancel ? '<button type="button" class="btn ' + (opts.sheet ? 'btn-red' : 'btn-secondary') + '" data-modal-cancel>' + esc(opts.cancel) + '</button>' : '') +
        '</div>' + (opts.sheet ? '</div>' : '') + '</div>';
      root.classList.add('is-open');
      document.body.classList.add('no-scroll');

      function close(val) {
        GQ.closeModal = null;
        root.classList.remove('is-open');
        root.innerHTML = '';
        document.body.classList.remove('no-scroll');
        document.removeEventListener('keydown', onKey);
        if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
        resolve(val);
      }
      function onKey(e) {
        if (e.key === 'Escape') close(false);
        if (e.key === 'Tab') {
          var f = root.querySelectorAll('button');
          if (!f.length) return;
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
      }
      document.addEventListener('keydown', onKey);
      GQ.closeModal = function () { close(false); };
      root.addEventListener('click', function handler(e) {
        if (e.target.closest('[data-modal-ok]')) { root.removeEventListener('click', handler); close(true); }
        else if (e.target.closest('[data-modal-cancel]') || e.target.hasAttribute('data-modal-close')) {
          root.removeEventListener('click', handler); close(false);
        }
      });
      var first = root.querySelector('[data-modal-ok]') || root.querySelector('button');
      if (first) first.focus();
    });
  };

  /* Règles du jeu : une carte tricotée par règle, dans la DA du jeu. */
  GQ.rulesHtml = function () {
    var R = T.regles;
    var v = GQ.ruleVars();
    return (
      (R.intro ? '<p class="rules-intro">' + t(R.intro, v) + '</p>' : '') +
      '<ol class="rules">' +
      R.liste.map(function (r, i) {
        return '<li class="rule">' +
          '<div class="rule-art">' + GQ.knit.icon(r.icone || 'star', 'rule-ico') + '<span class="rule-num">' + (i + 1) + '</span></div>' +
          '<div class="rule-body"><h3 class="rule-title">' + t(r.titre, v) + '</h3><p>' + t(r.texte, v) + '</p></div>' +
          '</li>';
      }).join('') +
      '</ol>' +
      '<div class="rules-goal">' + GQ.knit.icon('gift', 'rules-goal-ico') + '<p>' + t(R.objectif, v) + '</p></div>'
    );
  };

  /* ------------------------------------------------------------------ */
  /* Animations                                                          */
  /* ------------------------------------------------------------------ */

  GQ.celebrate = function (big) {
    if (reduceMotion) return;
    var fx = document.getElementById('fx');
    var colors = ['#17428C', '#00ADE1', '#8FDCF5', '#C8102E'];
    var count = big ? 28 : 14;
    var frag = '';
    for (var i = 0; i < count; i++) {
      var c = colors[i % colors.length];
      var shape = i % 2 ? 'square' : 'flake';
      var size = 5 + Math.random() * 6;
      frag +=
        '<span class="fx-piece fx-' + shape + '" style="left:' + (Math.random() * 100).toFixed(1) + '%;' +
        'width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;color:' + c + ';' +
        '--drift:' + ((Math.random() - 0.5) * 120).toFixed(0) + 'px;' +
        'animation-delay:' + (Math.random() * (big ? 0.9 : 0.4)).toFixed(2) + 's;' +
        'animation-duration:' + (2.4 + Math.random() * 1.6).toFixed(2) + 's"></span>';
    }
    fx.innerHTML = frag;
    clearTimeout(GQ._fxTimer);
    GQ._fxTimer = setTimeout(function () { fx.innerHTML = ''; }, 5200);
  };
})();
