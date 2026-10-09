/* Carte du parcours (écran « Comment jouer ? ») : une route enneigée
 * serpente dans la nuit tricotée, de DÉPART jusqu'à la hotte. Les 5
 * quêtes sont des étapes illustrées, un QR code balise chaque trajet et
 * le lutin parcourt la route en sautillant. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  var W = 360, H = 610;
  var STATIONS = [
    { x: 92, y: 112, side: 1 },
    { x: 268, y: 218, side: -1 },
    { x: 92, y: 330, side: 1 },
    { x: 268, y: 442, side: -1 },
    { x: 180, y: 548, side: 0 },
  ];
  var PATH = 'M28 34 C55 50 70 85 92 112 S240 190 268 218 S70 300 92 330 S250 410 268 442 S175 520 180 548';
  var DECOR = [
    { n: 'tree', x: 296, y: 40, w: 34 }, { n: 'star', x: 196, y: 26, w: 22 },
    { n: 'tree', x: 14, y: 196, w: 30 }, { n: 'tree', x: 44, y: 222, w: 22 },
    { n: 'tower', x: 300, y: 306, w: 26 }, { n: 'tree', x: 168, y: 268, w: 24 },
    { n: 'tree', x: 20, y: 420, w: 32 }, { n: 'flake', x: 176, y: 392, w: 20 },
    { n: 'tree', x: 300, y: 520, w: 34 }, { n: 'tree', x: 34, y: 540, w: 28 },
  ];
  var SNOW = [[60, 20], [130, 60], [240, 80], [330, 130], [150, 160], [20, 120], [200, 190], [320, 260], [130, 230],
    [60, 280], [230, 300], [150, 350], [330, 380], [60, 390], [210, 420], [120, 470], [330, 480], [240, 500], [80, 500], [20, 590], [340, 590], [110, 590]];

  function img(name, x, y, w, cls) {
    return '<image class="' + (cls || '') + '" href="' + GQ.knit.src(name) + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + (w * 1.3).toFixed(0) + '" preserveAspectRatio="xMidYMax meet"/>';
  }

  GQ.board = {
    html: function () {
      var P = GQ.cfg.textes.plateau;
      var decor = DECOR.map(function (d, i) {
        return '<g class="b-pop" style="animation-delay:' + (1.2 + i * 0.08).toFixed(2) + 's">' + img(d.n, d.x, d.y, d.w, 'b-decor') + '</g>';
      }).join('');
      var snow = SNOW.map(function (p, i) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 3 ? 1.6 : 2.4) + '" class="b-snow" style="animation-delay:' + (i * 0.37 % 3).toFixed(2) + 's"/>';
      }).join('');
      var stations = STATIONS.map(function (s, i) {
        var n = i + 1;
        var delay = (0.7 + i * 0.3).toFixed(2);
        var lx = s.side === 0 ? s.x : s.x + s.side * 36;
        var ly = s.side === 0 ? s.y + 44 : s.y - 2;
        var anchor = s.side === 1 ? 'start' : s.side === -1 ? 'end' : 'middle';
        return (
          '<g class="b-pop" style="animation-delay:' + delay + 's">' +
          '<ellipse cx="' + s.x + '" cy="' + (s.y + 14) + '" rx="30" ry="9" class="b-mound"/>' +
          img(GQ.questIcon(n), s.x - 22, s.y - 30, 44, 'b-station') +
          '<text x="' + lx + '" y="' + ly + '" text-anchor="' + anchor + '" class="b-kicker">QUÊTE ' + n + '</text>' +
          '<text x="' + lx + '" y="' + (ly + 16) + '" text-anchor="' + anchor + '" class="b-name">' + esc(String(P.etapes[i] || GQ.questCfg(n).titre).toUpperCase()) + '</text>' +
          '</g>'
        );
      }).join('');
      return (
        '<div class="board" data-board>' +
        '<svg class="board-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(P.description) + '">' +
        '<defs><mask id="b-reveal"><path d="' + PATH + '" class="b-reveal" pathLength="100"/></mask></defs>' +
        snow + decor +
        '<g mask="url(#b-reveal)">' +
        '<path d="' + PATH + '" class="b-road-edge"/>' +
        '<path d="' + PATH + '" class="b-road" id="b-track"/>' +
        '<path d="' + PATH + '" class="b-road-dash"/>' +
        '</g>' +
        '<g data-qr></g>' +
        '<g class="b-pop" style="animation-delay:.3s"><circle cx="28" cy="34" r="7" class="b-start"/>' +
        '<text x="42" y="24" class="b-kicker">' + esc(P.depart) + '</text></g>' +
        stations +
        '<image class="b-elf" data-elf href="' + GQ.knit.src('elfWalk1') + '" width="30" height="38" x="13" y="0"/>' +
        '</svg></div>'
      );
    },

    animate: function () {
      var root = document.querySelector('[data-board]');
      if (!root) return;
      var track = root.querySelector('#b-track');
      var elf = root.querySelector('[data-elf]');
      var qrLayer = root.querySelector('[data-qr]');
      var total = track.getTotalLength();

      // Position des étapes le long de la route.
      var marks = STATIONS.map(function (s) {
        var best = 0, bestD = 1e9;
        for (var l = 0; l <= total; l += 2) {
          var p = track.getPointAtLength(l);
          var d = (p.x - s.x) * (p.x - s.x) + (p.y - s.y) * (p.y - s.y);
          if (d < bestD) { bestD = d; best = l; }
        }
        return best;
      });
      // Un QR code à mi-chemin entre deux quêtes.
      for (var i = 0; i < marks.length - 1; i++) {
        var p = track.getPointAtLength((marks[i] + marks[i + 1]) / 2);
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'b-pop');
        g.setAttribute('style', 'animation-delay:' + (1.6 + i * 0.15).toFixed(2) + 's');
        g.innerHTML = '<rect x="' + (p.x - 13) + '" y="' + (p.y - 13) + '" width="26" height="26" rx="5" class="b-qr-bg"/>' + img('qr', p.x - 9, p.y - 11, 18);
        qrLayer.appendChild(g);
      }

      var raf, timer, frame;
      function put(len, hop, pose) {
        var p = track.getPointAtLength(Math.max(0, Math.min(total, len)));
        var q = track.getPointAtLength(Math.min(total, len + 3));
        var flip = q.x < p.x - 0.2;
        elf.setAttribute('href', GQ.knit.src(pose));
        elf.setAttribute('x', (p.x - 15).toFixed(1));
        elf.setAttribute('y', (p.y - 34 - hop).toFixed(1));
        elf.setAttribute('transform', flip ? 'translate(' + (2 * p.x).toFixed(1) + ' 0) scale(-1 1)' : '');
      }
      function run(delay) {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
        if (reduceMotion) { put(total, 0, 'elfWave'); return; }
        put(0, 0, 'elfWalk1');
        timer = setTimeout(function () {
          var start = null;
          var duration = 8000;
          raf = requestAnimationFrame(function step(ts) {
            if (!document.contains(elf)) return;
            if (start === null) start = ts;
            var t = Math.min(1, (ts - start) / duration);
            // Petite pause à chaque étape.
            var len = t * total;
            var hop = Math.abs(Math.sin(ts / 110)) * 4;
            frame = Math.floor(ts / 160) % 2;
            put(len, t < 1 ? hop : 0, t < 1 ? (frame ? 'elfWalk2' : 'elfWalk1') : 'elfWave');
            if (t < 1) raf = requestAnimationFrame(step);
          });
        }, delay);
      }
      run(1800);
      root.addEventListener('click', function () { run(0); });
    },
  };
})();
