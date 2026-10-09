/* Le lutin qui a caché le cadeau. Il se promène de temps en temps sous
 * l'en-tête, passe la tête sur le côté pour commenter certaines étapes et
 * répond quand on le touche. Il ne bloque jamais l'interface. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var P = GQ.cfg.parametres;
  var cfg = P.lutin || {};
  var TL = GQ.cfg.textes.lutin || {};
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPEED = 70; // pixels par seconde
  var root, sprite, bubble;
  var frameTimer, hideTimer, schedTimer, reactTimer;
  var state = 'hidden'; // 'hidden' | 'walk' | 'peek'

  function enabled() { return cfg.actif !== false; }

  function pick(v) {
    if (Array.isArray(v)) return v[Math.floor(Math.random() * v.length)] || '';
    return v || '';
  }

  function ensure() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'elf';
    root.className = 'elf';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '<div class="elf-bubble"></div><img class="elf-sprite pixel" alt="">';
    document.body.appendChild(root);
    sprite = root.querySelector('.elf-sprite');
    bubble = root.querySelector('.elf-bubble');
    sprite.addEventListener('click', function () { say(pick(TL.clic), 2600); });
    root.addEventListener('transitionend', function (e) {
      if (e.target !== root || e.propertyName !== 'transform') return;
      if (state === 'walk') hide();
    });
  }

  function frame(name) { sprite.src = GQ.pixel.src(name); }

  function legs(on) {
    clearInterval(frameTimer);
    if (!on) return;
    var f = 0;
    frameTimer = setInterval(function () { f = 1 - f; frame(f ? 'elfWalk2' : 'elfWalk1'); }, 170);
  }

  function say(text, ms) {
    if (!root || !text) return;
    bubble.innerHTML = GQ.t(text);
    // La bulle s'ouvre du côté où il reste de la place.
    var r = root.getBoundingClientRect();
    var col = column();
    root.classList.toggle('bubble-left', r.left + r.width / 2 > (col.left + col.right) / 2);
    root.classList.add('has-bubble');
    clearTimeout(say.t);
    say.t = setTimeout(function () { if (root) root.classList.remove('has-bubble'); }, ms || 3800);
  }

  function column() {
    var app = document.getElementById('app').getBoundingClientRect();
    return { left: Math.max(0, app.left), right: Math.min(window.innerWidth, app.right) };
  }

  function busy() {
    return document.hidden || document.getElementById('modal-root').classList.contains('is-open') || document.getElementById('loader');
  }

  function hide() {
    if (!root) return;
    legs(false);
    clearTimeout(hideTimer);
    root.className = 'elf';
    root.style.transition = 'none';
    root.style.transform = '';
    state = 'hidden';
  }

  /* Traversée de l'écran. opts.anchor : élément sur lequel marcher
   * (par défaut, juste sous l'en-tête). */
  function walk(opts) {
    opts = opts || {};
    if (!enabled() || reduceMotion || state !== 'hidden' || busy()) return;
    if (!opts.anchor && document.querySelector('.choices')) return; // pas pendant une question
    var h = 60;
    var top;
    if (opts.anchor) {
      // Marche sur l'élément indiqué (ex. la bande tricotée de l'accueil).
      var anchor = document.querySelector(opts.anchor);
      if (!anchor) return;
      top = anchor.getBoundingClientRect().top - h + 4;
    } else {
      // Sous l'en-tête et sa guirlande (ou sous la barre fixe une fois défilé).
      var bar = document.querySelector('.topbar');
      var garland = document.querySelector('.garland');
      if (!bar) return;
      top = Math.max(bar.getBoundingClientRect().bottom, garland ? garland.getBoundingClientRect().bottom : 0) + 6;
    }
    ensure();
    var col = column();
    if (top < 0 || top > window.innerHeight - h) return;
    var toRight = Math.random() < 0.6;
    var start = toRight ? col.left - 60 : col.right + 10;
    var end = toRight ? col.right + 10 : col.left - 60;
    state = 'walk';
    root.className = 'elf is-walking' + (toRight ? '' : ' is-left');
    root.style.top = top + 'px';
    root.style.left = '0px';
    root.style.transition = 'none';
    root.style.transform = 'translateX(' + start + 'px)';
    frame('elfWalk1');
    legs(true);
    void root.offsetWidth;
    root.style.transition = 'transform ' + (Math.abs(end - start) / SPEED).toFixed(1) + 's linear';
    root.style.transform = 'translateX(' + end + 'px)';
    if (opts.say) setTimeout(function () { if (state === 'walk') say(opts.say, 3000); }, 1400);
  }

  /* Le lutin passe la tête sur le bord droit avec une bulle. */
  function peek(text, ms) {
    if (!enabled() || busy()) return;
    ensure();
    hide();
    var col = column();
    state = 'peek';
    frame('elfWave');
    root.className = 'elf is-peek';
    root.style.transition = '';
    root.style.transform = '';
    root.style.top = '';
    root.style.left = (col.right - 66) + 'px';
    void root.offsetWidth;
    root.classList.add('is-in');
    say(text, (ms || 4200) - 400);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (!root) return;
      root.classList.remove('is-in');
      setTimeout(function () { if (state === 'peek') hide(); }, 450);
    }, ms || 4200);
  }

  /* Promenades régulières sur les écrans de jeu. */
  function schedule() {
    clearTimeout(schedTimer);
    if (!enabled()) return;
    var base = (Number(cfg.promenadeSecondes) || 50) * 1000;
    schedTimer = setTimeout(function () {
      walk();
      schedule();
    }, base * (0.7 + Math.random() * 0.6));
  }

  GQ.elf = {
    walk: walk,
    peek: peek,
    hide: hide,
    schedule: schedule,
    /* Réaction prévue par un écran : { say: clé ou texte } ou { walk: ancre }. */
    react: function (spec) {
      clearTimeout(reactTimer);
      if (!spec || !enabled()) return;
      var delay = document.getElementById('loader') ? 2900 : 700;
      reactTimer = setTimeout(function () {
        if (spec.walk) walk({ anchor: spec.walk, say: spec.say ? pick(TL[spec.say] || spec.say) : '' });
        else if (spec.say) peek(pick(TL[spec.say] || spec.say));
      }, delay);
    },
    line: function (key) { return pick(TL[key]); },
  };
})();
