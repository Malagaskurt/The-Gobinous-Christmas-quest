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
    '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
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
      var made = memo(key, function () {
        var g = textGrid(text, 'x');
        if (opts.outline) g = outline(g, 'o');
        var cols = 0;
        g.forEach(function (r) { cols = Math.max(cols, r.length); });
        return { src: src(svg(g, { wool: { x: opts.color || WOOL.w, o: '#071534' } })), w: cols * KW };
      });
      // --kw : largeur naturelle. La taille à l'écran se règle en CSS par un
      // coefficient (--k) commun à tous les textes d'un même rôle : les
      // lettres gardent la même taille quelle que soit la longueur du texte.
      return '<img class="knit-img knit-text ' + (opts.cls || '') + '" style="--kw:' + made.w + '" src="' + made.src + '" alt="' + GQ.esc(opts.alt != null ? opts.alt : text.replace(/\n/g, ' ')) + '">';
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

  /* ------------------------------------------------------------------ */
  /* Nuit tricotée : titres, pictogrammes, lutin, guirlande, scène       */
  /* ------------------------------------------------------------------ */

  /* Couleurs des pixels (pixel.js) une fois tricotées sur fond bleu nuit. */
  var KNIT_PAL = {
    r: '#E4323A', R: '#A3141F', w: '#F6EFE2', W: '#FFFFFF', s: '#F3C7A1', S: '#D9967A',
    b: '#3B78D4', B: '#2A5DB0', c: '#00ADE1', C: '#9EE0F5', k: '#0A1F45', n: '#17428C', m: '#1B4A99', p: '#E2D7C3', d: '#0E2A5E',
    y: '#9EE0F5', g: '#00ADE1',
  };

  /* Largeur d'une ligne de texte brodé, en mailles. */
  function textCols(line) {
    return String(line).toUpperCase().split('').reduce(function (n, c, i) {
      var g = FONT[ACCENTS[c] || c] || FONT[' '];
      return n + g[0].length + (i ? 1 : 0);
    }, 0);
  }

  /* Coupe un titre seulement s'il ne tient pas sur une ligne : la limite
   * est une largeur en mailles (88 ≈ la largeur d'un téléphone), pas un
   * nombre de lettres. */
  function wrapWords(text, maxCols) {
    var lines = [];
    String(text).split('\n').forEach(function (part) {
      var line = '';
      part.split(' ').forEach(function (w) {
        if (line && textCols(line + ' ' + w) > maxCols) { lines.push(line); line = w; }
        else line = line ? line + ' ' + w : w;
      });
      if (line) lines.push(line);
    });
    return lines.join('\n');
  }

  function gridImg(key, makeGrid, wool, cls, alt) {
    var s = memo(key, function () { return src(svg(makeGrid(), { wool: wool })); });
    return '<img class="knit-img ' + (cls || '') + '" src="' + s + '" alt="' + GQ.esc(alt || '') + '"' + (alt ? '' : ' aria-hidden="true"') + '>';
  }

  /* Colle des motifs pixel sur une grille vide (scènes composées). */
  function compose(cols, rows, items, dots) {
    var g = [];
    for (var y = 0; y < rows; y++) g.push(new Array(cols + 1).join('.').split(''));
    items.forEach(function (it) {
      var src = GQ.pixel.grid(it.name);
      src.forEach(function (line, dy) {
        for (var dx = 0; dx < line.length; dx++) {
          var ch = line[dx];
          if (ch === '.' || ch === 'k') continue;
          var x = it.flip ? it.x + line.length - 1 - dx : it.x + dx;
          if (g[it.y + dy] && x >= 0 && x < cols) g[it.y + dy][x] = ch;
        }
      });
    });
    (dots || []).forEach(function (p) { if (g[p[1]] && g[p[1]][p[0]] === '.') g[p[1]][p[0]] = 'C'; });
    return g.map(function (r) { return r.join(''); });
  }

  var GARLAND = [
    'r..........rr..........r',
    '.rr......rr..rr......rr.',
    '...rrrrrr......rrrrrr...',
    '......w...........c.....',
    '.....www.........ccc....',
    '....wwwww.......ccccc...',
    '....wwrww.......ccwcc...',
    '....wwwww.......ccccc...',
    '.....www.........ccc....',
  ];

  /* Sol enneigé : sapins, tour de verre et immeuble aux fenêtres allumées
   * (bas de chaque écran), raccordable. Des voitures y passent (CSS). */
  var GROUND = [
    '...C...C.......BB.............C...................',
    '..............BcCB........C..................C....',
    '.....b........BCcB................................',
    '....bbb.......BcCB..C...........................C.',
    '...bbwbb.....BCcCcB............BBBBBBBBBB.........',
    '....bbb......BcCcCB............ByByyBByyB....c....',
    '...bbbbb.....BCcCcB......b.....BBBBBBBBBB...ccc...',
    '..bbbbbwb....BcCcCB.....bbb....ByyBByyByB..ccwcc..',
    '...bbbbb.....BCcCcB....bbwbb...BBBBBBBBBB...ccc...',
    '..bbbbbbbb...BcCcCB.....bbb....ByByyByByB..ccccc..',
    '.bbbwbbbbb...BCcCcB....bbbbb...BBBBBBBBBB.ccccwcc.',
    '.....R......BBBBBBBB.....R.....BBBkkkBBBB....R....',
    'CwwwwwwwwwwwwwwwwCwwwwwwwwwwwwwwwwCwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
  ];

  Object.assign(GQ.knit, {
    PAL: KNIT_PAL,
    /* Titre brodé, sur une seule ligne s'il tient, sinon coupé entre
     * deux mots (opts.cols : largeur maximale en mailles). */
    title: function (text, opts) {
      opts = opts || {};
      // La ponctuation française (« ? », « ! », « : ») reste collée au mot.
      var s = String(text).toUpperCase().replace(/ ([?!:;])/g, '\u00A0$1');
      return GQ.knit.text(wrapWords(s, opts.cols || 88), opts);
    },
    /* Pictogramme ou personnage pixel (pixel.js) rendu en tricot. */
    icon: function (name, cls, alt) {
      return gridImg('ico:' + name, function () { return GQ.pixel.grid(name); }, KNIT_PAL, cls, alt);
    },
    src: function (name) {
      return memo('ico:' + name, function () { return src(svg(GQ.pixel.grid(name), { wool: KNIT_PAL })); });
    },
    /* Scène d'accueil : sapins, Tour Saint-Gobain, lutin et cadeau. */
    scene: function (cls) {
      return gridImg('scene', function () {
        return compose(58, 23, [
          { name: 'tree', x: 1, y: 10 },
          { name: 'tower', x: 13, y: 7 },
          { name: 'elfWave', x: 23, y: 1 },
          { name: 'gift', x: 41, y: 12 },
          { name: 'tree', x: 47, y: 10, flip: true },
        ], [[3, 2], [9, 5], [14, 1], [21, 4], [42, 3], [47, 6], [53, 2], [56, 7], [37, 1], [44, 9], [5, 7], [34, 6]]);
      }, KNIT_PAL, cls, '');
    },
  });

  /* Arrière-plans partagés, exposés en variables CSS. */
  document.documentElement.style.setProperty('--knit-garland', css(svg(GARLAND, { wool: KNIT_PAL })));
  document.documentElement.style.setProperty('--knit-ground', css(svg(GROUND, { wool: KNIT_PAL })));
  // Ampoules de la guirlande (calque qui clignote par-dessus).
  var LIGHTS = GARLAND.map(function (row, y) {
    return row.split('').map(function (c, x) {
      if (y === 3 && (x === 6 || x === 17)) return 'y';
      if (y === 2 && (x === 3 || x === 20)) return 'r';
      if (y === 1 && (x === 10 || x === 13)) return 'y';
      return '.';
    }).join('');
  });
  document.documentElement.style.setProperty('--knit-lights', css(svg(LIGHTS, { wool: KNIT_PAL })));

  var root = document.documentElement.style;
  root.setProperty('--knit-plain', css(svg(PLAIN, { tile: true, bg: GAP })));
  root.setProperty('--knit-band', css(svg(bandGrid(), { tile: true, bg: GAP })));
  root.setProperty('--knit-band-thin', css(svg(THIN_BAND, { tile: true, bg: GAP })));
  root.setProperty('--knit-band-cols', String(bandGrid()[0].length));
})();
