/* Plateau de jeu animé (écran « Comment jouer ? »), esprit arcade :
 * une carte de niveaux en serpentin façon jeu de l'oie, les 5 quêtes,
 * un QR code entre chaque étape, des décors en pixel art, un bandeau de
 * score, et le lutin qui avance case par case jusqu'à la hotte. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 360, H = 640;
  var PATH = 'M30 50 H260 A65 65 0 0 1 260 180 H100 A65 65 0 0 0 100 310 H260 A65 65 0 0 1 260 440 H100 A65 65 0 0 0 100 570 H300';
  var CELL = 25; // une case = 20 unités + 5 d'interstice (voir .b-cells)

  var STATIONS = [
    { x: 172, y: 50 },
    { x: 180, y: 180 },
    { x: 180, y: 310 },
    { x: 180, y: 440 },
    { x: 300, y: 570 },
  ];
  // Déplacements entre deux quêtes (milieu des virages).
  var LINKS = [
    { x: 325, y: 115, kind: 'qr' },
    { x: 35, y: 245, kind: 'qr' },
    { x: 325, y: 375, kind: 'qr' },
    { x: 35, y: 505, kind: 'pin' },
  ];
  // Décors pixel (dans les espaces libres des boucles).
  var DECOR = [
    { name: 'tree', x: 34, y: 92, w: 40 },
    { name: 'dice', x: 300, y: 230, w: 30 },
    { name: 'tower', x: 38, y: 340, w: 30 },
    { name: 'flake', x: 302, y: 492, w: 30 },
    { name: 'star', x: 318, y: 6, w: 26 },
    { name: 'tree', x: 26, y: 596, w: 32 },
  ];

  function text(x, y, cls, content, anchor) {
    return '<text x="' + x + '" y="' + y + '" class="' + cls + '" text-anchor="' + (anchor || 'middle') + '">' + content + '</text>';
  }

  function pop(x, y, delay, inner, cls) {
    return '<g transform="translate(' + x + ' ' + y + ')"><g class="b-pop ' + (cls || '') + '" style="animation-delay:' + delay.toFixed(2) + 's">' + inner + '</g></g>';
  }

  function linkIcon(l, i) {
    var inner = l.kind === 'qr'
      ? '<path d="M-7 -7h5v5h-5zM2 -7h5v5h-5zM-7 2h5v5h-5zM2 2h2v2h-2zM5 5h2v2h-2zM2 5h2M5 2h2" class="b-qr"/>'
      : '<path d="M0 8s6-5.4 6-10a6 6 0 0 0-12 0c0 4.6 6 10 6 10z" class="b-pin"/><circle cx="0" cy="-2" r="2" class="b-pin-dot"/>';
    return pop(l.x, l.y, 0.9 + i * 0.35, '<rect x="-15" y="-15" width="30" height="30" rx="4" class="b-link-bg"/>' + inner);
  }

  function hud() {
    var P = GQ.cfg.parametres;
    var minutes = (P.chrono && P.chrono.dureeMinutes) || 30;
    return (
      '<div class="hud" aria-hidden="true">' +
      '<span class="hud-p1">P1 <b>' + esc(GQ.state.team || '') + '</b></span>' +
      '<span>' + GQ.icon('etoile') + 'JOKER ×1</span>' +
      '<span>' + GQ.icon('chrono') + ('0' + minutes).slice(-2) + ':00</span>' +
      '</div>'
    );
  }

  GQ.board = {
    html: function () {
      var P = GQ.cfg.textes.plateau;
      var stations = STATIONS.map(function (s, i) {
        var n = i + 1;
        var last = n === STATIONS.length;
        var delay = 0.6 + i * 0.35;
        var lx = last ? 230 : 180;
        var ly = s.y + 42;
        return (
          pop(s.x, s.y, delay,
            last
              ? '<rect x="-27" y="-27" width="54" height="54" rx="6" class="b-st-gift"/>' +
                '<image href="' + GQ.pixel.src('gift') + '" x="-17" y="-18" width="34" height="34" style="image-rendering:pixelated"/>'
              : '<rect x="-23" y="-23" width="46" height="46" rx="6" class="b-st"/>' + text(0, 10, 'b-st-num', n)) +
          '<g class="b-label b-pop" style="animation-delay:' + delay.toFixed(2) + 's">' +
          text(lx, ly, 'b-lab-kicker', esc(P.quete.replace('{n}', n))) +
          text(lx, ly + 17, 'b-lab-name', esc(GQ.questCfg(n).titre)) +
          text(lx, ly + 33, 'b-lab-note', esc(P.notes[i] || '')) +
          '</g>'
        );
      }).join('');

      var decor = DECOR.map(function (d, i) {
        return '<g class="b-pop" style="animation-delay:' + (1.4 + i * 0.12).toFixed(2) + 's"><image class="b-decor" style="animation-delay:' + (i * 0.3).toFixed(1) + 's" href="' + GQ.pixel.src(d.name) + '" x="' + d.x + '" y="' + d.y + '" width="' + d.w + '" height="' + d.w * 1.3 + '" preserveAspectRatio="xMidYMax meet"/></g>';
      }).join('');

      var svg =
        '<svg class="board-svg" viewBox="0 0 ' + W + ' ' + (H + 30) + '" role="img" aria-label="' + esc(P.description) + '">' +
        '<defs><mask id="b-reveal"><path d="' + PATH + '" class="b-reveal" pathLength="100"/></mask></defs>' +
        decor +
        '<g mask="url(#b-reveal)">' +
        '<path d="' + PATH + '" class="b-road-shadow"/>' +
        '<path d="' + PATH + '" class="b-road"/>' +
        '<path d="' + PATH + '" class="b-cells"/>' +
        '<path d="' + PATH + '" class="b-cells-special"/>' +
        '</g>' +
        '<path d="' + PATH + '" class="b-track" id="b-track"/>' +
        pop(30, 50, 0.3, '<rect x="-27" y="22" width="54" height="19" rx="3" class="b-flag"/>' + text(0, 37, 'b-flag-txt', esc(P.depart)) +
          '<rect x="-9" y="-9" width="18" height="18" class="b-start-dot"/>') +
        LINKS.map(linkIcon).join('') +
        stations +
        '<image class="b-elf" href="' + GQ.pixel.src('elfWalk1') + '" width="36" height="44" x="12" y="8" style="image-rendering:pixelated"/>' +
        '</svg>';

      return (
        '<div class="board" data-board>' + hud() + '<div class="board-plate">' + svg + '</div></div>' +
        '<p class="board-legend"><span class="board-legend-ico">' + GQ.icon('qr') + '</span>' + GQ.t(P.legende) + '</p>'
      );
    },

    /* Le lutin avance case par case, en sautillant, comme un pion.
     * Un appui sur le plateau relance la partie de démonstration. */
    animate: function () {
      var root = document.querySelector('[data-board]');
      if (!root) return;
      var track = root.querySelector('#b-track');
      var elf = root.querySelector('.b-elf');
      var total = track.getTotalLength();
      var cells = Math.floor((total - 10) / CELL);
      var timer;

      function at(len) { return track.getPointAtLength(Math.max(0, Math.min(total, len))); }

      function draw(x, y, flip, pose) {
        elf.setAttribute('href', GQ.pixel.src(pose));
        elf.setAttribute('x', (x - 18).toFixed(1));
        elf.setAttribute('y', (y - 40).toFixed(1));
        elf.setAttribute('transform', flip ? 'translate(' + (2 * x).toFixed(1) + ' 0) scale(-1 1)' : '');
      }

      function run(delay) {
        clearTimeout(timer);
        var p0 = at(10);
        if (reduceMotion) { var pe = at(total); draw(pe.x, pe.y, false, 'elfWave'); return; }
        draw(p0.x, p0.y, false, 'elfWalk1');
        var cell = 0;
        timer = setTimeout(function hop() {
          if (!document.contains(elf)) return;
          if (cell >= cells) {
            var end = at(total);
            draw(end.x, end.y, false, 'elfWave');
            return;
          }
          var a = at(10 + cell * CELL), b = at(10 + (cell + 1) * CELL);
          var flip = b.x < a.x - 0.5;
          var start = null;
          requestAnimationFrame(function step(ts) {
            if (start === null) start = ts;
            var f = Math.min(1, (ts - start) / 150);
            var x = a.x + (b.x - a.x) * f;
            var y = a.y + (b.y - a.y) * f - Math.sin(Math.PI * f) * 9;
            draw(x, y, flip, f < 1 ? 'elfWalk2' : 'elfWalk1');
            if (f < 1) requestAnimationFrame(step);
            else { cell++; timer = setTimeout(hop, 40); }
          });
        }, delay);
      }

      run(1500);
      root.addEventListener('click', function () { run(0); });
    },
  };
})();
