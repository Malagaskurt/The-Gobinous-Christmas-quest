/* The Gobinous Christmas Club : page d'accueil du site (#/), programme
 * de l'événement (#/programme) et pages d'information de la Battle et du
 * Gift (#/battle, #/gift). Textes : config/club.js. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var K = GQ.cfg.club;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;
  var C = GQ.C;
  var screens = GQ.screens;
  var actions = GQ.actions;

  function stars(n) {
    var out = '';
    for (var i = 0; i < n; i++) {
      out += '<i style="left:' + ((i * 37 + 11) % 100) + '%;top:' + ((i * 53 + 7) % 62) + '%;animation-delay:' + ((i % 7) * 0.4).toFixed(1) + 's"></i>';
    }
    return '<div class="club-sky" aria-hidden="true">' + out + '</div>';
  }

  /* Bandeau des pages du Club : guirlande, retour, son. */
  function clubHeader(back) {
    return '<div class="garland" aria-hidden="true"></div>' +
      '<div class="club-bar">' +
      (back ? '<a class="back-link" href="#/' + back.href + '">' + icon('retour') + esc(back.label) + '</a>' : '<span></span>') +
      GQ.soundButton() + '</div>';
  }
  GQ.clubHeader = clubHeader;

  /* ------------------------------------------------------------------ */
  /* Accueil : « The Gobinous Christmas Club »                           */
  /* ------------------------------------------------------------------ */

  /* Grande scène 2D de l'accueil : ville de Noël de nuit (tours de La
   * Défense, Tour Saint-Gobain, maisons enneigées, sapins, réverbères) et le
   * camion de livraison des colis qui la traverse. Aplats, couleurs de la
   * charte uniquement. */
  function cityScene() {
    var W = 400, H = 300, out = '';
    var win = function (x, y, w, h, seed) {
      var s = '';
      for (var yy = y + 8; yy < h - 6; yy += 10) {
        for (var xx = x + 5; xx < x + w - 6; xx += 8) {
          var k = (xx * 7 + yy * 13 + seed) % 9;
          if (k < 3) s += '<rect x="' + xx + '" y="' + yy + '" width="4" height="5" fill="' + (k ? '#ffffff' : '#00ade1') + '" class="cw" style="animation-delay:' + ((k + yy) % 5) * 0.7 + 's"/>';
        }
      }
      return s;
    };
    // Tours du fond (La Défense).
    [[0, 120, 46], [50, 90, 34], [88, 140, 40], [290, 110, 38], [332, 70, 30], [366, 130, 40]].forEach(function (b, i) {
      out += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + (230 - b[1]) + '" fill="#12306b"/>' + win(b[0], b[1], b[2], 230, i * 11);
    });
    // Tour Saint-Gobain.
    out += '<path d="M200 230V46Q200 38 208 37L238 30V230Z" fill="#00ade1"/><path d="M238 30L248 36V230H238Z" fill="#17428c"/>';
    for (var y = 52; y < 228; y += 10) out += '<path d="M200 ' + y + 'H238" stroke="#ffffff" stroke-width=".7" opacity=".35"/>';
    out += '<circle cx="243" cy="27" r="2.5" fill="#e4323a" class="cb"/>';
    // Maisons enneigées et guirlandes.
    [[24, 196, 58], [128, 204, 56], [262, 198, 60]].forEach(function (h, i) {
      var x = h[0], y = h[1], w = h[2];
      out += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (250 - y) + '" fill="#17428c"/>' +
        '<path d="M' + (x - 6) + ' ' + y + 'L' + (x + w / 2) + ' ' + (y - 24) + 'L' + (x + w + 6) + ' ' + y + 'Z" fill="#ffffff"/>' +
        '<rect x="' + (x + 10) + '" y="' + (y + 12) + '" width="12" height="12" fill="#00ade1"/><rect x="' + (x + w - 22) + '" y="' + (y + 12) + '" width="12" height="12" fill="#00ade1"/>' +
        '<rect x="' + (x + w / 2 - 7) + '" y="' + (y + 30) + '" width="14" height="' + (220 - y) + '" fill="#0b1d45"/>';
      for (var g = 0; g < 6; g++) out += '<circle cx="' + (x + 4 + g * (w - 8) / 5) + '" cy="' + (y + 3) + '" r="2" fill="' + (g % 2 ? '#e4323a' : '#ffffff') + '" class="cl" style="animation-delay:' + g * 0.3 + 's"/>';
    });
    // Sapins et réverbères.
    [[100, 250, 26], [196, 252, 22], [340, 250, 28]].forEach(function (s) {
      out += '<path d="M' + s[0] + ' ' + (s[1] - s[2] * 2) + 'L' + (s[0] + s[2] * 0.6) + ' ' + s[1] + 'H' + (s[0] - s[2] * 0.6) + 'Z" fill="#00ade1"/>' +
        '<path d="M' + s[0] + ' ' + (s[1] - s[2] * 2.3) + 'l3 6h-6z" fill="#ffffff"/>';
    });
    [[60], [236], [330]].forEach(function (l) {
      out += '<rect x="' + l[0] + '" y="214" width="2.5" height="40" fill="#0b1d45"/><circle cx="' + (l[0] + 1.2) + '" cy="212" r="5" fill="#ffffff"/><circle cx="' + (l[0] + 1.2) + '" cy="212" r="12" fill="#ffffff" opacity=".12"/>';
    });
    // Chaussée enneigée.
    out += '<rect x="0" y="250" width="' + W + '" height="50" fill="#0e2a5e"/><path d="M0 250H' + W + '" stroke="#ffffff" stroke-width="5"/>' +
      '<path d="M0 276H' + W + '" stroke="#ffffff" stroke-width="2" stroke-dasharray="14 14" opacity=".5"/>';
    return '<svg class="city-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + out + '</svg>';
  }
  // Le décor sert aussi à l'écran de fin (js/q5-traque.js).
  GQ.citySvg = function () { return cityScene(); };
  GQ.cityInner = function () { return cityScene().replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''); };

  /* Accueil : glisser vers le haut (ou toucher la flèche) pour découvrir. */
  function swipeToDiscover() {
    var root = document.querySelector('.club');
    if (!root) return;
    var y0 = null;
    root.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (y0 == null) return;
      var dy = e.changedTouches[0].clientY - y0;
      y0 = null;
      if (dy < -50) GQ.go('programme');
    }, { passive: true });
    root.addEventListener('wheel', function (e) { if (e.deltaY > 40) GQ.go('programme'); }, { passive: true });
  }

  screens.club = function () {
    var A = K.accueil;
    return {
      key: 'club',
      bare: true,
      noFooter: true,
      after: swipeToDiscover,
      html:
        '<main class="club">' +
        '<div class="garland" aria-hidden="true"></div>' +
        stars(30) +
        // Logo en haut, centré, sur la même ligne que le bouton du son.
        '<div class="club-top"><div class="club-logo club-logo-top">' + GQ.logo('clair') + '</div>' + GQ.soundButton() + '</div>' +
        '<div class="club-hero">' +
        '<h1 class="club-title" tabindex="-1"><span class="sr-only">' + t(A.surtitre) + ' ' + t(A.titre) + ' ' + t(A.sousTitre) + '</span>' +
        '<span class="club-the" aria-hidden="true">' + t(A.surtitre) + '</span>' +
        GQ.knit.text(String(A.titre).toUpperCase(), { alt: '', color: '#E4323A', outline: true, cls: 'club-knit' }) +
        '<span class="club-sub" aria-hidden="true">' + t(A.sousTitre) + '</span></h1>' +
        (A.edition ? '<p class="club-edition">' + GQ.pix('star') + t(A.edition) + GQ.pix('star') + '</p>' : '') +
        '</div>' +
        // Ville de Noël : le camion de Barnabé traverse et livre ses colis.
        '<div class="club-city" aria-hidden="true">' + cityScene() +
        '<span class="club-truck">' + GQ.knit.icon('truck', 'club-truck-img') + '</span>' +
        '<span class="club-parcel p1">' + GQ.knit.icon('gift', 'club-parcel-img') + '</span>' +
        '<span class="club-parcel p2">' + GQ.knit.icon('gift', 'club-parcel-img') + '</span>' +
        '<span class="club-snow"></span>' +
        '</div>' +
        '<button type="button" class="club-down" data-action="to-programme" aria-label="' + esc(A.appel) + '">' +
        '<span>' + esc(A.appel) + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg></button>' +
        '</main>',
    };
  };

  actions['to-programme'] = function () { GQ.go('programme'); };
  actions['go-vlog'] = function () { GQ.go('vlog'); };

  /* ------------------------------------------------------------------ */
  /* Programme : les temps forts de l'événement                          */
  /* ------------------------------------------------------------------ */

  screens.programme = function () {
    var P = K.programme;
    var cards = P.temps.map(function (x, i) {
      // Carte tuile colorée : « Gobi'Christmas » en surtitre, le nom en
      // police gaming, le texte court, puis « Découvrir ».
      var m = String(x.nom).match(/^(.*?Christmas)\s+(.*)$/i);
      return '<li>' +
        '<a class="prog-card prog-' + esc(x.id) + '" href="#/' + esc(x.id) + '">' +
        '<span class="prog-num" aria-hidden="true">' + ('0' + (i + 1)).slice(-2) + '</span>' +
        '<span class="prog-kicker">' + t(m ? m[1] : '') + '</span>' +
        '<span class="prog-name">' + t(m ? m[2] : x.nom) + '</span>' +
        '<span class="prog-text">' + t(x.texte) + '</span>' +
        '<span class="prog-art">' + GQ.knit.icon(x.icone || 'star', 'prog-ico') + '</span>' +
        (x.bouton ? '<span class="prog-go">' + t(x.bouton) + icon('fleche') + '</span>' : '') +
        '</a></li>';
    }).join('');
    return {
      key: 'programme',
      bare: true,
      html:
        clubHeader({ href: '', label: 'Accueil' }) +
        '<main class="screen screen-plain screen-programme">' +
        '<div class="center-head">' + C.knitTitle(P.titre) +
        (P.intro ? '<p class="prog-intro">' + t(P.intro) + '</p>' : '') + '</div>' +
        '<ol class="prog">' + cards + '</ol>' +
        // Le Vlog : même carte que les temps forts, juste en dessous.
        (K.vlog ? '<a class="vlog-card" href="#/vlog">' +
          '<span class="prog-num prog-num-ico" aria-hidden="true">' + GQ.icon('photo') + '</span>' +
          '<span class="prog-kicker">Photos &amp; vidéos</span>' +
          '<span class="prog-name">' + t(K.vlog.nom) + '</span>' +
          '<span class="prog-text">' + t(K.vlog.texte) + '</span>' +
          '<span class="prog-art">' + GQ.knit.icon('camera', 'prog-ico') + '</span>' +
          '<span class="prog-go">' + t(K.vlog.bouton) + icon('fleche') + '</span></a>' : '') +
        '</main>',
    };
  };

  /* ------------------------------------------------------------------ */
  /* Battle et Gift : pages d'information                                */
  /* ------------------------------------------------------------------ */

  function info(id) {
    var I = K[id];
    var temps = K.programme.temps.filter(function (x) { return x.id === id; })[0] || {};
    return {
      key: 'club-' + id,
      bare: true,
      tone: id === 'battle' ? 'red' : null,
      html:
        clubHeader({ href: 'programme', label: 'Programme' }) +
        '<main class="screen screen-plain screen-info">' +
        '<div class="center-head">' + GQ.knit.icon(temps.icone || 'star', 'head-ico') +
        '<p class="kicker">Gobi\'Christmas</p>' + C.knitTitle(I.titre.replace(/^(Gobi'|Gobi’)?Christmas\s+/i, '')) + '</div>' +
        GQ.elfTalk('<p class="elf-talk-big">' + t(I.bulle) + '</p><p>' + t(I.texte) + '</p>') +
        '<ul class="info-list">' + I.points.map(function (p) {
          return '<li><span class="info-ico">' + GQ.pix(p.icone) + '</span><span>' + t(p.texte) + '</span></li>';
        }).join('') + '</ul>' +
        C.cta('<a class="btn btn-red" href="#/programme">' + icon('retour') + 'Retour au programme</a>') +
        '</main>',
    };
  }
  screens.battle = function () { return info('battle'); };
  // Le Secret Santa fait désormais partie du Wrap-Up.
  screens.gift = function () { GQ.redirect('wrapup'); return { key: 'redirect', html: '' }; };
})();
