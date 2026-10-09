/* Moteur graphique « tricot » : génère en SVG des mailles jersey, des
 * textes brodés en pixels, des bandes jacquard et de petits motifs.
 * Tout est produit sous forme d'images SVG (data URI) : aucune image
 * externe, rendu net sur tous les écrans. */
(function () {
  'use strict';

  var GQ = window.GQ;

  /* Couleurs de laine (charte Saint-Gobain + touches de Noël). */
  var WOOL = {
    n: '#17428C', // bleu Saint-Gobain (fond du pull)
    m: '#1B4A99', // variation de fond
    d: '#0E2A5E', // bleu profond
    w: '#F6EFE2', // laine écrue
    c: '#00ADE1', // bleu clair
    r: '#C8102E', // rouge de Noël
    p: '#E2D7C3', // écru ombré (maille « vide » sur papier)
  };
  var GAP = '#0A1F45';

  /* Une maille = un « V » formé de deux jambes. Cellule 10 × 9 unités,
   * les jambes débordent légèrement sur le rang inférieur. */
  var KW = 10, KH = 9;
  var LEG_L = 'M5 10.4C2.5 9.6.2 5.8.4 1.8.5 0 2.3-.7 3.4.3 4.8 1.6 5.4 5.7 5 10.4Z';
  var LEG_R = 'M5 10.4C7.5 9.6 9.8 5.8 9.6 1.8 9.5 0 7.7-.7 6.6.3 5.2 1.6 4.6 5.7 5 10.4Z';
  var FIBER = 'M1.7 1.5Q2.5 5.6 4.5 9M8.3 1.5Q7.5 5.6 5.5 9M2.6.9Q3.6 4.4 4.8 7.4M7.4.9Q6.4 4.4 5.2 7.4';
  var DEFS =
    "<defs><linearGradient id='g' x1='0' y1='0' x2='.35' y2='1'>" +
    "<stop offset='0' stop-color='#fff' stop-opacity='.32'/><stop offset='.42' stop-color='#fff' stop-opacity='0'/>" +
    "<stop offset='1' stop-color='#000' stop-opacity='.38'/></linearGradient>" +
    "<g id='k'><path d='" + LEG_L + "' fill='currentColor'/><path d='" + LEG_R + "' fill='currentColor'/>" +
    "<path d='" + LEG_L + "' fill='url(#g)'/><path d='" + LEG_R + "' fill='url(#g)'/>" +
    "<path d='" + FIBER + "' fill='none' stroke='#fff' stroke-opacity='.2' stroke-width='.35' stroke-linecap='round'/></g></defs>";

  /* grid : tableau de chaînes, un caractère par maille ('.' ou ' ' = vide).
   * opts.tile : motif raccordable (répété en arrière-plan)
   * opts.bg   : couleur des interstices
   * opts.wool : couleurs supplémentaires { caractère: couleur } */
  function svg(grid, opts) {
    opts = opts || {};
    var pal = Object.assign({}, WOOL, opts.wool || {});
    var rows = grid.length;
    var cols = 0;
    grid.forEach(function (r) { cols = Math.max(cols, r.length); });
    var w = cols * KW;
    var top = opts.tile ? 0 : -1;
    var h = opts.tile ? rows * KH : rows * KH + 2.5;
    var out = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 " + top + ' ' + w + ' ' + h +
      "' width='" + w + "' height='" + h + "' preserveAspectRatio='none'>" + DEFS;
    if (opts.bg) out += "<rect x='0' y='" + top + "' width='" + w + "' height='" + h + "' fill='" + opts.bg + "'/>";
    // En mode raccordable, on redessine le dernier rang au-dessus pour
    // que le débordement des mailles se raccorde d'une tuile à l'autre.
    for (var r = opts.tile ? -1 : 0; r < rows; r++) {
      var line = grid[(r + rows) % rows];
      for (var c = 0; c < cols; c++) {
        var col = pal[line[c]];
        if (!col) continue;
        out += "<use xlink:href='#k' x='" + c * KW + "' y='" + r * KH + "' color='" + col + "'/>";
      }
    }
    return out + '</svg>';
  }

  function src(svgText) { return 'data:image/svg+xml,' + encodeURIComponent(svgText); }
  function css(svgText) { return 'url("' + src(svgText) + '")'; }

  /* ------------------------------------------------------------------ */
  /* Alphabet pixel 5 × 7 (lettres brodées)                              */
  /* ------------------------------------------------------------------ */

  var FONT = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
    J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
    2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
    7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    '!': ['#', '#', '#', '#', '#', '.', '#'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
    ':': ['.', '#', '#', '.', '#', '#', '.'],
    '-': ['....', '....', '....', '####', '....', '....', '....'],
    '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
    "'": ['#', '#', '.', '.', '.', '.', '.'],
    ' ': ['..', '..', '..', '..', '..', '..', '..'],
  };
  var ACCENTS = { 'É': 'E', 'È': 'E', 'Ê': 'E', 'À': 'A', 'Â': 'A', 'Ç': 'C', 'Ô': 'O', 'Û': 'U', 'Ù': 'U', 'Î': 'I', 'Ï': 'I', 'Ë': 'E' };

  /* Texte → grille de mailles. Plusieurs lignes séparées par \n, centrées. */
  function textGrid(text, ch) {
    ch = ch || 'w';
    var lines = String(text).toUpperCase().split('\n').map(function (line) {
      var rows = ['', '', '', '', '', '', ''];
      line.split('').forEach(function (c, i) {
        var g = FONT[ACCENTS[c] || c] || FONT[' '];
        for (var r = 0; r < 7; r++) rows[r] += (i ? '.' : '') + g[r].replace(/#/g, ch);
      });
      return rows;
    });
    var width = Math.max.apply(null, lines.map(function (l) { return l[0].length; }));
    var grid = [];
    lines.forEach(function (l, li) {
      if (li) grid.push('', '');
      l.forEach(function (row) {
        var pad = Math.floor((width - row.length) / 2);
        grid.push(new Array(pad + 1).join('.') + row);
      });
    });
    return grid;
  }

  /* ------------------------------------------------------------------ */
  /* Motifs                                                              */
  /* ------------------------------------------------------------------ */

  var STAR = [
    '.....c.....',
    '.....c.....',
    '....ccc....',
    '....ccc....',
    'ccccccccccc',
    '.ccccwcccc.',
    '..ccccccc..',
    '...ccccc...',
    '..ccc.ccc..',
    '..cc...cc..',
    '.c.......c.',
  ];

  var SNOWFLAKE = ['nnnwnnn', 'nwnwnwn', 'nnwwwnn', 'wwwcwww', 'nnwwwnn', 'nwnwnwn', 'nnnwnnn'];
  var TREE = ['nnncnnn', 'nnnwnnn', 'nnwwwnn', 'nwwwwwn', 'nnwwwnn', 'wwwwwww', 'nnnrnnn'];

  /* Grande bande jacquard (flocons et sapins). */
  function bandGrid() {
    var g = ['rrrrrrrrrrrrrrrr', 'nnnnnnnnnnnnnnnn', 'wnnnwnnnwnnnwnnn', 'nnnnnnnnnnnnnnnn'];
    for (var i = 0; i < 7; i++) g.push(SNOWFLAKE[i] + 'n' + TREE[i] + 'n');
    g.push('nnnnnnnnnnnnnnnn', 'nnwnnnwnnnwnnnwn', 'nnnnnnnnnnnnnnnn', 'rrrrrrrrrrrrrrrr');
    return g;
  }

  /* Bande fine (petites étincelles entre deux lignes rouges). */
  var THIN_BAND = ['rrrrrr', 'nnnnnn', 'nnwnnn', 'nwcwnn', 'nnwnnn', 'nnnnnn', 'rrrrrr'];

  /* Fond de pull : jersey uni, avec de légères variations de teinte. */
  var PLAIN = ['nnmnnn', 'nnnnnm', 'mnnnnn', 'nnnmnn', 'nnnnnn', 'nmnnnn'];

  function circleGrid(size, fill) {
    var g = [];
    var cx = (size - 1) / 2, R = size / 2 - 0.3;
    for (var y = 0; y < size; y++) {
      var row = '';
      for (var x = 0; x < size; x++) row += (x - cx) * (x - cx) + (y - cx) * (y - cx) <= R * R ? fill : '.';
      g.push(row);
    }
    return g;
  }
  function plot(g, pts, ch) {
    pts.forEach(function (p) {
      var row = g[p[1]];
      if (row == null || p[0] < 0 || p[0] >= row.length) return;
      g[p[1]] = row.slice(0, p[0]) + ch + row.slice(p[0] + 1);
    });
    return g;
  }

  /* Écusson rond brodé d'une étoile. */
  function badgeGrid() {
    var g = circleGrid(17, 'n');
    STAR.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) if (row[x] !== '.') plot(g, [[x + 3, y + 3]], row[x] === 'w' ? 'r' : 'w');
    });
    return g;
  }

  /* Contour de mailles foncées autour d'un motif, pour le détacher du fond. */
  function outline(grid, ch) {
    var rows = grid.length + 2;
    var cols = 0;
    grid.forEach(function (r) { cols = Math.max(cols, r.length); });
    cols += 2;
    var src = [];
    for (var y = 0; y < rows; y++) {
      var line = y === 0 || y === rows - 1 ? '' : grid[y - 1];
      var row = '';
      for (var x = 0; x < cols; x++) row += x === 0 ? '.' : line[x - 1] || '.';
      src.push(row);
    }
    return src.map(function (row, y) {
      return row.split('').map(function (c, x) {
        if (c !== '.') return c;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          var n = src[y + dy] && src[y + dy][x + dx];
          if (n && n !== '.') return ch;
        }
        return '.';
      }).join('');
    });
  }

  /* Cadeau emballé. */
  function giftGrid() {
    var g = [];
    for (var y = 0; y < 15; y++) g.push('...............');
    for (y = 5; y < 7; y++) plot(g, range(1, 14).map(function (x) { return [x, y]; }), 'c');
    for (y = 7; y < 15; y++) plot(g, range(2, 13).map(function (x) { return [x, y]; }), 'n');
    for (y = 5; y < 15; y++) plot(g, [[7, y]], 'r');
    plot(g, [[4, 2], [5, 2], [4, 3], [5, 3], [6, 3], [6, 4], [7, 4], [8, 4], [8, 3], [9, 3], [10, 3], [9, 2], [10, 2]], 'r');
    plot(g, [[7, 0], [7, 1], [6, 1], [8, 1]], 'w');
    plot(g, [[3, 8], [3, 9], [4, 8]], 'm');
    return g;
  }
  function range(a, b) { var o = []; for (var i = a; i < b; i++) o.push(i); return o; }

  /* Flocon isolé (blocage du quiz). */
  var FLAKE = ['..c.c.c..', '...ccc...', 'c..wcw..c', '.cwcwcwc.', 'cccwwwccc', '.cwcwcwc.', 'c..wcw..c', '...ccc...', '..c.c.c..'];

  /* ------------------------------------------------------------------ */
  /* API                                                                 */
  /* ------------------------------------------------------------------ */

  var cache = {};
  function memo(key, fn) { return cache[key] || (cache[key] = fn()); }

  GQ.knit = {
    WOOL: WOOL,
    /* Image <img> d'un texte brodé. */
    text: function (text, opts) {
      opts = opts || {};
      var key = 'txt:' + text + ':' + (opts.color || 'w') + ':' + !!opts.outline;
      var s = memo(key, function () {
        var g = textGrid(text, 'x');
        if (opts.outline) g = outline(g, 'o');
        return src(svg(g, { wool: { x: opts.color || WOOL.w, o: '#0A1F45' } }));
      });
      return '<img class="knit-img ' + (opts.cls || '') + '" src="' + s + '" alt="' + GQ.esc(opts.alt != null ? opts.alt : text.replace(/\n/g, ' ')) + '">';
    },
    img: function (name, cls, alt) {
      var grids = { star: STAR, badge: badgeGrid(), gift: giftGrid(), flake: FLAKE };
      var s = memo('img:' + name, function () { return src(svg(grids[name])); });
      return '<img class="knit-img ' + (cls || '') + '" src="' + s + '" alt="' + GQ.esc(alt || '') + '"' + (alt ? '' : ' aria-hidden="true"') + '>';
    },
    /* Rang de mailles indiquant la progression (ex. quiz). */
    row: function (states) {
      var line = states.map(function (st) { return { done: 'w', current: 'c', todo: 'p' }[st] || 'p'; }).join('');
      return '<img class="knit-row" src="' + src(svg([line], { wool: { w: WOOL.n } })) + '" alt="" aria-hidden="true">';
    },
  };

  /* Arrière-plans partagés, exposés en variables CSS. */
  var root = document.documentElement.style;
  root.setProperty('--knit-plain', css(svg(PLAIN, { tile: true, bg: GAP })));
  root.setProperty('--knit-band', css(svg(bandGrid(), { tile: true, bg: GAP })));
  root.setProperty('--knit-band-thin', css(svg(THIN_BAND, { tile: true, bg: GAP })));
  root.setProperty('--knit-band-cols', String(bandGrid()[0].length));
})();
