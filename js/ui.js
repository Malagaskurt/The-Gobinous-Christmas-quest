/* Composants d'interface : illustrations SVG, en-tête, messages,
 * fenêtres de confirmation, animations. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var T = GQ.cfg.textes;
  var t = GQ.t;
  var esc = GQ.esc;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ */
  /* Illustrations                                                       */
  /* ------------------------------------------------------------------ */

  function starPoints(cx, cy, R, r, n) {
    var pts = [];
    n = n || 5;
    for (var i = 0; i < n * 2; i++) {
      var a = (Math.PI / n) * i - Math.PI / 2;
      var rad = i % 2 ? r : R;
      pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }

  function flake(x, y, s, color, op) {
    var d = '';
    for (var i = 0; i < 3; i++) {
      var a = (Math.PI / 3) * i;
      var dx = Math.cos(a) * s, dy = Math.sin(a) * s;
      d += 'M' + (x - dx).toFixed(1) + ' ' + (y - dy).toFixed(1) + 'L' + (x + dx).toFixed(1) + ' ' + (y + dy).toFixed(1);
    }
    return '<path d="' + d + '" stroke="' + color + '" stroke-width="1.6" stroke-linecap="round" opacity="' + (op || 1) + '"/>';
  }

  /* Facette de sapin « verre » : moitié gauche foncée, moitié droite
   * plus claire, reflet blanc. */
  function tier(apexY, baseY, half, dark, light) {
    var cx = 130;
    return (
      '<polygon points="' + cx + ',' + apexY + ' ' + (cx - half) + ',' + baseY + ' ' + cx + ',' + baseY + '" fill="' + dark + '"/>' +
      '<polygon points="' + cx + ',' + apexY + ' ' + cx + ',' + baseY + ' ' + (cx + half) + ',' + baseY + '" fill="' + light + '"/>' +
      '<polygon points="' + cx + ',' + apexY + ' ' + (cx + half * 0.28) + ',' + baseY + ' ' + (cx + half * 0.5) + ',' + baseY + '" fill="#fff" opacity=".16"/>' +
      '<polyline points="' + (cx - half) + ',' + baseY + ' ' + cx + ',' + apexY + ' ' + (cx + half) + ',' + baseY + '" fill="none" stroke="#00ADE1" stroke-width="1.2" opacity=".55"/>'
    );
  }

  var ART = {};

  ART.hero = function () {
    return (
      '<svg class="hero-art" viewBox="0 0 260 230" role="img" aria-label="Sapin de Noël stylisé et cadeaux">' +
      '<defs><radialGradient id="hglow" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#E3F4FC"/><stop offset="1" stop-color="#F4F8FD" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="130" cy="118" r="112" fill="url(#hglow)"/>' +
      // facettes de verre en arrière-plan
      '<polygon points="22,150 62,96 78,168" fill="#E8F0FA"/>' +
      '<polygon points="200,60 246,104 214,140" fill="#E6F6FC"/>' +
      '<polygon points="196,150 238,132 230,186" fill="#EDF3FB"/>' +
      '<polygon points="38,62 70,40 64,84" fill="#EEF5FC"/>' +
      flake(40, 120, 6, '#9DB7DD', 0.9) + flake(222, 82, 5, '#00ADE1', 0.7) + flake(214, 170, 4, '#9DB7DD', 0.8) +
      flake(56, 52, 4, '#00ADE1', 0.6) + flake(28, 186, 3.5, '#9DB7DD', 0.7) + flake(236, 120, 3, '#9DB7DD', 0.7) +
      '<ellipse cx="130" cy="203" rx="100" ry="7" fill="#DCE8F6"/>' +
      '<rect x="122" y="184" width="16" height="16" rx="2" fill="#0B1F45"/>' +
      tier(104, 188, 66, '#0E2A5E', '#1F4F9C') +
      tier(72, 146, 50, '#17428C', '#2D66BA') +
      tier(44, 104, 35, '#1E57AD', '#3D7BD0') +
      // décorations
      '<circle cx="104" cy="170" r="4.5" fill="#C8102E"/><circle cx="156" cy="132" r="4" fill="#C8102E"/><circle cx="118" cy="96" r="3.5" fill="#C8102E"/>' +
      '<circle cx="150" cy="176" r="3.5" fill="#fff"/><circle cx="108" cy="134" r="3" fill="#fff"/><circle cx="140" cy="90" r="2.6" fill="#fff"/>' +
      '<circle cx="128" cy="160" r="3" fill="#00ADE1"/><circle cx="132" cy="118" r="2.6" fill="#00ADE1"/>' +
      // étoile
      '<polygon class="hero-star" points="' + starPoints(130, 34, 15, 6.5) + '" fill="#00ADE1"/>' +
      '<polygon points="' + starPoints(130, 34, 7, 3) + '" fill="#fff" opacity=".85"/>' +
      // cadeau droit
      '<rect x="168" y="170" width="44" height="32" rx="3" fill="#17428C"/>' +
      '<rect x="164" y="162" width="52" height="11" rx="2" fill="#2D66BA"/>' +
      '<rect x="187" y="162" width="6" height="40" fill="#C8102E"/>' +
      '<path d="M190 162c-10-12-22-6-14 0zM190 162c10-12 22-6 14 0z" fill="#C8102E"/>' +
      // cadeau gauche
      '<rect x="56" y="180" width="32" height="22" rx="3" fill="#fff" stroke="#9DB7DD" stroke-width="1.5"/>' +
      '<rect x="69" y="180" width="6" height="22" fill="#00ADE1"/>' +
      '<rect x="56" y="188" width="32" height="5" fill="#00ADE1" opacity=".5"/>' +
      '</svg>'
    );
  };

  ART.gift = function (cls) {
    return (
      '<svg class="' + (cls || '') + '" viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="56" fill="#E8F0FA"/>' +
      '<polygon points="' + starPoints(60, 18, 9, 4) + '" fill="#00ADE1"/>' +
      '<rect x="28" y="52" width="64" height="44" rx="4" fill="#17428C"/>' +
      '<rect x="22" y="40" width="76" height="16" rx="3" fill="#2D66BA"/>' +
      '<rect x="56" y="40" width="8" height="56" fill="#C8102E"/>' +
      '<path d="M60 40c-14-18-32-8-20 0zM60 40c14-18 32-8 20 0z" fill="#C8102E"/>' +
      '<polygon points="28,96 50,52 60,96" fill="#fff" opacity=".08"/>' +
      '</svg>'
    );
  };

  ART.check = function () {
    return (
      '<svg class="check-art" viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="54" fill="#E6F6FC"/>' +
      '<circle class="check-ring" cx="60" cy="60" r="40" fill="#17428C"/>' +
      '<path class="check-mark" d="M42 61l12 12 25-27" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<polygon points="' + starPoints(100, 22, 7, 3) + '" fill="#00ADE1"/>' +
      '<polygon points="' + starPoints(18, 88, 5, 2.2) + '" fill="#C8102E"/>' +
      flake(22, 30, 5, '#9DB7DD') + flake(102, 96, 4, '#9DB7DD') +
      '</svg>'
    );
  };

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
  };

  GQ.icon = function (name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.etoile) + '</svg>';
  };
  GQ.art = ART;

  /* ------------------------------------------------------------------ */
  /* En-tête des écrans de jeu                                           */
  /* ------------------------------------------------------------------ */

  GQ.brandSlot = function () {
    var m = GQ.cfg.parametres.marque || {};
    if (m.logo) return '<img class="brand-logo" src="' + esc(m.logo) + '" alt="' + esc(m.logoAlt || '') + '">';
    if (GQ.test.isActive()) return '<span class="brand-placeholder" title="Emplacement réservé au logo (config/parametres.js → marque.logo)">Logo</span>';
    return '';
  };

  GQ.header = function (currentQuest) {
    var s = GQ.state;
    var steps = '';
    for (var n = 1; n <= GQ.QUEST_COUNT; n++) {
      var cls = s.finished || n < s.quest ? 'done' : n === s.quest ? 'current' : '';
      steps +=
        '<li class="step ' + cls + '"' + (n === currentQuest ? ' aria-current="step"' : '') + '>' +
        '<span class="step-dot">' + (cls === 'done' ? GQ.icon('valide') : n) + '</span>' +
        '<span class="sr-only">' + esc(T.general.quete) + ' ' + n + (cls === 'done' ? ' (terminée)' : '') + '</span></li>';
    }
    var used = s.joker.used;
    return (
      '<header class="topbar">' +
      '<div class="topbar-row">' +
      '<a class="brand" href="#/" aria-label="Accueil">' + GQ.brandSlot() +
      '<span class="brand-name">Gobinous <b>Christmas Quest</b></span></a>' +
      '<button type="button" class="link-btn" data-action="show-rules">' + GQ.icon('livre') + esc(T.general.regles) + '</button>' +
      '</div>' +
      '<div class="topbar-row topbar-sub">' +
      '<span class="team-name" title="' + esc(s.team) + '">' + esc(T.general.equipe) + ' : <b>' + esc(s.team) + '</b></span>' +
      '<span class="joker-chip ' + (used ? 'is-used' : '') + '">' + GQ.icon('etoile') +
      esc(used ? T.joker.statutUtilise : T.joker.statutDisponible) + '</span>' +
      '</div>' +
      '<ol class="stepper" aria-label="Progression">' + steps + '</ol>' +
      '</header>'
    );
  };

  /* ------------------------------------------------------------------ */
  /* Messages courts (toast)                                             */
  /* ------------------------------------------------------------------ */

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
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        (opts.icon ? '<div class="modal-icon">' + GQ.icon(opts.icon) + '</div>' : '') +
        '<h2 id="modal-title" class="modal-title">' + t(opts.title) + '</h2>' +
        (opts.html || (opts.text ? '<p>' + t(opts.text) + '</p>' : '')) +
        '<div class="modal-actions">' +
        (opts.confirm ? '<button type="button" class="btn btn-primary" data-modal-ok>' + esc(opts.confirm) + '</button>' : '') +
        (opts.cancel ? '<button type="button" class="btn btn-secondary" data-modal-cancel>' + esc(opts.cancel) + '</button>' : '') +
        '</div></div>';
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

  GQ.rulesHtml = function () {
    var R = T.regles;
    return (
      '<ol class="rules">' +
      R.liste.map(function (r, i) {
        return '<li><span class="rule-num">' + (i + 1) + '</span><p><strong>' + t(r.titre) + '</strong> ' + t(r.texte) + '</p></li>';
      }).join('') +
      '</ol>' +
      '<p class="rules-goal">' + t(R.objectif) + '</p>'
    );
  };

  /* ------------------------------------------------------------------ */
  /* Animations                                                          */
  /* ------------------------------------------------------------------ */

  GQ.celebrate = function (big) {
    if (reduceMotion) return;
    var fx = document.getElementById('fx');
    var colors = ['#17428C', '#00ADE1', '#2D66BA', '#9DB7DD', '#ffffff', '#C8102E'];
    var count = big ? 42 : 22;
    var frag = '';
    for (var i = 0; i < count; i++) {
      var c = colors[i % colors.length];
      var shape = i % 3 === 0 ? 'flake' : i % 3 === 1 ? 'dot' : 'diamond';
      var size = 6 + Math.random() * (big ? 10 : 7);
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
