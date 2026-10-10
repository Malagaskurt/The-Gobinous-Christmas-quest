/* Mode test organisateur (#/organisateur) et affichettes des mots
 * secrets (#/organisateur/affiches). Accessible uniquement si
 * parametres.modeTest.actif vaut true. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var CFG = GQ.cfg;
  var P = CFG.parametres;
  var MT = P.modeTest || {};
  var esc = GQ.esc;
  var icon = GQ.icon;
  var screens = GQ.screens;
  var actions = GQ.actions;
  var forms = GQ.forms;

  /* L'activation du mode test est mémorisée pour l'onglet en cours
   * uniquement (sessionStorage) : fermer l'onglet suffit à en sortir. */
  var SKEY = GQ.storageKey + ':test';
  var memory = null;
  function read() {
    try { return JSON.parse(sessionStorage.getItem(SKEY)) || memory; } catch (e) { return memory; }
  }
  function write(v) {
    memory = v;
    try {
      if (v) sessionStorage.setItem(SKEY, JSON.stringify(v));
      else sessionStorage.removeItem(SKEY);
    } catch (e) { /* mémoire seule */ }
  }

  GQ.test = {
    isActive: function () { var s = read(); return !!(MT.actif && s && s.on); },
    opt: function (k) { var s = read(); return !!(s && s.opts && s.opts[k]); },
    setOpt: function (k, v) {
      var s = read() || { on: true, opts: {} };
      s.opts = s.opts || {};
      s.opts[k] = !!v;
      write(s);
    },
    enter: function () { write({ on: true, opts: { showAnswers: true, shortLock: true } }); },
    exit: function () { write(null); },
  };

  GQ.publicBaseUrl = function () {
    var u = String(P.urlPublique || '').trim();
    if (u) return u.split('#')[0];
    return location.href.split('#')[0];
  };

  /* ------------------------------------------------------------------ */
  /* Écrans                                                              */
  /* ------------------------------------------------------------------ */

  screens.organizer = function (sub) {
    if (!MT.actif) {
      GQ.redirect('');
      return { key: 'redirect', html: '' };
    }
    if (!GQ.test.isActive()) return login();
    return sub === 'affiches' ? posters() : panel();
  };

  function suiviLink() {
    if (P.suivi && P.suivi.actif === false) return '';
    return '<p><a class="btn btn-small btn-secondary" href="#/suivi">Suivi des équipes</a></p>';
  }

  function login() {
    return {
      key: 'org-login',
      bare: true,
      html:
        '<main class="screen screen-form">' +
        '<a class="back-link" href="#/">' + icon('retour') + 'Accueil</a>' +
        '<h1 class="page-title" tabindex="-1">Mode test organisateur</h1>' +
        '<p class="muted">Espace réservé aux organisateurs pour préparer et tester le parcours.</p>' +
        suiviLink() +
        '<form class="answer-form" data-form="test-login" novalidate autocomplete="off">' +
        '<label class="field-label" for="test-code">Code d\'accès</label>' +
        '<input class="field" id="test-code" name="answer" type="password" inputmode="numeric" autocomplete="off">' +
        (GQ.ui.msg ? '<p class="feedback feedback-error shake">' + icon('croix') + '<span>' + esc(GQ.ui.msg.text) + '</span></p>' : '') +
        '<button class="btn btn-primary" type="submit">Entrer</button></form>' +
        '</main>',
    };
  }

  function phaseLabel(n, ph) {
    return ({
      access: 'en route : saisie du mot secret de l\'étage', intro: 'introduction', themes: 'choix du thème', play: 'en jeu',
      result: 'résultat (thème raté)', success: 'réussite', floor: 'deviner l\'étage', video: 'vidéo', report: 'rapport (code du repaire)',
      found: 'lutin démasqué', call: 'appel de Barnabé', end: 'écran de fin', done: 'terminée',
    })[ph] || ph;
  }

  function row(k, v) { return '<tr><th scope="row">' + k + '</th><td>' + v + '</td></tr>'; }

  function panel() {
    var s = GQ.state;
    var q = s.quiz;
    var lock = GQ.quizLockRemaining();
    var report = window.GQValidate(CFG);
    var cur = q.current ? GQ.theme(q.current.themeId) : null;

    var stages = '';
    for (var k = 1; k <= GQ.QUEST_COUNT; k++) {
      var st = GQ.stage(k);
      var waiting = s.quest === k && s.phase[k] === 'access';
      stages +=
        '<tr><td><b>Quête ' + k + '</b><br><span class="small muted">' + esc(st.etage) + '</span></td>' +
        '<td><code>' + esc(st.motSecret) + '</code><br><span class="small muted">' + (s.arrivals[k] ? 'saisi ✓' : waiting ? 'attendu' : '—') + '</span></td>' +
        '<td>' + (waiting ? '<button type="button" class="btn btn-small btn-secondary" data-action="test-arrive" data-n="' + k + '">Saisir le mot</button>' : '') + '</td></tr>';
    }

    var jumps = '';
    for (var n = 1; n <= GQ.QUEST_COUNT; n++) {
      jumps += '<button type="button" class="btn btn-small btn-secondary" data-action="test-jump" data-n="' + n + '">Quête ' + n + '</button>';
    }

    function list(items, cls) {
      if (!items.length) return '<p class="small muted">Rien à signaler.</p>';
      return '<ul class="report ' + cls + '">' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
    }

    return {
      key: 'org-panel',
      bare: true,
      html:
        '<main class="screen screen-admin">' +
        '<p class="eyebrow">Gobinous Christmas Quest</p>' +
        '<h1 class="page-title" tabindex="-1">Mode test organisateur</h1>' +
        suiviLink() +
        '<p class="notice notice-warn">' + icon('cadenas') + '<span>Les actions ci-dessous modifient la partie enregistrée dans ce navigateur. ' +
        'Avant de confier ce téléphone à une équipe : <b>réinitialisez la partie</b> puis <b>quittez le mode test</b>.</span></p>' +

        '<section class="admin-card"><h2>État de la partie</h2><table class="kv">' +
        row('Équipe', s.team ? esc(s.team) : '<i>aucune</i>') +
        row('Quête en cours', s.finished ? 'Aventure terminée (' + esc(s.finished.by) + ')' : s.quest + ' · ' + phaseLabel(s.quest, s.phase[s.quest])) +
        row('Joker', s.joker.used ? 'utilisé (' + esc(s.joker.on) + ')' : 'disponible') +
        row('Chrono', s.clockStart ? GQ.mmss((GQ.clock() || { elapsed: 0 }).elapsed) + ' écoulées' : '<i>pas démarré</i>') +
        row('Quiz', (cur ? 'thème en cours : ' + esc(cur.titre) + ', question ' + (q.current.index + 1) + ', ' + q.current.answers.filter(function (a) { return a != null; }).length + ' réponse(s)<br>' : '') +
          q.attempts.length + ' tentative(s) · ' + q.failedSinceLock + ' échec(s) depuis le dernier blocage' +
          (lock ? '<br><b>Bloqué encore ' + Math.ceil(lock / 1000) + ' s</b>' + (q.passAfterLock ? ' (validé d\'office ensuite)' : '') : '') +
          (q.wonTheme ? '<br>Thème réussi : ' + esc((GQ.theme(q.wonTheme) || {}).titre || q.wonTheme) : '')) +
        row('Gel', GQ.freezeRemaining() ? '<b>gelé encore ' + Math.ceil(GQ.freezeRemaining() / 1000) + ' s</b> (' + esc(s.gel.key) + ', ' + esc(s.gel.after) + ')' : 'aucun') +
        row('Photos (quête 3)', GQ.photosValidated() + ' / ' + GQ.photoCount() + ' validée(s)' + (s.q3.rejected ? ' · caprice du lutin passé' : '')) +
        row('Sauvegarde', GQ.storageOk ? 'localStorage (ce navigateur uniquement)' : '<b>indisponible</b> (navigation privée ?)') +
        '</table>' +
        '<div class="btn-row">' + '<button type="button" class="btn btn-small btn-primary" data-action="resume">Ouvrir la partie</button>' +
        '<a class="btn btn-small btn-secondary" href="#/">Accueil</a></div></section>' +

        '<section class="admin-card"><h2>Aller directement à une quête</h2>' +
        '<p class="small muted">Ouvre l\'introduction de la quête (mot secret déjà saisi) ; les quêtes précédentes sont marquées comme terminées. Sert aussi à reprendre une partie sur un autre téléphone.</p>' +
        '<div class="btn-row">' + jumps + '</div></section>' +

        '<section class="admin-card"><h2>Options de test</h2>' +
        '<label class="check"><input type="checkbox" data-action="test-opt" data-opt="showAnswers"' + (GQ.test.opt('showAnswers') ? ' checked' : '') + '> Afficher les bonnes réponses</label>' +
        '<label class="check"><input type="checkbox" data-action="test-opt" data-opt="shortLock"' + (GQ.test.opt('shortLock') ? ' checked' : '') + '> Blocage court du quiz et des gels (' + (MT.dureeBlocageCourtSecondes || 15) + ' s au lieu de ' + P.quiz.dureeBlocageSecondes + ' s)</label>' +
        '</section>' +

        '<section class="admin-card"><h2>Quiz</h2><div class="btn-row">' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-lock">Déclencher le blocage</button>' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-unlock">Lever le blocage</button>' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-reset-quiz">Effacer les tentatives</button>' +
        '</div></section>' +

        '<section class="admin-card"><h2>Gel des autres étapes</h2>' +
        '<p class="small muted">Étage à deviner, message codé, modules de l\'enquête, code du repaire.</p><div class="btn-row">' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-unfreeze">Lever le gel</button>' +
        '</div></section>' +

        '<section class="admin-card"><h2>Chrono global</h2><div class="btn-row">' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-clock" data-v="reset">Remettre à zéro</button>' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-clock" data-v="5">Avancer de 5 min</button>' +
        '</div></section>' +

        '<section class="admin-card"><h2>Joker</h2><div class="btn-row">' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-joker" data-v="0">Rendre le joker</button>' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-joker" data-v="1">Marquer comme utilisé</button>' +
        '</div></section>' +

        '<section class="admin-card"><h2>Étages et mots secrets</h2>' +
        '<p class="small muted">Chaque quête démarre quand l\'équipe saisit le mot secret affiché à son étage (config/etapes.js).</p>' +
        '<table class="places">' + stages + '</table>' +
        '<div class="btn-row"><a class="btn btn-small btn-primary" href="#/organisateur/affiches">' + icon('pin') + 'Affichettes des mots secrets à imprimer</a></div></section>' +

        '<section class="admin-card"><h2>Fin de partie</h2><div class="btn-row">' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-finish" data-v="1">Marquer « Aventure terminée »</button>' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-finish" data-v="0">Annuler la fin</button>' +
        '</div></section>' +

        '<section class="admin-card"><h2>Vérification du contenu</h2>' +
        '<h3>Erreurs (' + report.errors.length + ')</h3>' + list(report.errors, 'is-error') +
        '<h3>Avertissements (' + report.warnings.length + ')</h3>' + list(report.warnings, 'is-warn') +
        '<h3>Textes provisoires [À CONFIGURER] (' + report.todos.length + ')</h3>' + list(report.todos, '') +
        '<h3>Informations à vérifier (' + report.toVerify.length + ')</h3>' + list(report.toVerify, '') +
        '</section>' +

        '<section class="admin-card admin-danger"><h2>Remise à zéro</h2><div class="btn-row">' +
        '<button type="button" class="btn btn-small btn-danger" data-action="test-reset">Réinitialiser la partie</button>' +
        '<button type="button" class="btn btn-small btn-secondary" data-action="test-exit">Quitter le mode test</button>' +
        '</div></section>' +
        '</main>',
    };
  }

  /* Affichettes A4 : une par étage, avec le mot secret en grand. */
  function posters() {
    var cards = '';
    for (var k = 1; k <= GQ.QUEST_COUNT; k++) {
      var st = GQ.stage(k);
      cards +=
        '<article class="qr-card poster">' +
        '<p class="qr-kicker">Gobinous Christmas Quest · ' + esc(st.etage) + '</p>' +
        '<p class="poster-label">Mot secret de l\'étage</p>' +
        '<p class="poster-word">' + esc(String(st.motSecret).toUpperCase()) + '</p>' +
        '<p class="qr-help">Saisissez ce mot dans l\'application pour débloquer la quête ' + k + '.</p>' +
        GQ.logo('fonce', 'qr-logo') +
        '</article>';
    }
    return {
      key: 'org-posters',
      bare: true,
      html:
        '<main class="screen screen-qr">' +
        '<div class="no-print">' +
        '<a class="back-link" href="#/organisateur">' + icon('retour') + 'Mode test</a>' +
        '<h1 class="page-title" tabindex="-1">Affichettes des mots secrets</h1>' +
        '<p class="muted small">Une page A4 par étage, à afficher bien en vue à l\'arrivée des équipes.</p>' +
        '<button type="button" class="btn btn-primary" data-action="print">Imprimer</button></div>' +
        '<div class="qr-grid">' + cards + '</div>' +
        '</main>',
    };
  }

  /* ------------------------------------------------------------------ */
  /* Actions du mode test                                                */
  /* ------------------------------------------------------------------ */

  function guard() {
    if (!GQ.test.isActive()) { GQ.go(''); return false; }
    return true;
  }
  function done(msg) {
    GQ.save();
    if (msg) GQ.toast(msg, 'info');
    GQ.render();
  }

  forms['test-login'] = function (form, value) {
    if (!MT.actif) return GQ.go('');
    if (String(value).trim() !== String(MT.code)) {
      GQ.ui.msg = { text: 'Code incorrect.' };
      return GQ.render();
    }
    GQ.test.enter();
    GQ.uiReset();
    GQ.render();
  };

  actions['test-jump'] = function (el) {
    if (!guard()) return;
    var n = Number(el.dataset.n);
    GQ.jumpTo(n);
    GQ.uiReset();
    GQ.go('quete/' + n);
  };

  actions['test-opt'] = function (el) {
    if (!guard()) return;
    GQ.test.setOpt(el.dataset.opt, el.checked);
  };

  actions['test-lock'] = function () {
    if (!guard()) return;
    var q = GQ.state.quiz;
    if (q.current) GQ.quizAbandon();
    GQ.quizLock();
    if (GQ.state.quest === 1 && GQ.state.phase[1] !== 'intro') GQ.state.phase[1] = 'themes';
    done('Quiz bloqué pendant ' + Math.round(q.lockTotal / 1000) + ' s.');
  };

  actions['test-clock'] = function (el) {
    if (!guard()) return;
    var s = GQ.state;
    if (el.dataset.v === 'reset' || !s.clockStart) s.clockStart = Date.now();
    if (el.dataset.v === '5') s.clockStart -= 5 * 60000;
    done('Chrono mis à jour.');
  };

  actions['test-unlock'] = function () {
    if (!guard()) return;
    GQ.state.quiz.lockUntil = 0;
    done('Blocage levé.');
  };

  actions['test-unfreeze'] = function () {
    if (!guard()) return;
    GQ.state.gel.until = 0;
    done('Gel levé.');
  };

  actions['test-reset-quiz'] = function () {
    if (!guard()) return;
    var q = GQ.state.quiz;
    q.current = null;
    q.attempts = [];
    q.failedSinceLock = 0;
    q.lockUntil = 0;
    q.passAfterLock = false;
    if (GQ.state.quest === 1 && GQ.state.phase[1] !== 'intro') {
      q.wonTheme = null;
      GQ.state.phase[1] = 'themes';
    }
    done('Tentatives du quiz effacées.');
  };

  actions['test-joker'] = function (el) {
    if (!guard()) return;
    GQ.state.joker = el.dataset.v === '1'
      ? { used: true, on: 'mode-test', at: Date.now() }
      : { used: false, on: null, at: null };
    done(el.dataset.v === '1' ? 'Joker marqué comme utilisé.' : 'Joker rendu.');
  };

  actions['test-finish'] = function (el) {
    if (!guard()) return;
    if (el.dataset.v === '1') {
      if (!GQ.state.team) GQ.jumpTo(5);
      GQ.finish('test');
      GQ.uiReset();
      GQ.go('quete/5');
    } else {
      GQ.state.finished = null;
      done('Fin de partie annulée.');
    }
  };

  actions['test-reset'] = function () {
    if (!guard()) return;
    GQ.modal({
      title: 'Réinitialiser la partie ?',
      text: 'Tout ce que ce téléphone a enregistré sera effacé : partie, défis de la Party, avis, envois du Vlog.',
      confirm: 'Réinitialiser',
      cancel: 'Annuler',
      icon: 'cadenas',
    }).then(function (ok) {
      if (!ok) return;
      GQ.resetGame();
      // Tout le reste de ce téléphone aussi : Party, avis, Vlog.
      if (GQ.wipeLocal) GQ.wipeLocal();
      GQ.uiReset();
      done('Partie réinitialisée.');
    });
  };

  actions['test-exit'] = function () {
    GQ.test.exit();
    GQ.uiReset();
    GQ.go('');
  };

  actions['test-arrive'] = function (el) {
    if (!guard()) return;
    var n = Number(el.dataset.n);
    GQ.unlockQuest(n, GQ.stage(n).motSecret);
    GQ.uiReset();
    GQ.go('quete/' + n);
  };

  actions.print = function () { window.print(); };
})();
