/* Tableau de bord des organisateurs (#/suivi) : avancement de chaque
 * équipe en direct et réinitialisation à distance. Les données viennent
 * du serveur du jeu (tools/serve.mjs) ; le code d'accès est vérifié par
 * le serveur. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var P = GQ.cfg.parametres;
  var S = P.suivi || {};
  var esc = GQ.esc;
  var icon = GQ.icon;
  var screens = GQ.screens;
  var actions = GQ.actions;
  var forms = GQ.forms;
  var REFRESH_MS = 4000;

  /* Code mémorisé pour l'onglet en cours uniquement. */
  var CKEY = GQ.storageKey + ':suivi';
  var memo = '';
  function getCode() {
    try { return sessionStorage.getItem(CKEY) || memo; } catch (e) { return memo; }
  }
  function setCode(v) {
    memo = v || '';
    try {
      if (v) sessionStorage.setItem(CKEY, v);
      else sessionStorage.removeItem(CKEY);
    } catch (e) { /* mémoire seule */ }
  }

  var data = null; // { now, equipes, recuLocal }
  var gallery = null; // photos du défi photo : [{ id, equipe, photos: [{ modele, titre, url }] }]
  var error = '';

  function request(method, path) {
    return fetch(GQ.apiUrl(path), {
      method: method,
      headers: { 'X-Code-Suivi': getCode() },
      cache: 'no-store',
    }).then(function (r) {
      if (r.status === 401) { var e = new Error('code'); e.code = 401; throw e; }
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    });
  }

  function load() {
    return request('GET', 'equipes').then(function (d) {
      d.recuLocal = Date.now();
      data = d;
      error = '';
      return request('GET', 'photos').then(function (p) { gallery = p.equipes; }, function () { /* sans photos */ });
    }).catch(function (e) {
      if (e.code === 401) { setCode(''); data = null; error = 'Code incorrect.'; throw e; }
      error = 'Serveur de suivi injoignable. Le suivi nécessite le serveur du jeu (npm start, voir README).';
    });
  }

  /* ------------------------------------------------------------------ */
  /* Affichage                                                           */
  /* ------------------------------------------------------------------ */

  function ago(ms) {
    var sec = Math.max(0, Math.round(ms / 1000));
    if (sec < 60) return sec + ' s';
    var m = Math.floor(sec / 60);
    return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  }

  function teamCard(t, now) {
    var since = now - t.recuLe;
    var interval = Math.max(3, Number(S.intervalleSecondes) || 10) * 1000;
    var offline = !t.termine && since > Math.max(30000, interval * 3);
    var elapsed = t.ecoule + (t.chrono && !t.termine ? since : 0);
    var gel = t.gelRestant - since;
    var badges = '';
    if (t.resetDemande) badges += '<span class="tag tag-warn">Réinitialisation en attente</span>';
    if (t.termine) badges += '<span class="tag tag-ok">Terminée</span>';
    else if (gel > 0) badges += '<span class="tag tag-cold">Gelée ' + Math.ceil(gel / 1000) + ' s</span>';
    if (offline) badges += '<span class="tag tag-off">Sans nouvelles depuis ' + ago(since) + '</span>';
    if (t.test) badges += '<span class="tag">Mode test</span>';
    var pips = '';
    for (var n = 1; n <= GQ.QUEST_COUNT; n++) {
      var st = t.termine || n < t.quete ? 'done' : n === t.quete ? 'current' : 'todo';
      pips += '<i class="pip pip-' + st + '" title="Quête ' + n + '"></i>';
    }
    return (
      '<article class="team-card' + (t.termine ? ' is-done' : '') + '">' +
      '<div class="team-head"><h3 class="team-name">' + esc(t.equipe || 'Sans nom') + '</h3>' +
      '<span class="team-quest">' + (t.termine ? '5/5' : 'Quête ' + t.quete + '/5') + '</span></div>' +
      (t.chef || t.reporter ? '<p class="team-roles">' + (t.chef ? 'Chef Lutin : <b>' + esc(t.chef) + '</b>' : '') + (t.chef && t.reporter ? ' · ' : '') + (t.reporter ? 'Reporter : <b>' + esc(t.reporter) + '</b>' : '') + '</p>' : '') +
      '<div class="pips" aria-hidden="true">' + pips + '</div>' +
      '<p class="team-step">' + esc(t.etape) + '</p>' +
      (badges ? '<p class="tags">' + badges + '</p>' : '') +
      '<dl class="team-facts">' +
      '<div><dt>Temps</dt><dd>' + (t.chrono ? GQ.mmss(elapsed) : '—') + '</dd></div>' +
      '<div><dt>Étages</dt><dd>' + (t.etages || 0) + '/5</dd></div>' +
      '<div><dt>Photos</dt><dd>' + (t.photos || 0) + '/3</dd></div>' +
      '<div><dt>Joker</dt><dd>' + (t.joker ? 'utilisé' : 'disponible') + '</dd></div>' +
      '<div><dt>Quiz ratés</dt><dd>' + t.quizEchecs + '</dd></div>' +
      '<div><dt>Vu il y a</dt><dd>' + ago(since) + '</dd></div>' +
      '</dl>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-small btn-danger" data-action="suivi-reset" data-id="' + esc(t.id) + '"' + (t.resetDemande ? ' disabled' : '') + '>Réinitialiser</button>' +
      '<button type="button" class="btn btn-small btn-secondary" data-action="suivi-remove" data-id="' + esc(t.id) + '">Retirer de la liste</button>' +
      '</div></article>'
    );
  }

  function sorted(list) {
    return list.slice().sort(function (a, b) {
      if (a.termine !== b.termine) return a.termine ? -1 : 1;
      if (a.termine) return a.ecoule - b.ecoule;
      return b.quete - a.quete || (b.etages || 0) - (a.etages || 0) || String(a.equipe).localeCompare(String(b.equipe), 'fr');
    });
  }

  function listHtml() {
    if (error) return '<p class="notice notice-warn">' + icon('cadenas') + '<span>' + esc(error) + '</span></p>';
    if (!data) return '<p class="muted">Chargement…</p>';
    // Horloge du serveur, avancée du temps écoulé depuis la réponse.
    var now = data.now + (Date.now() - data.recuLocal);
    var list = sorted(data.equipes);
    var done = list.filter(function (t) { return t.termine; }).length;
    return (
      '<p class="suivi-summary"><b>' + list.length + '</b> équipe(s) · <b>' + done + '</b> terminée(s)' +
      '<span class="small">Mis à jour à ' + new Date().toLocaleTimeString('fr-FR') + '</span></p>' +
      (list.length
        ? '<div class="team-grid">' + list.map(function (t) { return teamCard(t, now); }).join('') + '</div>'
        : '<p class="admin-card muted">Aucune équipe pour l\'instant. Elles apparaissent dès qu\'elles ont saisi leur nom.</p>')
    );
  }

  /* Galerie du défi photo : vignettes par équipe et export ZIP. */
  function withCode(url) {
    return GQ.apiUrl(url.replace(/^api\//, '')) + '?code=' + encodeURIComponent(getCode());
  }

  function galleryHtml() {
    if (!gallery) return '';
    var total = gallery.reduce(function (n, t) { return n + t.photos.length; }, 0);
    return (
      '<section class="admin-card gallery"><h2>Photos du défi photo (' + total + ')</h2>' +
      (total
        ? '<p class="small muted">Touchez une photo pour l\'ouvrir en grand. L\'archive ZIP classe les photos par équipe.</p>' +
          '<div class="btn-row"><a class="btn btn-small btn-primary" href="' + esc(withCode('api/photos.zip')) + '" download>' + icon('photo') + 'Télécharger toutes les photos (ZIP)</a></div>' +
          gallery.filter(function (t) { return t.photos.length; }).map(function (t) {
            return '<h3>' + esc(t.equipe || 'Sans nom') + ' · ' + t.photos.length + ' photo(s)</h3><ul class="thumbs">' +
              t.photos.map(function (p) {
                var u = esc(withCode(p.url));
                return '<li><a href="' + u + '" target="_blank" rel="noopener"><img src="' + u + '" alt="' + esc(p.titre || p.modele) + '" loading="lazy"></a><span>' + esc(p.titre || p.modele) + '</span></li>';
              }).join('') + '</ul>';
          }).join('')
        : '<p class="small muted">Aucune photo pour l\'instant. Elles arrivent ici dès qu\'une équipe valide une photo (quête 3).</p>') +
      '</section>'
    );
  }

  var lastGallery = '';
  function refreshList() {
    var el = document.getElementById('suivi-list');
    if (el) el.innerHTML = listHtml();
    // La galerie n'est redessinée que si elle change (évite le clignotement).
    var g = document.getElementById('suivi-gallery');
    var html = galleryHtml();
    if (g && html !== lastGallery) { g.innerHTML = html; lastGallery = html; }
  }

  function login() {
    return {
      key: 'suivi-login',
      bare: true,
      html:
        '<main class="screen screen-form">' +
        '<a class="back-link" href="#/">' + icon('retour') + 'Accueil</a>' +
        '<h1 class="page-title" tabindex="-1">Suivi des équipes</h1>' +
        '<p class="muted">Espace réservé aux organisateurs : avancement de chaque équipe en direct.</p>' +
        '<form class="answer-form" data-form="suivi-login" novalidate autocomplete="off">' +
        '<label class="field-label" for="suivi-code">Code de suivi</label>' +
        '<input class="field" id="suivi-code" name="answer" type="password" autocapitalize="characters" autocomplete="off">' +
        (error ? '<p class="feedback feedback-error shake">' + icon('croix') + '<span>' + esc(error) + '</span></p>' : '') +
        '<button class="btn btn-primary" type="submit">Entrer</button></form>' +
        '</main>',
    };
  }

  screens.suivi = function () {
    if (S.actif === false) {
      GQ.redirect('');
      return { key: 'redirect', html: '' };
    }
    if (!getCode()) return login();
    return {
      key: 'suivi',
      bare: true,
      wide: true,
      html:
        '<main class="screen screen-admin screen-suivi">' +
        '<p class="eyebrow">Gobinous Christmas Quest</p>' +
        '<h1 class="page-title" tabindex="-1">Suivi des équipes</h1>' +
        '<p class="small muted">Actualisation automatique toutes les ' + REFRESH_MS / 1000 + ' secondes. ' +
        '« Réinitialiser » efface la partie sur le téléphone de l\'équipe à sa prochaine connexion (quelques secondes) : elle repart de l\'accueil.</p>' +
        '<div id="suivi-list">' + listHtml() + '</div>' +
        '<div id="suivi-gallery">' + (lastGallery = galleryHtml()) + '</div>' +
        '<div class="btn-row">' +
        (P.modeTest && P.modeTest.actif ? '<a class="btn btn-small btn-secondary" href="#/organisateur">Mode test</a>' : '') +
        '<button type="button" class="btn btn-small btn-secondary" data-action="suivi-logout">Se déconnecter</button></div>' +
        '</main>',
      after: function () {
        var tick = function () {
          load().then(refreshList, function () { GQ.render(); });
        };
        tick();
        GQ.every(REFRESH_MS, tick);
      },
    };
  };

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */

  forms['suivi-login'] = function (form, value) {
    var code = String(value).trim();
    if (!code) { error = 'Saisissez le code de suivi.'; return GQ.render(); }
    setCode(code);
    load().then(function () {
      if (!error) GQ.uiReset();
      if (error) setCode('');
      GQ.render();
    }, function () { GQ.render(); });
  };

  function teamName(id) {
    var t = data && data.equipes.filter(function (x) { return x.id === id; })[0];
    return t ? t.equipe : 'cette équipe';
  }

  actions['suivi-reset'] = function (el) {
    var id = el.dataset.id;
    GQ.modal({
      title: 'Réinitialiser « ' + teamName(id) + ' » ?',
      text: 'Toute la progression de l\'équipe sera effacée (quêtes, joker, chrono). Son téléphone reviendra à l\'accueil et elle devra recommencer.',
      confirm: 'Oui, réinitialiser',
      cancel: 'Annuler',
      icon: 'cadenas',
    }).then(function (ok) {
      if (!ok) return;
      request('POST', 'equipes/' + encodeURIComponent(id) + '/reinitialiser').then(function () {
        GQ.toast('Réinitialisation envoyée : elle s\'appliquera dès que le téléphone se reconnecte.', 'info');
      }).catch(function () {
        GQ.toast('Impossible de joindre le serveur.', 'error');
      }).then(function () { return load(); }).then(refreshList, function () { GQ.render(); });
    });
  };

  actions['suivi-remove'] = function (el) {
    var id = el.dataset.id;
    GQ.modal({
      title: 'Retirer « ' + teamName(id) + ' » de la liste ?',
      text: 'La partie n\'est pas effacée sur le téléphone : si l\'équipe joue encore, elle réapparaîtra à sa prochaine connexion.',
      confirm: 'Retirer',
      cancel: 'Annuler',
      icon: 'croix',
    }).then(function (ok) {
      if (!ok) return;
      request('DELETE', 'equipes/' + encodeURIComponent(id)).catch(function () {
        GQ.toast('Impossible de joindre le serveur.', 'error');
      }).then(function () { return load(); }).then(refreshList, function () { GQ.render(); });
    });
  };

  actions['suivi-logout'] = function () {
    setCode('');
    data = null;
    error = '';
    GQ.go('');
  };
})();
