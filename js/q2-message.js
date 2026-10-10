/* Quête 2 : le message codé (chiffre « Pigpen », dit franc-maçon).
 * Les symboles sont dessinés en SVG à partir du texte de config/quetes.js :
 *   A-I : grille de 9 cases ; J-R : même grille avec un point ;
 *   S-V : croix ; W-Z : croix avec un point.
 * Le symbole d'une lettre reprend les traits qui entourent sa case. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var C = GQ.C;
  var M = GQ.cfg.quetes.message;
  var T = GQ.cfg.textes;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;

  /* Géométrie d'une lettre : { type: 'grid'|'x', cell, dot } */
  function glyph(ch) {
    var i = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(ch);
    if (i < 0) return null;
    if (i < 18) return { type: 'grid', cell: i % 9, dot: i >= 9 };
    return { type: 'x', cell: (i - 18) % 4, dot: i >= 22 }; // 0 haut, 1 gauche, 2 droite, 3 bas
  }

  /* Symbole d'une lettre dans un carré de 40 × 40. */
  function symbolPaths(ch) {
    var g = glyph(ch);
    if (!g) return '';
    var a = 6, b = 34, mid = 20;
    var p = '';
    if (g.type === 'grid') {
      var r = Math.floor(g.cell / 3), c = g.cell % 3;
      if (r > 0) p += 'M' + a + ' ' + a + 'H' + b;          // trait du haut
      if (r < 2) p += 'M' + a + ' ' + b + 'H' + b;          // trait du bas
      if (c > 0) p += 'M' + a + ' ' + a + 'V' + b;          // trait de gauche
      if (c < 2) p += 'M' + b + ' ' + a + 'V' + b;          // trait de droite
      return '<path d="' + p + '"/>' + (g.dot ? '<circle cx="' + mid + '" cy="' + mid + '" r="3.2"/>' : '');
    }
    // Croix : deux branches qui se rejoignent vers le centre de la croix.
    var shapes = [
      'M' + a + ' ' + a + 'L' + mid + ' ' + b + 'L' + b + ' ' + a,  // haut (S, W) : V
      'M' + a + ' ' + a + 'L' + b + ' ' + mid + 'L' + a + ' ' + b,  // gauche (T, X) : >
      'M' + b + ' ' + a + 'L' + a + ' ' + mid + 'L' + b + ' ' + b,  // droite (U, Y) : <
      'M' + a + ' ' + b + 'L' + mid + ' ' + a + 'L' + b + ' ' + b,  // bas (V, Z) : ∧
    ];
    var dots = [[mid, 14], [15, mid], [25, mid], [mid, 26]];
    return '<path d="' + shapes[g.cell] + '"/>' + (g.dot ? '<circle cx="' + dots[g.cell][0] + '" cy="' + dots[g.cell][1] + '" r="3.2"/>' : '');
  }

  function symbol(ch, cls) {
    return '<svg class="pig ' + (cls || '') + '" viewBox="0 0 40 40" aria-hidden="true">' + symbolPaths(ch) + '</svg>';
  }

  /* Message chiffré : une ligne par entrée de config, un mot par bloc. */
  function cipher(lines) {
    return '<div class="pig-message" role="img" aria-label="Message chiffré en ' + lines.length + ' lignes">' +
      lines.map(function (line) {
        return '<p class="pig-line">' + String(line).toUpperCase().split(/\s+/).filter(Boolean).map(function (w) {
          return '<span class="pig-word">' + GQ.normalize(w).toUpperCase().replace(/[^A-Z]/g, '').split('').map(function (ch) { return symbol(ch); }).join('') + '</span>';
        }).join('') + '</p>';
      }).join('') + '</div>';
  }

  /* Grilles de décodage (clé de lecture). */
  function gridKey(dot) {
    var letters = dot ? 'JKLMNOPQR' : 'ABCDEFGHI';
    var s = '<svg class="pig-key" viewBox="0 0 120 120" aria-hidden="true">' +
      '<path class="key-line" d="M40 4V116M80 4V116M4 40H116M4 80H116"/>';
    for (var i = 0; i < 9; i++) {
      var x = (i % 3) * 40 + 20, y = Math.floor(i / 3) * 40 + 20;
      s += '<text x="' + (dot ? x - 5 : x) + '" y="' + (y + 7) + '">' + letters[i] + '</text>';
      if (dot) s += '<circle cx="' + (x + 11) + '" cy="' + (y + 1) + '" r="3"/>';
    }
    return s + '</svg>';
  }

  function crossKey(dot) {
    var letters = dot ? 'WXYZ' : 'STUV';
    var pos = [[60, 30], [28, 64], [92, 64], [60, 98]];
    var dots = [[60, 44], [44, 60], [76, 60], [60, 76]];
    var s = '<svg class="pig-key" viewBox="0 0 120 120" aria-hidden="true">' +
      '<path class="key-line" d="M14 14L106 106M106 14L14 106"/>';
    for (var i = 0; i < 4; i++) {
      s += '<text x="' + pos[i][0] + '" y="' + pos[i][1] + '">' + letters[i] + '</text>';
      if (dot) s += '<circle cx="' + dots[i][0] + '" cy="' + dots[i][1] + '" r="3"/>';
    }
    return s + '</svg>';
  }

  function decoder() {
    return '<div class="pig-keys" role="img" aria-label="Grille de décodage : lettres A à I dans une grille, J à R dans une grille avec points, S à V dans une croix, W à Z dans une croix avec points">' +
      gridKey(false) + gridKey(true) + crossKey(false) + crossKey(true) + '</div>';
  }

  GQ.pigpen = { symbol: symbol, cipher: cipher, decoder: decoder };

  /* ------------------------------------------------------------------ */
  /* Écrans                                                              */
  /* ------------------------------------------------------------------ */

  function playScreen() {
    var gel = GQ.freezeRemaining();
    var html =
      C.questHead(2) +
      (gel ? C.freezeView({ suite: M.gelSuite }) : '') +
      (M.consigne ? '<p class="muted center">' + t(M.consigne) + '</p>' : '') +
      '<div class="pig-card' + (gel ? ' is-frosted' : '') + '">' + cipher(M.lignes) + '</div>' +
      '<p class="card-label center-label">' + icon('loupe') + esc(M.grilleTitre) + '</p>' +
      '<div class="pig-card pig-card-key">' + decoder() + '</div>';
    if (!gel) {
      html += GQ.jokerBlock('q2', M.indiceJoker) +
        C.textAnswer({ form: 'message', label: M.label, button: M.bouton, caps: true, max: 80, expected: M.reponses });
    }
    return {
      key: 'q2-play' + (gel ? '-gel' : ''),
      frozen: !!gel,
      elf: gel ? { say: 'blocage' } : null,
      after: gel ? C.freezeAfter : null,
      html: html,
    };
  }

  GQ.questScreens[2] = function () {
    GQ.freezeCheck();
    var ph = GQ.state.phase[2];
    if (ph === 'play') return playScreen();
    if (ph === 'success') {
      var f = GQ.state.q2.forced;
      return {
        key: 'q2-success',
        celebrate: true,
        elf: { say: 'reussite' },
        html: C.successBlock({
          art: f ? GQ.knit.icon('flake', 'success-ico') : GQ.knit.icon('loupe', 'success-ico'),
          title: f ? M.reussiteApresGelTitre : M.reussiteTitre,
          html: (f ? '<p class="degel">' + t(GQ.phrase('degel', 'q2')) + '</p>' : '') + '<p>' + t(f ? M.reussiteApresGelTexte : M.reussiteTexte) + '</p>',
          cta: C.btn(esc(M.bouton2) + icon('fleche'), 'complete-quest', ' data-n="2"', 'btn-red'),
        }),
      };
    }
    return C.introScreen(2);
  };

  GQ.forms.message = function (form, value) {
    if (!value.trim()) return C.formError(value, T.general.reponseVide);
    var res = GQ.messageAnswer(value);
    if (!res) return GQ.render();
    GQ.uiReset();
    if (res.ok || res.frozen) return GQ.render();
    C.formError(value, C.wrongText(res.left, M.erreur));
  };
})();
