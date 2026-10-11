/* Écran de fin : scène 3D premium.
 * Le Père Noël en 3D (assets/img/pere-noel-3d.webp) dans une grande carte
 * en verre translucide bleu ciel, entouré de cadeaux en vraie 3D CSS qui
 * tournent et flottent, d'une étoile et de neige. La carte s'incline
 * doucement avec le doigt, la souris ou le téléphone (effet de profondeur).
 * Deux bulles de messagerie (config/quetes.js → traque.finBulles)
 * apparaissent l'une après l'autre.
 * Styles : css/styles.css (section « Fin 3D »). */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;
  var SANTA = 'assets/img/pere-noel-3d.webp';

  /* Un cadeau cubique : 6 faces positionnées en 3D, ruban en croix et
   * nœud sur le dessus. `c` : couleur (rouge, bleu ou ciel). */
  function gift(cls, c) {
    var faces = ['f', 'b', 'l', 'r', 't', 'u'].map(function (f) {
      return '<i class="g3-face g3x-' + f + '"></i>';
    }).join('');
    return '<span class="g3 ' + cls + ' g3-' + c + '" aria-hidden="true"><span class="g3-spin">' + faces +
      '<span class="g3-bow"><i></i><i></i></span></span></span>';
  }

  GQ.finShow = function () {
    var B = (GQ.cfg.quetes.traque || {}).finBulles || [];
    var flakes = '';
    for (var i = 0; i < 26; i++) {
      flakes += '<i style="left:' + ((i * 37) % 100) + '%;animation-delay:-' + ((i * 0.83) % 9).toFixed(2) + 's;animation-duration:' + (7 + (i % 5)) + 's;width:' + (i % 3 ? 4 : 7) + 'px;height:' + (i % 3 ? 4 : 7) + 'px"></i>';
    }
    var bubbles = B.slice(0, 2).map(function (b, k) {
      var who = /no[eë]l/i.test(b.qui || '') ? 'santa' : 'elves';
      return '<p class="f3-bubble f3-bubble-' + (k + 1) + ' is-' + who + '"><b>' + esc(b.qui || '') + '</b>' + GQ.t(b.texte) + '</p>';
    }).join('');
    return (
      '<div class="f3" data-f3>' +
      '<div class="f3-snow" aria-hidden="true">' + flakes + '</div>' +
      '<div class="f3-stage" data-f3-stage>' +
      '<div class="f3-card" aria-hidden="true">' +
      '<span class="f3-halo"></span>' +
      '<span class="f3-ring"></span>' +
      '<span class="f3-floor"></span>' +
      gift('g3-a', 'red') + gift('g3-b', 'sky') + gift('g3-c', 'blue') +
      '<span class="f3-star"><svg viewBox="0 0 40 40"><path d="M20 2l5.3 11.6 12.7 1.4-9.5 8.6 2.7 12.4L20 29.7 8.8 36l2.7-12.4L2 15l12.7-1.4z"/></svg></span>' +
      '<img class="f3-santa" src="' + SANTA + '" alt="" draggable="false">' +
      '</div>' +
      bubbles +
      '</div>' +
      '</div>'
    );
  };

  /* Inclinaison 3D : suit le doigt, la souris ou l'orientation du
   * téléphone. Sans mouvement réduit uniquement. */
  GQ.finTilt = function () {
    var root = document.querySelector('[data-f3-stage]');
    if (!root || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function set(x, y) { tx = Math.max(-1, Math.min(1, x)); ty = Math.max(-1, Math.min(1, y)); if (!raf) raf = requestAnimationFrame(step); }
    function step() {
      raf = 0;
      if (!root.isConnected) return;
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      root.style.setProperty('--rx', (-cy * 8).toFixed(2) + 'deg');
      root.style.setProperty('--ry', (cx * 10).toFixed(2) + 'deg');
      root.style.setProperty('--px', cx.toFixed(3));
      root.style.setProperty('--py', cy.toFixed(3));
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(step);
    }
    function pointer(e) {
      var r = root.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    }
    root.addEventListener('pointermove', pointer);
    root.addEventListener('pointerleave', function () { set(0, 0); });
    window.addEventListener('deviceorientation', function (e) {
      if (!root.isConnected || e.gamma == null) return;
      set(e.gamma / 25, (e.beta - 45) / 25);
    });
  };
})();
