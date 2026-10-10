/* Direction artistique « Noël premium » : illustrations en relief doux
 * (dégradés, reflets, ombres portées), dans l'esprit du portrait 3D de
 * Barnabé. Charte : rouge, bleu Saint-Gobain, bleu ciel, écru.
 *
 * Ce module remplace, à l'affichage, les rendus « tricot » et « pixel » :
 *   - GQ.knit.icon / GQ.pix  → illustrations en relief ;
 *   - GQ.knit.text / title   → titres typographiques ;
 *   - GQ.knit.scene          → décor (sapins, Tour, cadeau) ;
 *   - le lutin               → le portrait de Barnabé, flouté tant qu'il
 *                              n'a pas été démasqué (quête 4).
 * Chaque illustration est une image SVG autonome (data URI). */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;

  /* Dégradés : clair → base → ombre. */
  var TONES = {
    r: ['#FF7A7F', '#E4323A', '#A3122A'],
    r2: ['#FF9599', '#EC4A51', '#B81B30'],
    s: ['#A6E9FF', '#2FC0EE', '#0085BA'],
    n: ['#6C9BEA', '#2A5DB0', '#123A80'],
    c: ['#FFFFFF', '#F6EFE2', '#D8C9AE'],
    d: ['#3D5486', '#1C2D55', '#0C1834'],
  };

  function defs(keys) {
    return '<defs>' + keys.map(function (k) {
      var c = TONES[k];
      // Aplat 2D : une seule couleur par forme.
      return "<linearGradient id='" + k + "' x1='0' y1='0' x2='0' y2='1'>" +
        "<stop offset='0' stop-color='" + c[1] + "'/><stop offset='1' stop-color='" + c[1] + "'/></linearGradient>";
    }).join('') +
      "<radialGradient id='gl' cx='.3' cy='.25' r='.6'><stop offset='0' stop-color='#fff' stop-opacity='.75'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient>" +
      '</defs>';
  }

  var SHADOW = "<ellipse cx='32' cy='60' rx='19' ry='3' fill='#000' opacity='.28'/>";

  function star(cx, cy, R, r) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i * Math.PI) / 5;
      var d = i % 2 ? r : R;
      p.push((cx + d * Math.cos(a)).toFixed(1) + ',' + (cy + d * Math.sin(a)).toFixed(1));
    }
    return p.join(' ');
  }

  function flakePaths() {
    var out = '';
    for (var i = 0; i < 3; i++) {
      var a = (i * Math.PI) / 3;
      var dx = Math.cos(a), dy = Math.sin(a);
      out += 'M' + (32 - 23 * dx).toFixed(1) + ' ' + (32 - 23 * dy).toFixed(1) + 'L' + (32 + 23 * dx).toFixed(1) + ' ' + (32 + 23 * dy).toFixed(1);
    }
    for (var j = 0; j < 6; j++) {
      var b = (j * Math.PI) / 3;
      var bx = 32 + 14 * Math.cos(b), by = 32 + 14 * Math.sin(b);
      [-1, 1].forEach(function (s) {
        var c = b + s * 0.75;
        out += 'M' + bx.toFixed(1) + ' ' + by.toFixed(1) + 'L' + (bx + 7 * Math.cos(c)).toFixed(1) + ' ' + (by + 7 * Math.sin(c)).toFixed(1);
      });
    }
    return out;
  }

  var ART = {
    gift: [['r', 'r2', 'c'],
      SHADOW +
      "<rect x='11' y='29' width='42' height='28' rx='6' fill='url(#r)'/>" +
      "<rect x='7' y='20' width='50' height='12' rx='5' fill='url(#r2)'/>" +
      "<rect x='28' y='20' width='8' height='37' fill='url(#c)'/>" +
      "<rect x='11' y='32' width='42' height='3' fill='#000' opacity='.12'/>" +
      "<path d='M32 21C25 7 11 11 17 19C20 22 27 22 32 21Z' fill='url(#c)'/>" +
      "<path d='M32 21C39 7 53 11 47 19C44 22 37 22 32 21Z' fill='url(#c)'/>" +
      "<circle cx='32' cy='21' r='4.5' fill='url(#c)'/>" +
      "<rect x='11' y='22' width='15' height='3' rx='1.5' fill='#fff' opacity='.5'/>"],
    tree: [['s', 'n', 'r', 'c'],
      SHADOW +
      "<rect x='28' y='50' width='8' height='9' rx='2' fill='#0C1834'/>" +
      "<path d='M32 22L52 49Q54 53 49 53H15Q10 53 12 49Z' fill='url(#n)'/>" +
      "<path d='M32 13L47 36Q49 40 44 40H20Q15 40 17 36Z' fill='url(#s)'/>" +
      "<path d='M32 6L42 23Q44 27 39 27H25Q20 27 22 23Z' fill='url(#s)'/>" +
      "<path d='M30 9L22 24' stroke='#fff' stroke-width='2' stroke-linecap='round' opacity='.45'/>" +
      "<circle cx='22' cy='47' r='3' fill='url(#r)'/><circle cx='41' cy='45' r='3' fill='url(#c)'/>" +
      "<circle cx='29' cy='35' r='2.6' fill='url(#r)'/><circle cx='38' cy='31' r='2.4' fill='url(#c)'/>" +
      "<polygon points='" + star(32, 6, 6, 2.6) + "' fill='url(#c)' stroke='#fff' stroke-width='.8' stroke-linejoin='round'/>"],
    star: [['s'],
      SHADOW +
      "<polygon points='" + star(32, 31, 25, 11) + "' fill='url(#s)' stroke='url(#s)' stroke-width='5' stroke-linejoin='round'/>" +
      "<ellipse cx='25' cy='22' rx='7' ry='4' fill='#fff' opacity='.45' transform='rotate(-30 25 22)'/>"],
    tower: [['s', 'n', 'd'],
      SHADOW +
      "<path d='M19 59V17Q19 11 25 10L43 5V59Z' fill='url(#s)'/>" +
      "<path d='M43 5L50 10V59H43Z' fill='url(#n)'/>" +
      "<path d='M19 22H43M19 29H43M19 36H43M19 43H43M19 50H43' stroke='#fff' stroke-width='.9' opacity='.35'/>" +
      "<path d='M43 18H50M43 26H50M43 34H50M43 42H50M43 50H50' stroke='#fff' stroke-width='.8' opacity='.2'/>" +
      "<path d='M23 57L35 8' stroke='#fff' stroke-width='3.5' opacity='.3'/>"],
    building: [['n', 'c'],
      SHADOW +
      "<rect x='15' y='9' width='34' height='50' rx='4' fill='url(#n)'/>" +
      "<g fill='url(#c)'><rect x='20' y='15' width='6' height='6' rx='1.5'/><rect x='29' y='15' width='6' height='6' rx='1.5' opacity='.4'/><rect x='38' y='15' width='6' height='6' rx='1.5'/>" +
      "<rect x='20' y='26' width='6' height='6' rx='1.5' opacity='.4'/><rect x='29' y='26' width='6' height='6' rx='1.5'/><rect x='38' y='26' width='6' height='6' rx='1.5'/>" +
      "<rect x='20' y='37' width='6' height='6' rx='1.5'/><rect x='29' y='37' width='6' height='6' rx='1.5'/><rect x='38' y='37' width='6' height='6' rx='1.5' opacity='.4'/></g>" +
      "<rect x='28' y='48' width='8' height='11' rx='2' fill='#0C1834'/>"],
    camera: [['n', 'c', 's', 'r'],
      SHADOW +
      "<rect x='18' y='12' width='16' height='10' rx='3' fill='url(#n)'/>" +
      "<rect x='6' y='18' width='52' height='37' rx='10' fill='url(#n)'/>" +
      "<circle cx='32' cy='37' r='14' fill='url(#c)'/><circle cx='32' cy='37' r='10' fill='url(#s)'/>" +
      "<circle cx='32' cy='37' r='4.5' fill='#0C1834'/><circle cx='28.5' cy='33.5' r='2.6' fill='#fff' opacity='.85'/>" +
      "<rect x='44' y='23' width='9' height='5' rx='2' fill='url(#r)'/>" +
      "<rect x='10' y='21' width='16' height='3' rx='1.5' fill='#fff' opacity='.35'/>"],
    loupe: [['r', 'c', 's'],
      SHADOW +
      "<rect x='37' y='37' width='11' height='24' rx='5.5' fill='url(#r)' transform='rotate(-45 42.5 49)'/>" +
      "<circle cx='27' cy='27' r='18' fill='url(#c)'/><circle cx='27' cy='27' r='13' fill='url(#s)'/>" +
      "<ellipse cx='22' cy='21' rx='6' ry='3.5' fill='#fff' opacity='.6' transform='rotate(-35 22 21)'/>"],
    quiz: [['s', 'c'],
      SHADOW +
      "<path d='M9 15Q9 8 16 8H48Q55 8 55 15V37Q55 44 48 44H29L18 54L20 44H16Q9 44 9 37Z' fill='url(#s)'/>" +
      "<text x='32' y='37' text-anchor='middle' font-family='Arial Black,Arial' font-weight='900' font-size='28' fill='url(#c)'>?</text>" +
      "<rect x='14' y='12' width='18' height='3' rx='1.5' fill='#fff' opacity='.5'/>"],
    badge: [['c', 'r', 's', 'n'],
      SHADOW +
      "<rect x='10' y='14' width='44' height='43' rx='8' fill='url(#c)'/>" +
      "<rect x='26' y='7' width='12' height='12' rx='3' fill='url(#r)'/>" +
      "<rect x='16' y='27' width='15' height='18' rx='3.5' fill='url(#s)'/>" +
      "<circle cx='23.5' cy='34' r='4' fill='#fff' opacity='.7'/>" +
      "<rect x='35' y='29' width='14' height='3.5' rx='1.7' fill='url(#n)'/><rect x='35' y='36' width='10' height='3.5' rx='1.7' fill='url(#n)' opacity='.6'/>" +
      "<rect x='16' y='49' width='32' height='3' rx='1.5' fill='url(#n)' opacity='.3'/>"],
    lock: [['c', 'r'],
      SHADOW +
      "<path d='M21 31V22Q21 11 32 11Q43 11 43 22V31' fill='none' stroke='url(#c)' stroke-width='6' stroke-linecap='round'/>" +
      "<rect x='12' y='28' width='40' height='30' rx='9' fill='url(#r)'/>" +
      "<circle cx='32' cy='40' r='4.2' fill='#0C1834'/><rect x='30.4' y='41' width='3.2' height='9' rx='1.6' fill='#0C1834'/>" +
      "<rect x='16' y='31' width='16' height='3' rx='1.5' fill='#fff' opacity='.4'/>"],
    flake: [['s'],
      "<path d='" + flakePaths() + "' fill='none' stroke='url(#s)' stroke-width='5' stroke-linecap='round'/>" +
      "<circle cx='32' cy='32' r='5' fill='#fff' opacity='.8'/>"],
    check: [['s'],
      SHADOW +
      "<circle cx='32' cy='31' r='25' fill='url(#s)'/><circle cx='32' cy='31' r='25' fill='url(#gl)'/>" +
      "<path d='M20 32L29 41L45 23' fill='none' stroke='#fff' stroke-width='6.5' stroke-linecap='round' stroke-linejoin='round'/>"],
    pin: [['r', 'c'],
      SHADOW +
      "<path d='M32 58C32 58 13 38 13 25A19 19 0 0 1 51 25C51 38 32 58 32 58Z' fill='url(#r)'/>" +
      "<circle cx='32' cy='25' r='7.5' fill='url(#c)'/>" +
      "<ellipse cx='24' cy='16' rx='5' ry='3' fill='#fff' opacity='.45' transform='rotate(-35 24 16)'/>"],
    clock: [['c', 'r', 'n'],
      SHADOW +
      "<circle cx='32' cy='31' r='25' fill='url(#r)'/><circle cx='32' cy='31' r='20' fill='url(#c)'/>" +
      "<path d='M32 31V17M32 31L41 37' stroke='url(#n)' stroke-width='4' stroke-linecap='round'/>" +
      "<circle cx='32' cy='31' r='3' fill='url(#r)'/>"],
    bell: [['s', 'c', 'r'],
      SHADOW +
      "<path d='M32 10C20 10 17 22 17 32C17 40 13 44 11 47H53C51 44 47 40 47 32C47 22 44 10 32 10Z' fill='url(#s)'/>" +
      "<rect x='9' y='45' width='46' height='7' rx='3.5' fill='url(#c)'/>" +
      "<circle cx='32' cy='55' r='5' fill='url(#r)'/><circle cx='32' cy='9' r='4' fill='url(#r)'/>" +
      "<path d='M24 18Q21 26 21 34' stroke='#fff' stroke-width='3' stroke-linecap='round' opacity='.45'/>"],
    crown: [['s', 'c', 'r'],
      SHADOW +
      "<path d='M10 46L8 20L22 32L32 13L42 32L56 20L54 46Z' fill='url(#s)' stroke='url(#s)' stroke-width='3' stroke-linejoin='round'/>" +
      "<rect x='9' y='43' width='46' height='12' rx='4' fill='url(#c)'/>" +
      "<circle cx='21' cy='49' r='3' fill='url(#r)'/><circle cx='32' cy='49' r='3.4' fill='url(#r)'/><circle cx='43' cy='49' r='3' fill='url(#r)'/>" +
      "<circle cx='8' cy='20' r='3.5' fill='url(#c)'/><circle cx='32' cy='13' r='3.5' fill='url(#c)'/><circle cx='56' cy='20' r='3.5' fill='url(#c)'/>"],
    sock: [['r', 'c'],
      SHADOW +
      "<path d='M21 12H41V36Q41 41 45 43L51 46Q58 50 54 56Q51 61 43 58L25 50Q19 47 20 40Z' fill='url(#r)'/>" +
      "<rect x='18' y='6' width='26' height='12' rx='4.5' fill='url(#c)'/>" +
      "<path d='M45 45Q55 47 54 55' stroke='url(#c)' stroke-width='5' fill='none' stroke-linecap='round'/>"],
    coin: [['s', 'c'],
      SHADOW +
      "<circle cx='32' cy='31' r='25' fill='url(#s)'/><circle cx='32' cy='31' r='19' fill='none' stroke='#fff' stroke-width='2' opacity='.55'/>" +
      "<text x='32' y='41' text-anchor='middle' font-family='Arial Black,Arial' font-weight='900' font-size='27' fill='url(#c)'>G</text>" +
      "<circle cx='32' cy='31' r='25' fill='url(#gl)'/>"],
    dice: [['c', 'n'],
      SHADOW +
      "<rect x='11' y='10' width='42' height='42' rx='11' fill='url(#c)'/>" +
      "<g fill='url(#n)'><circle cx='22' cy='21' r='4'/><circle cx='42' cy='21' r='4'/><circle cx='32' cy='31' r='4'/><circle cx='22' cy='41' r='4'/><circle cx='42' cy='41' r='4'/></g>"],
    drop: [['s'],
      "<path d='M32 6C32 6 14 28 14 40A18 18 0 0 0 50 40C50 28 32 6 32 6Z' fill='url(#s)'/>" +
      "<ellipse cx='25' cy='38' rx='4' ry='7' fill='#fff' opacity='.55'/>"],
    play: [['r', 'c'],
      SHADOW +
      "<circle cx='32' cy='31' r='25' fill='url(#r)'/>" +
      "<path d='M26 20L45 31L26 42Z' fill='url(#c)' stroke='url(#c)' stroke-width='3' stroke-linejoin='round'/>"],
    mystere: [['n', 'c'],
      SHADOW +
      "<circle cx='32' cy='31' r='25' fill='url(#n)'/>" +
      "<text x='32' y='42' text-anchor='middle' font-family='Arial Black,Arial' font-weight='900' font-size='32' fill='url(#c)'>?</text>"],
    car: [['r', 's'],
      "<ellipse cx='32' cy='56' rx='28' ry='3' fill='#000' opacity='.3'/>" +
      "<path d='M6 48V40Q6 35 11 34L19 33L26 25Q28 23 31 23H43Q46 23 48 26L53 33Q59 34 59 40V48Z' fill='url(#r)'/>" +
      "<path d='M23 33L29 27H36V33Z M39 27H44L48 33H39Z' fill='url(#s)'/>" +
      "<circle cx='18' cy='49' r='6.5' fill='#0C1834'/><circle cx='47' cy='49' r='6.5' fill='#0C1834'/>" +
      "<circle cx='18' cy='49' r='2.5' fill='#D8C9AE'/><circle cx='47' cy='49' r='2.5' fill='#D8C9AE'/>" +
      "<rect x='55' y='37' width='4' height='3' rx='1.5' fill='#fff'/>"],
    van: [['n', 's'],
      "<ellipse cx='32' cy='56' rx='28' ry='3' fill='#000' opacity='.3'/>" +
      "<path d='M5 48V24Q5 19 10 19H42Q46 19 48 22L57 33Q59 35 59 38V48Z' fill='url(#n)'/>" +
      "<path d='M44 23L52 34H44Z' fill='url(#s)'/><rect x='10' y='24' width='28' height='9' rx='2.5' fill='url(#s)' opacity='.85'/>" +
      "<circle cx='17' cy='49' r='6.5' fill='#0C1834'/><circle cx='47' cy='49' r='6.5' fill='#0C1834'/>" +
      "<circle cx='17' cy='49' r='2.5' fill='#D8C9AE'/><circle cx='47' cy='49' r='2.5' fill='#D8C9AE'/>" +
      "<rect x='55' y='39' width='4' height='3' rx='1.5' fill='#fff'/>"],
  };
  var ALIAS = { sapin: 'tree', tour: 'tower', miroir: 'star', materiaux: 'dice', flocon: 'flake', etoile: 'star', cadeau: 'gift' };

  var cache = {};
  function uri(name) {
    name = ALIAS[name] || name;
    var a = ART[name];
    if (!a) return null;
    if (!cache[name]) {
      // Style 2D épuré : sans ombre portée ni reflets.
      var body = a[1]
        .replace(SHADOW, '')
        .replace(/<(rect|ellipse|circle|path)[^>]*fill='#fff' opacity='[^']*'[^>]*\/>/g, '')
        .replace(/<(rect|ellipse|circle|path)[^>]*stroke='#fff'[^>]*opacity='[^']*'[^>]*\/>/g, '')
        .replace(/<circle[^>]*fill='url\(#gl\)'[^>]*\/>/g, '')
        .replace(/Arial Black,Arial/g, 'Montserrat,Arial');
      cache[name] = 'data:image/svg+xml,' + encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>" + defs(a[0]) + body + '</svg>');
    }
    return cache[name];
  }

  function img(name, cls, alt) {
    var u = uri(name) || uri('star');
    return '<img class="art3d ' + (cls || '') + '" src="' + u + '" alt="' + esc(alt || '') + '"' + (alt ? '' : ' aria-hidden="true"') + ' draggable="false">';
  }

  /* ------------------------------------------------------------------ */
  /* Barnabé : portrait 3D, flouté tant qu'il n'est pas démasqué         */
  /* ------------------------------------------------------------------ */

  function unmasked() {
    var s = GQ.state || {};
    return !!(s.finished || s.quest > 4 || (s.quest === 4 && s.phase && s.phase[4] === 'success'));
  }
  function photo() {
    var Q = GQ.cfg.quetes || {};
    return (Q.enquete && Q.enquete.fiche && Q.enquete.fiche.photo) || 'assets/img/suspects/c.jpg';
  }
  function avatar(cls) {
    var m = unmasked();
    return '<span class="barnabe ' + (cls || '') + (m ? '' : ' is-masked') + '" aria-hidden="true"><img src="' + esc(photo()) + '" alt="" draggable="false"></span>';
  }

  /* ------------------------------------------------------------------ */
  /* Titres typographiques (à la place des lettres tricotées)            */
  /* ------------------------------------------------------------------ */

  function tone(color) {
    var c = String(color || '').toLowerCase();
    if (c === '#e4323a' || c === '#c8102e') return 'is-red';
    if (c === '#00ade1') return 'is-sky';
    return 'is-cream';
  }
  function ptext(text, opts) {
    opts = opts || {};
    var lines = String(text).split('\n').map(esc).join('<br>');
    return '<span class="ptext ' + tone(opts.color) + ' ' + (opts.cls || '') + '"' +
      (opts.alt ? ' role="img" aria-label="' + esc(opts.alt) + '"' : ' aria-hidden="true"') + '>' + lines + '</span>';
  }

  /* Décor : sapins, Tour Saint-Gobain, cadeau, étoile. */
  function scene(cls) {
    var items = [
      ['tree', 2, 34, 26], ['tower', 22, 0, 30], ['star', 50, 6, 13], ['gift', 56, 46, 22], ['tree', 78, 40, 20],
    ];
    return '<div class="scene3d ' + (cls || '') + '" aria-hidden="true">' +
      items.map(function (it, i) {
        return '<span class="scene3d-item" style="left:' + it[1] + '%;top:' + it[2] + '%;width:' + it[3] + '%;animation-delay:' + (i * 0.35).toFixed(2) + 's">' + img(it[0]) + '</span>';
      }).join('') +
      '<span class="scene3d-snow"></span></div>';
  }

  /* Remplacement des rendus tricot / pixel. */
  var K = GQ.knit;
  var knitIcon = K.icon;
  K.icon = function (name, cls, alt) {
    if (/^elf/.test(name)) return avatar(cls);
    if (uri(name)) return img(name, cls, alt);
    return knitIcon(name, cls, alt);
  };
  var knitSrc = K.src;
  // Images SVG (plateau) : le pion de l'équipe devient un repère rouge.
  K.src = function (name) {
    if (/^elf/.test(name)) return uri('pin');
    return uri(name) || knitSrc(name);
  };
  K.text = ptext;
  K.title = ptext;
  K.scene = scene;
  GQ.pix = function (name, cls) { return img(name, 'pix ' + (cls || '')); };
  GQ.art3d = { img: img, uri: uri, avatar: avatar, unmasked: unmasked, photo: photo };

  /* ------------------------------------------------------------------ */
  /* Guirlande lumineuse et skyline du pied de page                      */
  /* ------------------------------------------------------------------ */

  function svgUri(body, w, h) {
    return 'url("data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + ' ' + h + "' width='" + w + "' height='" + h + "'>" + body + '</svg>') + '")';
  }
  var BULBS = [[15, 12, '#E4323A'], [45, 14, '#2FC0EE'], [75, 5, '#F6EFE2'], [105, 3, '#E4323A']];
  var BULBS2 = [[15, 12, '#2FC0EE'], [45, 14, '#F6EFE2'], [75, 5, '#E4323A'], [105, 3, '#2FC0EE']];
  function bulbs(list, glow) {
    return list.map(function (b) {
      var x = b[0], y = b[1];
      return (glow ? "<circle cx='" + x + "' cy='" + (y + 10) + "' r='10' fill='" + b[2] + "' opacity='.35'/>" : '') +
        "<rect x='" + (x - 2.5) + "' y='" + (y - 1) + "' width='5' height='5' rx='1' fill='#2c3c63'/>" +
        "<ellipse cx='" + x + "' cy='" + (y + 9) + "' rx='4.2' ry='6.2' fill='" + b[2] + "'/>" +
        "<ellipse cx='" + (x - 1.3) + "' cy='" + (y + 7) + "' rx='1.3' ry='2.6' fill='#fff' opacity='.6'/>";
    }).join('');
  }
  var WIRE = "<path d='M0 6Q30 22 60 10T120 6' fill='none' stroke='#2c3c63' stroke-width='1.6'/>";
  var root = document.documentElement.style;
  root.setProperty('--knit-garland', svgUri(WIRE + bulbs(BULBS2, false), 120, 38));
  root.setProperty('--knit-lights', svgUri(WIRE + bulbs(BULBS, true), 120, 38));

  function skyline() {
    var w = 420, h = 72, out = '';
    out += "<defs><linearGradient id='b' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1d3f86'/><stop offset='1' stop-color='#0f2556'/></linearGradient>" +
      "<linearGradient id='t' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#8fe3ff'/><stop offset='1' stop-color='#1d6fb3'/></linearGradient>" +
      "<linearGradient id='sn' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffffff'/><stop offset='1' stop-color='#c9d8ee'/></linearGradient></defs>";
    // Immeubles (fond).
    [[8, 30, 34], [46, 22, 26], [176, 26, 30], [214, 36, 22], [300, 18, 30], [340, 30, 26], [380, 24, 32]].forEach(function (bd, i) {
      var x = bd[0], top = bd[1], bw = bd[2];
      out += "<rect x='" + x + "' y='" + top + "' width='" + bw + "' height='" + (h - top) + "' rx='3' fill='url(#b)'/>";
      for (var wy = top + 6; wy < h - 14; wy += 8) {
        for (var wx = x + 5; wx < x + bw - 5; wx += 8) {
          if ((wx * 7 + wy * 3 + i) % 5 < 2) out += "<rect x='" + wx + "' y='" + wy + "' width='4' height='4' rx='1' fill='" + ((wx + wy) % 3 ? '#f6efe2' : '#8fe3ff') + "' opacity='.75'/>";
        }
      }
    });
    // Tour Saint-Gobain (verre).
    out += "<path d='M110 72V14Q110 8 116 7L134 2V72Z' fill='url(#t)' opacity='.95'/><path d='M134 2L141 6V72H134Z' fill='#17428c'/>";
    for (var ty = 14; ty < 66; ty += 6) out += "<path d='M110 " + ty + "H134' stroke='#fff' stroke-width='.6' opacity='.35'/>";
    // Sapins arrondis.
    [[84, 46], [152, 50], [262, 44], [280, 52], [404, 48]].forEach(function (tr) {
      var x = tr[0], y = tr[1];
      out += "<path d='M" + x + ' ' + y + 'L' + (x + 9) + ' ' + (y + 17) + 'H' + (x - 9) + "Z' fill='#2fc0ee' opacity='.9'/>" +
        "<path d='M" + x + ' ' + (y - 8) + 'L' + (x + 7) + ' ' + (y + 6) + 'H' + (x - 7) + "Z' fill='#6fd3f5'/>";
    });
    // Sol enneigé.
    out += "<path d='M0 64Q60 58 120 63T240 62T360 63T420 64V72H0Z' fill='url(#sn)'/>";
    return svgUri(out, w, h);
  }
  root.setProperty('--knit-ground', skyline());
})();
