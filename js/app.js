/* Routage, affichage et gestion des événements. */
(function () {
  'use strict';

  if (window.GQ_STOP) return;
  var GQ = window.GQ;
  var T = GQ.cfg.textes;
  var app = document.getElementById('app');
  var lastKey = null;
  var timers = [];
  var celebrated = {};

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /*   #/                accueil                                         */
  /*   #/equipe          nom de l'équipe                                 */
  /*   #/regles          règles                                          */
  /*   #/quete/N         quête N (redirige si elle n'est pas débloquée)  */
  /*   #/scan/CODE       arrivée sur un lieu (cible des QR codes)        */
  /*   #/organisateur    mode test (si activé)                           */
  /* ------------------------------------------------------------------ */

  var keepUiOnce = false;

  GQ.go = function (path, keepUi) {
    var target = '#/' + path;
    if (location.hash === target) {
      if (!keepUi) GQ.uiReset();
      GQ.render();
    } else {
      keepUiOnce = !!keepUi;
      location.hash = target;
    }
  };

  GQ.redirect = function (path) {
    setTimeout(function () {
      location.replace('#/' + path);
    }, 0);
  };

  GQ.every = function (ms, fn) {
    timers.push(setInterval(fn, ms));
  };

  function parseRoute() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    return { name: parts[0] || '', arg: parts[1] ? decodeURIComponent(parts[1]) : '' };
  }

  function resolve() {
    var r = parseRoute();
    var s = GQ.state;
    switch (r.name) {
      case '':
        return GQ.screens.home();
      case 'equipe':
        return GQ.screens.team();
      case 'regles':
        if (!s.team) return redirectTo('equipe');
        return GQ.screens.rules();
      case 'quete':
      case 'jeu':
        if (!s.team) return redirectTo('equipe');
        if (!s.rulesOk) return redirectTo('regles');
        return GQ.screens.quest(Number(r.arg) || s.quest);
      case 'scan':
        return GQ.screens.scan(r.arg);
      case 'organisateur':
        return GQ.screens.organizer(r.arg);
      default:
        return redirectTo('');
    }
  }

  function redirectTo(path) {
    GQ.redirect(path);
    return { key: 'redirect', html: '' };
  }

  /* ------------------------------------------------------------------ */
  /* Affichage                                                           */
  /* ------------------------------------------------------------------ */

  GQ.render = function () {
    timers.forEach(clearInterval);
    timers = [];
    var scr = resolve();
    if (scr.key === 'redirect') return;

    var html = '';
    if (!GQ.storageOk) {
      html += '<div class="storage-warning" role="alert">' + GQ.t(T.general.stockageIndisponible) + '</div>';
    }
    html += scr.bare ? scr.html : GQ.header(GQ.state.quest) + '<main class="screen screen-quest">' + scr.html + '</main>';
    if (GQ.test.isActive() && parseRoute().name !== 'organisateur') {
      html += '<a class="test-bar" href="#/organisateur">Mode test</a>';
    }
    app.innerHTML = html;
    document.body.classList.toggle('is-testing', GQ.test.isActive());

    var changed = scr.key !== lastKey;
    lastKey = scr.key;
    if (changed) {
      document.getElementById('fx').innerHTML = '';
      window.scrollTo(0, 0);
      var h = app.querySelector('h1[tabindex]');
      if (h) h.focus({ preventScroll: true });
    } else {
      // Même écran (ex. réponse incorrecte) : on met le message en évidence.
      var fb = app.querySelector('.feedback-slot .feedback');
      if (fb && fb.scrollIntoView) fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    if (scr.after) scr.after();
    if (scr.celebrate && !celebrated[scr.key]) {
      celebrated[scr.key] = true;
      GQ.celebrate(scr.celebrate === 'big');
    }
  };

  /* ------------------------------------------------------------------ */
  /* Événements                                                          */
  /* ------------------------------------------------------------------ */

  window.addEventListener('hashchange', function () {
    if (GQ.closeModal) GQ.closeModal();
    if (!keepUiOnce) GQ.uiReset();
    keepUiOnce = false;
    GQ.render();
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    var fn = GQ.actions[el.dataset.action];
    if (!fn) return;
    if (el.tagName !== 'INPUT') e.preventDefault();
    fn(el, e);
  });

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    var fn = GQ.forms[form.dataset.form];
    var input = form.querySelector('[name="answer"]');
    if (fn) fn(form, input ? input.value : '');
  });

  /* Un QR code scanné peut ouvrir un nouvel onglet : on synchronise les
   * onglets ouverts sur la même partie. */
  window.addEventListener('storage', function (e) {
    if (e.key !== GQ.storageKey) return;
    GQ.reload();
    GQ.render();
  });

  /* Retour sur l'onglet après une mise en veille : on rafraîchit
   * (compte à rebours du quiz, progression faite dans un autre onglet). */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !document.querySelector('.modal')) {
      GQ.reload();
      var active = document.activeElement;
      if (!(active && active.tagName === 'INPUT')) GQ.render();
    }
  });

  /* Police d'affichage : Lovelo Line si elle est installée ou fournie,
   * sinon effet « contour » appliqué à la police de remplacement. */
  if (document.fonts && document.fonts.load) {
    document.fonts.load('32px "Lovelo Line"').then(function (faces) {
      var ok = faces.some(function (f) { return f.status === 'loaded'; });
      document.documentElement.classList.toggle('has-lovelo', ok);
    }).catch(function () { /* police absente : effet contour conservé */ });
  }

  if (!window.GQ_STOP) GQ.render();
})();
