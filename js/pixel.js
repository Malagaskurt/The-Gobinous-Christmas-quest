/* Pixel art : pictogrammes et lutin. Dessinés en SVG (un rectangle par
 * suite de pixels de même couleur), nets à toutes les tailles. */
(function () {
  'use strict';

  var GQ = window.GQ;

  var PAL = {
    r: '#C8102E', // rouge de Noël
    R: '#8E0A20', // rouge foncé
    w: '#F6EFE2', // écru
    W: '#FFFFFF',
    s: '#F3C7A1', // peau
    S: '#D9967A', // peau ombrée
    b: '#17428C', // bleu Saint-Gobain
    B: '#0E2A5E', // bleu profond
    c: '#00ADE1', // bleu clair
    C: '#8FDCF5', // bleu très clair
    k: '#0A1F45', // contours, yeux
  };

  function svg(grid, opts) {
    opts = opts || {};
    var pal = Object.assign({}, PAL, opts.pal || {});
    var rows = grid.length;
    var cols = 0;
    grid.forEach(function (r) { cols = Math.max(cols, r.length); });
    var out = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + cols + ' ' + rows + "' width='" + cols + "' height='" + rows + "' shape-rendering='crispEdges'>";
    grid.forEach(function (row, y) {
      var x = 0;
      while (x < row.length) {
        var ch = row[x];
        var n = 1;
        while (row[x + n] === ch) n++;
        if (pal[ch]) out += "<rect x='" + x + "' y='" + y + "' width='" + n + "' height='1' fill='" + pal[ch] + "'/>";
        x += n;
      }
    });
    return out + '</svg>';
  }
  function src(grid, opts) { return 'data:image/svg+xml,' + encodeURIComponent(svg(grid, opts)); }

  /* ------------------------------------------------------------------ */
  /* Pictogrammes                                                        */
  /* ------------------------------------------------------------------ */

  var ICONS = {
    star: [
      '....c....',
      '....c....',
      '...ccc...',
      'ccccccccc',
      '.ccccccc.',
      '..ccccc..',
      '..cc.cc..',
      '.cc...cc.',
      '.c.....c.',
    ],
    gift: [
      '..rr...rr..',
      '.r..r.r..r.',
      '..rrrrrrr..',
      'ccccccccccc',
      'cccccrccccc',
      '.bbbbrbbbb.',
      '.bbbbrbbbb.',
      '.bbbbrbbbb.',
      '.bbbbrbbbb.',
      '.bbbbrbbbb.',
      '.BBBBRBBBB.',
    ],
    check: [
      '.bbbbbbbbbbb.',
      'bbbbbbbbbbbbb',
      'bbbbbbbbbbbbb',
      'bbbbbbbbbbwwb',
      'bbbbbbbbbwwwb',
      'bwwbbbbbwwwbb',
      'bwwwbbbwwwbbb',
      'bbwwwbwwwbbbb',
      'bbbwwwwwbbbbb',
      'bbbbwwwbbbbbb',
      'bbbbbwbbbbbbb',
      'bbbbbbbbbbbbb',
      '.bbbbbbbbbbb.',
    ],
    flake: [
      '....c....',
      '.c..c..c.',
      '..c.c.c..',
      '...ccc...',
      'ccccwcccc',
      '...ccc...',
      '..c.c.c..',
      '.c..c..c.',
      '....c....',
    ],
    clock: [
      '..bbbbb..',
      '.bwwwwwb.',
      'bwwwbwwwb',
      'bwwwbwwwb',
      'bwwwbbbwb',
      'bwwwwwwwb',
      '.bwwwwwb.',
      '..bbbbb..',
    ],
    lock: [
      '..bbbbb..',
      '.bb...bb.',
      '.b.....b.',
      '.b.....b.',
      'rrrrrrrrr',
      'rrrrwrrrr',
      'rrrrwrrrr',
      'rrrrrrrrr',
      'RRRRRRRRR',
    ],
  };

  /* ------------------------------------------------------------------ */
  /* Le lutin (16 × 20 pixels, tourné vers la droite)                    */
  /* ------------------------------------------------------------------ */

  var HEAD = [
    '..........cc....',
    '.........rrc....',
    '........rrr.....',
    '.......rrrr.....',
    '......rrrrr.....',
    '....wwwwwwwww...',
    '..s.sssssssss.s.',
    '..ssssksssksss..',
    '....sssssssss...',
    '.....ssSSSss....',
    '......sssss.....',
  ];
  var BODY = [
    '....wwwwwwwww...',
    '...bbbbbbbbbbb..',
    '..sbbbbbcbbbbbs.',
    '...BBBBBcBBBBB..',
    '...bbbbbbbbbbb..',
  ];
  var LEGS_A = [
    '....bbbb.bbbb...',
    '....rrr...rrr...',
    '....BBB...BBB...',
    '...BBBB...BBBB..',
  ];
  var LEGS_B = [
    '.....bbbbbbb....',
    '......rr.rr.....',
    '......BBBBB.....',
    '.....BBBBBBB....',
  ];
  var BODY_WAVE = [
    '....wwwwwwwww.s.',
    '...bbbbbbbbbbbs.',
    '..sbbbbbcbbbbb..',
    '...BBBBBcBBBBB..',
    '...bbbbbbbbbbb..',
  ];
  var BODY_GIFT = [
    '....wwwwwwwww...',
    '...bbrrbbbrrbb..',
    '..sccccrccccccs.',
    '...ccccrcccccc..',
    '...bbbbrbbbbbb..',
  ];

  /* Contour foncé d'un pixel autour du personnage : il reste lisible sur
   * tous les fonds. */
  function outline(grid) {
    var w = grid[0].length + 2;
    var src = [new Array(w + 1).join('.')].concat(grid.map(function (r) { return '.' + r + '.'; }), [new Array(w + 1).join('.')]);
    return src.map(function (row, y) {
      return row.split('').map(function (c, x) {
        if (c !== '.') return c;
        var n = [src[y - 1] && src[y - 1][x], src[y + 1] && src[y + 1][x], row[x - 1], row[x + 1]];
        return n.some(function (v) { return v && v !== '.'; }) ? 'k' : '.';
      }).join('');
    });
  }

  var SPRITES = {
    elfWalk1: outline(HEAD.concat(BODY, LEGS_A)),
    elfWalk2: outline(HEAD.concat(BODY, LEGS_B)),
    elfWave: outline(HEAD.concat(BODY_WAVE, LEGS_A)),
    elfGift: outline(HEAD.concat(BODY_GIFT, LEGS_A)),
  };

  var cache = {};
  function get(name) {
    if (!cache[name]) cache[name] = src(ICONS[name] || SPRITES[name]);
    return cache[name];
  }

  GQ.pixel = {
    PAL: PAL,
    svg: svg,
    src: get,
    img: function (name, cls, alt) {
      return '<img class="pixel ' + (cls || '') + '" src="' + get(name) + '" alt="' + GQ.esc(alt || '') + '"' + (alt ? '' : ' aria-hidden="true"') + '>';
    },
  };

  /* Illustrations utilisées par les écrans. */
  GQ.art = {
    star: function (cls) { return GQ.pixel.img('star', 'art ' + (cls || '')); },
    check: function (cls) { return GQ.pixel.img('check', 'art ' + (cls || '')); },
    gift: function (cls) { return GQ.pixel.img('gift', 'art ' + (cls || '')); },
    flake: function (cls) { return GQ.pixel.img('flake', 'art ' + (cls || '')); },
    lock: function (cls) { return GQ.pixel.img('lock', 'art ' + (cls || '')); },
    elf: function (pose, cls) { return GQ.pixel.img(pose || 'elfWave', 'elf-inline ' + (cls || ''), ''); },
  };
})();
