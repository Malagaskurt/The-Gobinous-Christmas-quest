/* Suivi des équipes, côté téléphone : envoie régulièrement un résumé de
 * la progression au serveur du jeu et applique une réinitialisation
 * demandée par les organisateurs. Sans serveur (hébergement statique,
 * fichier local, réseau coupé), les envois échouent en silence et le jeu
 * continue normalement. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var CFG = GQ.cfg;
  var P = CFG.parametres;
  var S = P.suivi || {};
  var enabled = S.actif !== false && /^https?:/.test(location.protocol);

  /* Adresse de l'API : serveur indiqué, ou dossier du site. */
  GQ.apiUrl = function (path) {
    var base = String(S.urlServeur || '').trim() || location.href.split('#')[0].replace(/[^/]*$/, '');
    return base.replace(/\/?$/, '/') + 'api/' + path;
  };

  /* Étape en cours, en clair, pour le tableau de bord. */
  function stepLabel(s) {
    if (s.finished) return 'Aventure terminée';
    var n = s.quest;
    var ph = s.phase[n];
    var placeId = GQ.placeIdForQuest(n);
    var place = placeId ? GQ.place(placeId) : null;
    if (ph === 'location') return 'Cherche le lieu ' + placeId;
    if (ph === 'travel') return 'En route vers le lieu ' + placeId + (place ? ' (' + place.nom + ')' : '');
    if (n === 1) {
      var q = s.quiz;
      if (ph === 'intro') return 'Quiz : introduction';
      if (ph === 'play' && q.current) {
        var th = GQ.theme(q.current.themeId);
        return 'Quiz : « ' + (th ? th.titre : '') + ' », question ' + (q.current.index + 1) + '/' + (th ? th.questions.length : 8);
      }
      if (ph === 'result') return 'Quiz : thème raté';
      if (ph === 'success') return 'Quiz réussi';
      return GQ.quizLockRemaining() ? 'Quiz gelé' : 'Quiz : choix du thème';
    }
    if (n === 2) return ph === 'success' ? 'Énigme résolue' : ph === 'enigma' ? 'Énigme mystère' : 'Énigme : introduction';
    if (n === 3) {
      var total = (CFG.quetes.defi.questions || []).length;
      if (ph === 'play') return 'Défi : question ' + Math.min(total, s.defi.index + 1) + '/' + total;
      return ph === 'success' ? 'Défi relevé' : 'Défi : introduction';
    }
    if (n === 4) return ph === 'success' ? 'Lieu final trouvé' : ph === 'enigma' ? 'Énigme finale' : 'Dernier indice : introduction';
    return 'Devant la hotte';
  }

  function summary() {
    var s = GQ.state;
    var c = GQ.clock();
    var places = 0;
    Object.keys(s.places).forEach(function (id) { if (s.places[id] && s.places[id].arrived) places++; });
    return {
      id: s.id,
      equipe: s.team,
      quete: s.quest,
      etape: stepLabel(s),
      termine: !!s.finished,
      joker: !!s.joker.used,
      chrono: !!c,
      ecoule: c ? c.elapsed : 0,
      gelRestant: Math.max(GQ.freezeRemaining(), GQ.quizLockRemaining()),
      quizEchecs: s.quiz.attempts.filter(function (a) { return a.result === 'echec'; }).length,
      lieux: places,
      test: !!(GQ.test && GQ.test.isActive()),
    };
  }

  function post(path, data) {
    return fetch(GQ.apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).then(function (r) { return r.ok ? r.json() : null; });
  }

  var busy = false;
  var timer = null;

  /* Réinitialisation demandée depuis le tableau de bord. */
  function applyReset() {
    GQ.resetGame();
    if (GQ.test) GQ.test.exit();
    if (GQ.closeModal) GQ.closeModal();
    GQ.uiReset();
    GQ.go('');
    GQ.toast(CFG.textes.general.partieReinitialisee, 'info');
  }

  GQ.sync = {
    enabled: enabled,
    online: null,
    /* Envoi immédiat (retourne une promesse). */
    push: function () {
      var s = GQ.state;
      if (!enabled || !s || !s.team || busy) return Promise.resolve();
      busy = true;
      return post('sync', summary()).then(function (r) {
        GQ.sync.online = !!r;
        if (r && r.reset) applyReset();
      }).catch(function () {
        GQ.sync.online = false;
      }).then(function () { busy = false; });
    },
    /* Envoi groupé après une modification de la partie. */
    schedule: function () {
      if (!enabled) return;
      clearTimeout(timer);
      timer = setTimeout(GQ.sync.push, 800);
    },
    /* Retire une partie abandonnée du tableau de bord. */
    forget: function (id) {
      if (!enabled) return;
      post('oublier', { id: id }).catch(function () { /* hors ligne */ });
    },
  };

  if (!enabled) return;

  var save = GQ.save;
  GQ.save = function () {
    save();
    GQ.sync.schedule();
  };

  setInterval(GQ.sync.push, Math.max(3, Number(S.intervalleSecondes) || 10) * 1000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') GQ.sync.push();
  });
  setTimeout(GQ.sync.push, 1000);
})();
