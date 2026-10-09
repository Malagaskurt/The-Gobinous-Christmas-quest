/* Plateau de jeu animé (écran « Comment jouer ? ») : un parcours en
 * serpentin façon jeu de l'oie, les 5 quêtes, un QR code entre chaque
 * étape, et le lutin qui parcourt le plateau jusqu'à la hotte. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 360, H = 640;
  var PATH = 'M30 50 H260 A65 65 0 0 1 260 180 H100 A65 65 0 0 0 100 310 H260 A65 65 0 0 1 260 440 H100 A65 65 0 0 0 100 570 H300';
  // Cases des quêtes (x, y) et position des étiquettes.
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

  function text(x, y, cls, content, anchor) {
    return '<text x="' + x + '" y="' + y + '" class="' + cls + '" text-anchor="' + (anchor || 'middle') + '">' + content + '</text>';
  }

  function linkIcon(l, i) {
    var inner = l.kind === 'qr'
      ? '<path d="M-7 -7h5v5h-5zM2 -7h5v5h-5zM-7 2h5v5h-5zM2 2h2v2h-2zM5 5h2v2h-2zM2 5h2M5 2h2" class="b-qr"/>'
      : '<path d="M0 8s6-5.4 6-10a6 6 0 0 0-12 0c0 4.6 6 10 6 10z" class="b-pin"/><circle cx="0" cy="-2" r="2" class="b-pin-dot"/>';
    return '<g transform="translate(' + l.x + ' ' + l.y + ')"><g class="b-link b-pop" style="animation-delay:' + (0.9 + i * 0.35).toFixed(2) + 's">' +
      '<circle r="15" class="b-link-bg"/>' + inner + '</g></g>';
  }

  GQ.board = {
    html: function () {
      var P = GQ.cfg.textes.plateau;
      var stations = STATIONS.map(function (s, i) {
        var n = i + 1;
        var last = n === STATIONS.length;
        var delay = (0.6 + i * 0.35).toFixed(2);
        var label = s.y + 42;
        return (
          '<g transform="translate(' + s.x + ' ' + s.y + ')"><g class="b-station b-pop" style="animation-delay:' + delay + 's">' +
          (last
            ? '<rect x="-27" y="-27" width="54" height="54" rx="10" class="b-st-gift"/>' +
              '<image href="' + GQ.pixel.src('gift') + '" x="-17" y="-18" width="34" height="34" style="image-rendering:pixelated"/>'
            : '<rect x="-23" y="-23" width="46" height="46" rx="9" class="b-st"/>' +
              text(0, 9, 'b-st-num', n)) +
          '</g></g>' +
          '<g class="b-label b-pop" style="animation-delay:' + delay + 's">' +
          text(last ? 230 : 180, label, 'b-lab-kicker', esc(P.quete.replace('{n}', n))) +
          text(last ? 230 : 180, label + 17, 'b-lab-name', esc(GQ.questCfg(n).titre)) +
          text(last ? 230 : 180, label + 33, 'b-lab-note', esc(P.notes[i] || '')) +
          '</g>'
        );
      }).join('');

      var svg =
        '<svg class="board-svg" viewBox="0 0 ' + W + ' ' + (H + 30) + '" role="img" aria-label="' + esc(P.description) + '">' +
        '<defs><mask id="b-reveal"><path d="' + PATH + '" class="b-reveal" pathLength="100"/></mask></defs>' +
        '<g mask="url(#b-reveal)">' +
        '<path d="' + PATH + '" class="b-road-shadow"/>' +
        '<path d="' + PATH + '" class="b-road"/>' +
        '<path d="' + PATH + '" class="b-cells"/>' +
        '</g>' +
        '<path d="' + PATH + '" class="b-track" id="b-track"/>' +
        '<g transform="translate(30 50)"><g class="b-start b-pop" style="animation-delay:.3s">' +
        '<rect x="-26" y="22" width="52" height="19" rx="4" class="b-flag"/>' + text(0, 37, 'b-flag-txt', esc(P.depart)) +
        '<circle r="9" class="b-start-dot"/></g></g>' +
        LINKS.map(linkIcon).join('') +
        stations +
        '<image class="b-elf" href="' + GQ.pixel.src('elfWalk1') + '" width="36" height="44" x="12" y="8" style="image-rendering:pixelated"/>' +
        '</svg>';

      return (
        '<div class="board" data-board>' + svg + '</div>' +
        '<p class="board-legend"><span class="board-legend-ico">' + GQ.icon('qr') + '</span>' + GQ.t(P.legende) + '</p>'
      );
    },

    /* Le lutin parcourt le plateau. Un appui sur le plateau relance. */
    animate: function () {
      var root = document.querySelector('[data-board]');
      if (!root) return;
      var track = root.querySelector('#b-track');
      var elf = root.querySelector('.b-elf');
      var total = track.getTotalLength();
      var raf, frameTimer;

      function place(t, flip) {
        var p = track.getPointAtLength(total * t);
        elf.setAttribute('x', (p.x - 18).toFixed(1));
        elf.setAttribute('y', (p.y - 40).toFixed(1));
        elf.setAttribute('transform', flip ? 'translate(' + (2 * p.x).toFixed(1) + ' 0) scale(-1 1)' : '');
      }

      function run(delay) {
        cancelAnimationFrame(raf);
        clearInterval(frameTimer);
        if (reduceMotion) {
          elf.setAttribute('href', GQ.pixel.src('elfWave'));
          place(1, false);
          return;
        }
        place(0, false);
        var f = 0;
        var start = null;
        var duration = 7000;
        var prevX = 0;
        setTimeout(function () {
          frameTimer = setInterval(function () {
            f = 1 - f;
            elf.setAttribute('href', GQ.pixel.src(f ? 'elfWalk2' : 'elfWalk1'));
          }, 170);
          raf = requestAnimationFrame(function step(ts) {
            if (!document.contains(elf)) { clearInterval(frameTimer); return; }
            if (start === null) start = ts;
            var t = Math.min(1, (ts - start) / duration);
            var p = track.getPointAtLength(total * t);
            var flip = p.x < prevX - 0.01;
            prevX = p.x;
            place(t, flip);
            if (t < 1) raf = requestAnimationFrame(step);
            else {
              clearInterval(frameTimer);
              elf.setAttribute('href', GQ.pixel.src('elfWave'));
              elf.setAttribute('transform', '');
            }
          });
        }, delay);
      }

      run(1400);
      root.addEventListener('click', function () { run(0); });
    },
  };
})();
