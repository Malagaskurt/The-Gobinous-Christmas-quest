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

  screens.club = function () {
    var A = K.accueil;
    return {
      key: 'club',
      bare: true,
      html:
        '<main class="club">' +
        '<div class="garland" aria-hidden="true"></div>' +
        stars(30) +
        '<div class="club-top">' + GQ.soundButton() + '</div>' +
        '<div class="club-hero">' +
        '<div class="club-logo">' + GQ.logo('clair') + '</div>' +
        '<h1 class="club-title" tabindex="-1"><span class="sr-only">' + t(A.surtitre) + ' ' + t(A.titre) + ' ' + t(A.sousTitre) + '</span>' +
        '<span class="club-the" aria-hidden="true">' + t(A.surtitre) + '</span>' +
        GQ.knit.text(String(A.titre).toUpperCase(), { alt: '', color: '#E4323A', outline: true, cls: 'club-knit' }) +
        '<span class="club-sub" aria-hidden="true">' + t(A.sousTitre) + '</span></h1>' +
        (A.edition ? '<p class="club-edition">' + GQ.pix('star') + t(A.edition) + GQ.pix('star') + '</p>' : '') +
        '</div>' +
        // Ville de Noël : le camion de Barnabé livre ses colis.
        '<div class="club-city" aria-hidden="true">' +
        '<span class="club-city-skyline"></span>' +
        '<span class="club-truck">' + GQ.knit.icon('truck', 'club-truck-img') + '</span>' +
        '<span class="club-parcel p1">' + GQ.knit.icon('gift', 'club-parcel-img') + '</span>' +
        '<span class="club-parcel p2">' + GQ.knit.icon('gift', 'club-parcel-img') + '</span>' +
        '</div>' +
        '<div class="club-cta"><button type="button" class="club-tap" data-action="to-programme">' + esc(A.appel) + icon('fleche') + '</button></div>' +
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
        (K.vlog ? '<a class="vlog-card" href="#/vlog">' + GQ.knit.icon('camera', 'vlog-card-ico') +
          '<span class="vlog-card-body"><span class="vlog-card-name">' + t(K.vlog.nom) + '</span><span class="vlog-card-text">' + t(K.vlog.texte) + '</span></span>' +
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
