/* La map de la quête : mini-quartier d'affaires de nuit, inspiré de La
 * Défense (Grande Arche, tours de verre, esplanade). Au centre, la Tour
 * Saint-Gobain : les étapes y sont placées à leur étage, reliées par
 * l'ascenseur lumineux ; l'étape 1 est à La Verrière, le point de base.
 * Elle sert de hub avant le départ (écran « La map ») et pendant le jeu
 * (bouton de progression en haut de l'écran). Animée : fenêtres qui
 * scintillent, voitures sur la voie, balise de l'équipe sur l'étape en
 * cours. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;

  var W = 360, H = 560;
  var GROUND = 470;          // pied des tours
  var TOWER = { x: 206, w: 52, top: 54 };
  var FLOOR_PX = 9.4;        // hauteur d'un étage sur la Tour
  var VERRIERE_Y = 430;


  /* Position de chaque étape sur la map. */
  // Étapes réparties régulièrement le long de la Tour (aucun étage
  // affiché : la map ne doit rien dévoiler de l'enquête). L'étape 1 est à
  // La Verrière, à l'intérieur de la Tour, dans le bas.
  function spot(i) {
    return { x: TOWER.x + TOWER.w / 2, y: VERRIERE_Y - i * 84 };
  }

  /* Bâtiments du quartier : [x, haut, largeur, teinte]. */
  var BACK = [[6, 250, 34, 0], [44, 300, 26, 1], [150, 214, 40, 0], [272, 236, 34, 1], [310, 286, 44, 0]];
  var MID = [[0, 330, 46, 2], [118, 300, 30, 2], [178, 350, 24, 3], [266, 330, 30, 3], [300, 360, 40, 2], [330, 320, 30, 3]];

  function windows(x, top, w, seed, color) {
    var out = '';
    for (var y = top + 10; y < GROUND - 10; y += 9) {
      for (var wx = x + 5; wx < x + w - 5; wx += 7) {
        var k = (wx * 13 + y * 7 + seed * 5) % 11;
        if (k < 3) {
          out += '<rect x="' + wx + '" y="' + y + '" width="3.4" height="4" rx=".8" fill="' + color + '" class="m-win" style="animation-delay:' + ((k * 0.7 + (y % 5)) % 4).toFixed(1) + 's"/>';
        }
      }
    }
    return out;
  }

  function building(b, layer) {
    var fills = ['url(#m-b0)', 'url(#m-b1)', 'url(#m-b2)', 'url(#m-b3)'];
    var x = b[0], top = b[1], w = b[2];
    return '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (GROUND - top + 2) + '" rx="3" fill="' + fills[b[3]] + '"/>' +
      windows(x, top, w, x + layer, layer ? '#f6efe2' : '#8fe3ff');
  }

  /* La Grande Arche (au fond, à gauche). */
  function arche() {
    return '<g class="m-arche" opacity=".85">' +
      '<path d="M70 252h66v62H70z M82 264v50h42v-50z" fill="url(#m-b1)" fill-rule="evenodd"/>' +
      '<path d="M70 252h66l-6 -6H76z" fill="#2a5db0"/>' +
      '</g>';
  }

  /* La Tour Saint-Gobain : verre bleu, sommet en biseau. */
  function tower() {
    var x = TOWER.x, w = TOWER.w, top = TOWER.top;
    var lines = '';
    for (var y = top + 18; y < GROUND; y += FLOOR_PX * 2) {
      lines += '<path d="M' + x + ' ' + y.toFixed(1) + 'H' + (x + w) + '" stroke="#fff" stroke-width=".5" opacity=".28"/>';
    }
    return '<g class="m-tower">' +
      '<path d="M' + x + ' ' + GROUND + 'V' + (top + 16) + 'Q' + x + ' ' + (top + 8) + ' ' + (x + 8) + ' ' + (top + 6) + 'L' + (x + w) + ' ' + top + 'V' + GROUND + 'Z" fill="url(#m-glass)"/>' +
      '<path d="M' + (x + w) + ' ' + top + 'L' + (x + w + 10) + ' ' + (top + 8) + 'V' + GROUND + 'H' + (x + w) + 'Z" fill="#123a80"/>' +
      lines +
      '<path d="M' + (x + 10) + ' ' + (GROUND - 4) + 'L' + (x + 30) + ' ' + (top + 12) + '" stroke="#fff" stroke-width="5" opacity=".14"/>' +
      '<circle cx="' + (x + w - 3) + '" cy="' + (top - 2) + '" r="2.2" fill="#e4323a" class="m-beacon"/>' +
      '<text x="' + (x + w / 2) + '" y="' + (top - 10) + '" text-anchor="middle" class="m-tag">TOUR SAINT-GOBAIN</text>' +
      '</g>';
  }

  /* La Verrière : grand plateau vitré, à l'intérieur de la Tour (le point
   * de base, d'où l'on part et où l'on revient). */
  function verriere() {
    var x = TOWER.x - 4, w = TOWER.w + 18, y = VERRIERE_Y - 13;
    return '<g class="m-verriere">' +
      '<rect x="' + (x - 6) + '" y="' + (y - 6) + '" width="' + (w + 12) + '" height="38" rx="10" fill="#8fe3ff" opacity=".16" class="m-halo"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="26" rx="4" fill="url(#m-verre)" stroke="#e3f6fc" stroke-width="1.2"/>' +
      '<path d="M' + (x + 12) + ' ' + y + 'v26M' + (x + 26) + ' ' + y + 'v26M' + (x + 40) + ' ' + y + 'v26M' + (x + 54) + ' ' + y + 'v26" stroke="#fff" stroke-width=".7" opacity=".5"/>' +
      '<text x="' + (x + w + 8) + '" y="' + (y + 11) + '" class="m-tag m-tag-base">LA VERRIÈRE</text>' +
      '<text x="' + (x + w + 8) + '" y="' + (y + 21) + '" class="m-tag">POINT DE BASE</text>' +
      '</g>';
  }

  /* Esplanade, voie et voitures. */
  function ground() {
    return '<path d="M0 ' + GROUND + 'H' + W + 'V' + H + 'H0Z" fill="url(#m-ground)"/>' +
      '<path d="M0 548H' + W + '" stroke="#2a5db0" stroke-width="14" opacity=".55"/>' +
      '<path d="M0 548H' + W + '" stroke="#f6efe2" stroke-width="1" stroke-dasharray="8 10" opacity=".45"/>' +
      '<g class="m-car m-car-a"><rect x="0" y="541" width="22" height="9" rx="4" fill="#e4323a"/><rect x="5" y="537" width="11" height="6" rx="2.5" fill="#8fe3ff"/><circle cx="21" cy="545" r="1.6" fill="#fff"/></g>' +
      '<g class="m-car m-car-b"><rect x="0" y="544" width="26" height="10" rx="4" fill="#2fc0ee"/><rect x="8" y="540" width="14" height="6" rx="2.5" fill="#e3f6fc"/><circle cx="24.5" cy="549" r="1.6" fill="#fff"/></g>';
  }

  function state(n) {
    var s = GQ.state;
    if (s.finished || n < s.quest || s.phase[n] === 'done') return 'done';
    if (n === s.quest && s.rulesOk) return 'current';
    if (n === 1 && !s.rulesOk) return 'current';
    return 'todo';
  }

  /* Étiquette d'une étape : à gauche de la Tour (étape 1 : à droite de
   * La Verrière). */

  function marker(i) {
    var n = i + 1;
    var P = GQ.cfg.textes.plateau;
    var st = state(n);
    var p = spot(i);
    var name = String(P.etapes[i] || GQ.questCfg(n).titre).toUpperCase();
    var lx = TOWER.x - 22, ly = p.y + 3, anchor = 'end';
    var lead = '<path d="M' + (lx + 4) + ' ' + (ly - 4) + 'H' + (p.x - 10) + '" class="m-lead"/>';
    var dot = st === 'done' ? '<path d="M' + (p.x - 4) + ' ' + p.y + 'l3 3 5-6" class="m-check"/>' : '<text x="' + p.x + '" y="' + (p.y + 3.6) + '" text-anchor="middle" class="m-num">' + n + '</text>';
    return '<g class="m-step is-' + st + '" style="animation-delay:' + (0.6 + i * 0.25).toFixed(2) + 's">' +
      lead +
      (st === 'current' ? '<circle cx="' + p.x + '" cy="' + p.y + '" r="9" class="m-ping"/>' : '') +
      '<circle cx="' + p.x + '" cy="' + p.y + '" r="9" class="m-dot"/>' + dot +
      '<text x="' + lx + '" y="' + (ly - 9) + '" text-anchor="' + anchor + '" class="m-kicker">ÉTAPE ' + n + '</text>' +
      '<text x="' + lx + '" y="' + (ly + 4) + '" text-anchor="' + anchor + '" class="m-name">' + esc(name) + '</text>' +
      '</g>';
  }

  /* Ascenseur lumineux : de La Verrière à la dernière étape. */
  function route() {
    var a = spot(0), b = spot(4);
    return 'M' + a.x + ' ' + a.y + 'V' + b.y;
  }

  function html(opts) {
    opts = opts || {};
    var P = GQ.cfg.textes.plateau;
    var s = GQ.state;
    var cur = Math.min(5, Math.max(1, s.quest || 1));
    var here = spot(cur - 1);
    var stars = '';
    for (var i = 0; i < 26; i++) {
      stars += '<circle cx="' + ((i * 67) % W) + '" cy="' + ((i * 41) % 200 + 6) + '" r="' + (i % 4 ? 0.9 : 1.6) + '" class="m-star" style="animation-delay:' + ((i * 0.31) % 3).toFixed(2) + 's"/>';
    }
    return (
      '<div class="map' + (opts.compact ? ' map-compact' : '') + '" data-board>' +
      '<svg class="map-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(P.description) + '">' +
      '<defs>' +
      '<linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081634"/><stop offset=".7" stop-color="#12306b"/><stop offset="1" stop-color="#1d4fa0"/></linearGradient>' +
      '<linearGradient id="m-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a6e9ff"/><stop offset=".45" stop-color="#2fc0ee"/><stop offset="1" stop-color="#1d5fae"/></linearGradient>' +
      '<linearGradient id="m-verre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3f6fc" stop-opacity=".95"/><stop offset="1" stop-color="#2fc0ee" stop-opacity=".55"/></linearGradient>' +
      '<linearGradient id="m-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4fa0"/><stop offset="1" stop-color="#0b1d45"/></linearGradient>' +
      '<linearGradient id="m-b0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3a78"/><stop offset="1" stop-color="#0f2556"/></linearGradient>' +
      '<linearGradient id="m-b1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23488f"/><stop offset="1" stop-color="#12306b"/></linearGradient>' +
      '<linearGradient id="m-b2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a5db0"/><stop offset="1" stop-color="#17428c"/></linearGradient>' +
      '<linearGradient id="m-b3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a74c9"/><stop offset="1" stop-color="#1b4a99"/></linearGradient>' +
      '<radialGradient id="m-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e3f6fc" stop-opacity=".55"/><stop offset="1" stop-color="#e3f6fc" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="' + W + '" height="' + H + '" rx="22" fill="url(#m-sky)"/>' +
      '<circle cx="300" cy="70" r="46" fill="url(#m-moon)"/><circle cx="300" cy="70" r="13" fill="#e3f6fc" opacity=".9"/>' +
      stars +
      '<g class="m-layer m-back">' + BACK.map(function (b) { return building(b, 0); }).join('') + arche() + '</g>' +
      tower() +
      '<g class="m-layer m-mid">' + MID.map(function (b) { return building(b, 1); }).join('') + '</g>' +
      ground() +
      verriere() +
      '<path d="' + route() + '" class="m-route-glow"/>' +
      '<path d="' + route() + '" class="m-route" pathLength="100"/>' +
      [0, 1, 2, 3, 4].map(marker).join('') +
      '<g class="m-team" style="transform:translate(' + here.x + 'px,' + (here.y - 12) + 'px)"><image href="' + GQ.knit.src('pin') + '" x="-11" y="-26" width="22" height="26"/></g>' +
      '</svg></div>'
    );
  }

  GQ.board = {
    html: html,
    animate: function () { /* animations en CSS */ },
  };

  /* La map pendant le jeu : bouton de progression en haut de l'écran. */
  GQ.actions = GQ.actions || {};
  GQ.actions['show-map'] = function () {
    var P = GQ.cfg.textes.plateau;
    GQ.modal({ sheet: true, title: P.titre, html: html({ compact: true }), cancel: GQ.cfg.textes.regles.boutonFermer || 'Fermer' });
  };
})();
