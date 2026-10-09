/* Plateau de jeu animé (écran « Comment jouer ? ») : chemin de jeu de
 * l'oie dessiné à la main, cases avec mots-clés ou pictogrammes, objets
 * de jeu éparpillés, et un pion-lutin qui avance case par case jusqu'à
 * la hotte. Le contenu des cases se règle dans config/textes.js
 * (plateau.cases). */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  var W = 360, H = 780;
  var PATH = 'M100 80 C190 70 300 80 300 160 C300 240 70 210 70 300 C70 390 290 360 290 450 C290 540 70 510 70 600 C70 680 200 705 268 700';
  var START = { x: 62, y: 78, r: 44 };
  var END = { x: 306, y: 702, r: 42 };
  var ROAD = 56; // largeur intérieure du chemin

  /* Pictogrammes au trait (centrés sur 0,0, ~28 unités). */
  var ICONS = {
    sparkle: '<path d="M0-15C2-5 5-2 15 0 5 2 2 5 0 15-2 5-5 2-15 0-5-2-2-5 0-15Z"/>',
    qr: '<rect x="-12" y="-12" width="9" height="9" rx="1"/><rect x="3" y="-12" width="9" height="9" rx="1"/><rect x="-12" y="3" width="9" height="9" rx="1"/><path d="M3 3h4v4M10 3v9M3 11h3"/>',
    pin: '<path d="M0 14s10-9 10-17a10 10 0 0 0-20 0c0 8 10 17 10 17z"/><circle cx="0" cy="-3" r="3.5"/>',
    clock: '<circle r="12"/><path d="M0-7v7l5 4"/>',
    gift: '<rect x="-14" y="-4" width="28" height="18" rx="2"/><rect x="-16" y="-10" width="32" height="7" rx="2"/><path d="M0-10v24M0-10c-3-8-12-9-12-4 0 3 5 4 12 4zM0-10c3-8 12-9 12-4 0 3-5 4-12 4z"/>',
    heart: '<path d="M0 12C-14 3-14-9-6-10c3 0 5 2 6 5 1-3 3-5 6-5 8 1 8 13-6 22z"/>',
  };

  /* Objets de jeu décoratifs (remplissage corail, contour rouge). */
  var OBJECTS = {
    dice:
      '<path d="M0-22 20-12 0-2-20-12Z" class="o-fill"/><path d="M-20-12 0-2V22L-20 12Z" class="o-fill o-shade"/><path d="M20-12 0-2V22L20 12Z" class="o-fill"/>' +
      '<circle cx="0" cy="-12" r="2.6" class="o-dot"/><circle cx="-13" cy="0" r="2.4" class="o-dot"/><circle cx="-7" cy="10" r="2.4" class="o-dot"/>' +
      '<circle cx="7" cy="2" r="2.4" class="o-dot"/><circle cx="13" cy="-4" r="2.4" class="o-dot"/><circle cx="7" cy="12" r="2.4" class="o-dot"/><circle cx="13" cy="6" r="2.4" class="o-dot"/>',
    pawn:
      '<ellipse cx="0" cy="18" rx="14" ry="5" class="o-fill"/><path d="M-11 17C-11 6-5 0-5-6H5C5 0 11 6 11 17Z" class="o-fill"/><circle cx="0" cy="-12" r="8" class="o-fill"/>',
    flag:
      '<path d="M-14 26 10-24" class="o-line"/><path d="M10-24 30-14 12-8 22-2 4-4Z" class="o-fill"/><circle cx="10" cy="-26" r="3" class="o-fill"/><path d="M-18 28-10 18-6 26Z" class="o-fill"/>',
    tokens:
      '<ellipse cx="-6" cy="8" rx="17" ry="9" class="o-fill"/><ellipse cx="-6" cy="4" rx="17" ry="9" class="o-fill"/><ellipse cx="-6" cy="4" rx="6" ry="3" class="o-dot"/>' +
      '<ellipse cx="10" cy="-8" rx="17" ry="9" class="o-fill"/><ellipse cx="10" cy="-12" rx="17" ry="9" class="o-fill"/><ellipse cx="10" cy="-12" rx="6" ry="3" class="o-dot"/>',
  };
  var DECOR = [
    { o: 'tokens', x: 268, y: 26, r: -8 },
    { o: 'dice', x: 92, y: 182, r: -10 },
    { o: 'flag', x: 312, y: 300, r: 6 },
    { o: 'pawn', x: 66, y: 450, r: 0 },
    { o: 'dice', x: 296, y: 566, r: 12 },
    { o: 'tokens', x: 120, y: 742, r: 6 },
  ];

  /* Le pion-lutin : pion corail coiffé d'un bonnet rouge à pompon. */
  var PAWN =
    '<ellipse cx="0" cy="0" rx="12" ry="4.5" class="o-fill"/>' +
    '<path d="M-9-1C-9-10-4-15-4-20H4C4-15 9-10 9-1Z" class="o-fill"/>' +
    '<circle cx="0" cy="-26" r="7" class="o-fill"/>' +
    '<path d="M-8-29C-6-38 4-44 13-38L6-31Z" class="b-hat"/><circle cx="14" cy="-38" r="3" class="b-pompom"/>';

  function el(name, attrs, html) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html) n.innerHTML = html;
    return n;
  }

  /* Découpe un texte en lignes courtes (pour tenir dans une case). */
  function wrap(str, max) {
    var lines = [];
    String(str).split('\n').forEach(function (part) {
      var line = '';
      part.split(' ').forEach(function (w) {
        if (line && (line + ' ' + w).length > max) { lines.push(line); line = w; }
        else line = line ? line + ' ' + w : w;
      });
      if (line) lines.push(line);
    });
    return lines;
  }

  GQ.board = {
    html: function () {
      var P = GQ.cfg.textes.plateau;
      var decor = DECOR.map(function (d, i) {
        return '<g transform="translate(' + d.x + ' ' + d.y + ') rotate(' + d.r + ')"><g class="b-pop b-obj" style="animation-delay:' + (1.3 + i * 0.12).toFixed(2) + 's">' + OBJECTS[d.o] + '</g></g>';
      }).join('');
      return (
        '<div class="board" data-board>' +
        '<svg class="board-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(P.description) + '">' +
        '<defs><mask id="b-reveal"><path d="' + PATH + '" class="b-reveal" pathLength="100"/></mask></defs>' +
        decor +
        '<g mask="url(#b-reveal)">' +
        '<path d="' + PATH + '" class="b-road-out" style="stroke-width:' + (ROAD + 7) + '"/>' +
        '<path d="' + PATH + '" class="b-road" id="b-track" style="stroke-width:' + ROAD + '"/>' +
        '<g data-cells></g>' +
        '</g>' +
        '<g class="b-pop" style="animation-delay:.15s"><circle cx="' + START.x + '" cy="' + START.y + '" r="' + START.r + '" class="b-end"/>' +
        '<text x="' + START.x + '" y="' + (START.y + 6) + '" class="b-start-txt" text-anchor="middle">' + esc(P.depart) + '</text></g>' +
        '<g class="b-pop" style="animation-delay:2s"><circle cx="' + END.x + '" cy="' + END.y + '" r="' + END.r + '" class="b-end"/>' +
        '<g transform="translate(' + END.x + ' ' + (END.y - 2) + ') scale(1.25)" class="b-ico b-ico-end">' + ICONS.gift + '</g></g>' +
        '<g class="b-pawn" data-pawn transform="translate(' + START.x + ' ' + (START.y + 10) + ')">' + PAWN + '</g>' +
        '</svg>' +
        '</div>'
      );
    },

    /* Découpe le chemin en cases, place leur contenu, puis fait avancer
     * le pion. Un appui sur le plateau relance l'animation. */
    animate: function () {
      var root = document.querySelector('[data-board]');
      if (!root) return;
      var P = GQ.cfg.textes.plateau;
      var track = root.querySelector('#b-track');
      var layer = root.querySelector('[data-cells]');
      var pawn = root.querySelector('[data-pawn]');
      var total = track.getTotalLength();
      var cases = P.cases || [];
      var startPad = 4, endPad = 6;
      var seg = (total - startPad - endPad) / cases.length;
      var centers = [];

      function at(len) { return track.getPointAtLength(Math.max(0, Math.min(total, len))); }
      function angle(len) {
        var a = at(len - 2), b = at(len + 2);
        return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      }

      cases.forEach(function (c, i) {
        var s0 = startPad + i * seg;
        var mid = s0 + seg / 2;
        var p = at(mid);
        var a = angle(mid);
        var up = a > 90 ? a - 180 : a < -90 ? a + 180 : a;
        centers.push(p);

        if (c.quete) {
          // Case de quête : fond teinté.
          layer.appendChild(el('path', {
            d: PATH, class: 'b-cell-quest',
            style: 'stroke-width:' + ROAD + ';stroke-dasharray:' + seg.toFixed(1) + ' ' + total.toFixed(0) + ';stroke-dashoffset:' + (-s0).toFixed(1),
          }));
        }
        // Trait de séparation entre deux cases.
        if (i > 0) {
          var q = at(s0), n = (angle(s0) + 90) * Math.PI / 180;
          var hw = ROAD / 2 + 2;
          layer.appendChild(el('line', {
            x1: (q.x + Math.cos(n) * hw).toFixed(1), y1: (q.y + Math.sin(n) * hw).toFixed(1),
            x2: (q.x - Math.cos(n) * hw).toFixed(1), y2: (q.y - Math.sin(n) * hw).toFixed(1),
            class: 'b-sep',
          }));
        }
        // Contenu : pictogramme ou mots-clés, orientés le long du chemin.
        var g = el('g', { transform: 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + up.toFixed(1) + ')' });
        var inner = el('g', { class: 'b-pop', style: 'animation-delay:' + (0.5 + i * 0.07).toFixed(2) + 's' });
        if (c.icone) {
          inner.appendChild(el('g', { class: 'b-ico' + (c.quete ? ' b-ico-quest' : '') }, ICONS[c.icone] || ICONS.sparkle));
        } else {
          var label = c.quete ? P.quete.replace('{n}', c.quete) + '\n' + (c.texte || GQ.questCfg(c.quete).titre) : c.texte;
          var lines = wrap(String(label).toUpperCase(), 11);
          var lh = 11;
          lines.forEach(function (line, k) {
            var tEl = el('text', {
              x: 0, y: ((k - (lines.length - 1) / 2) * lh + 3.6).toFixed(1),
              'text-anchor': 'middle',
              class: c.quete && k === 0 ? 'b-txt b-txt-kicker' : 'b-txt',
            });
            tEl.textContent = line;
            inner.appendChild(tEl);
          });
        }
        g.appendChild(inner);
        layer.appendChild(g);
      });

      var timer;
      function put(x, y) { pawn.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); }
      function run(delay) {
        clearTimeout(timer);
        var path = [{ x: START.x, y: START.y + 10 }].concat(centers.map(function (c) { return { x: c.x, y: c.y + 12 }; }), [{ x: END.x, y: END.y + 12 }]);
        if (reduceMotion) { put(path[path.length - 1].x, path[path.length - 1].y); return; }
        put(path[0].x, path[0].y);
        var i = 0;
        timer = setTimeout(function hop() {
          if (!document.contains(pawn) || i >= path.length - 1) return;
          var a = path[i], b = path[i + 1];
          var start = null;
          requestAnimationFrame(function step(ts) {
            if (start === null) start = ts;
            var f = Math.min(1, (ts - start) / 260);
            put(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f - Math.sin(Math.PI * f) * 16);
            if (f < 1) requestAnimationFrame(step);
            else { i++; timer = setTimeout(hop, 160); }
          });
        }, delay);
      }
      run(2300);
      root.addEventListener('click', function () { run(0); });
    },
  };
})();
