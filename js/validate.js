/* Vérification de la configuration.
 * Utilisé par le mode test (dans le navigateur) et par `npm run check`
 * (tools/check-config.mjs). Ne modifie rien : se contente de signaler. */
(function (root) {
  'use strict';

  var PLACEHOLDER = '[À CONFIGURER]';
  var LETTERS = 'ABCD';

  function validateConfig(cfg) {
    var report = { errors: [], warnings: [], todos: [], toVerify: [] };
    var err = function (m) { report.errors.push(m); };
    var warn = function (m) { report.warnings.push(m); };

    if (!cfg) {
      err('Configuration introuvable (window.GAME_CONFIG).');
      return report;
    }
    ['parametres', 'textes', 'quiz', 'quetes', 'lieux'].forEach(function (k) {
      if (!cfg[k]) err('Fichier manquant ou invalide : config/' + k + '.js');
    });
    if (report.errors.length) return report;

    // Textes provisoires restant à remplacer.
    (function walk(node, path) {
      if (typeof node === 'string') {
        if (node.indexOf(PLACEHOLDER) !== -1) report.todos.push(path);
      } else if (Array.isArray(node)) {
        node.forEach(function (v, i) { walk(v, path + '[' + i + ']'); });
      } else if (node && typeof node === 'object') {
        Object.keys(node).forEach(function (k) { walk(node[k], path ? path + '.' + k : k); });
      }
    })(cfg, '');

    function checkMcq(q, label, expectedChoices) {
      if (!q || typeof q.question !== 'string' || !q.question.trim()) err(label + ' : texte de la question manquant.');
      if (!Array.isArray(q.choix) || q.choix.length < 2) {
        err(label + ' : la liste "choix" doit contenir au moins 2 propositions.');
        return;
      }
      if (expectedChoices && q.choix.length !== expectedChoices) {
        warn(label + ' : ' + q.choix.length + ' propositions (' + expectedChoices + ' attendues).');
      }
      var idx = LETTERS.indexOf(String(q.reponse || '').trim().toUpperCase());
      if (idx === -1 || idx >= q.choix.length) {
        err(label + ' : "reponse" doit être une lettre parmi ' + LETTERS.slice(0, q.choix.length).split('').join(', ') + '.');
      }
      if (q.aVerifier) report.toVerify.push(label + ' — ' + q.aVerifier);
    }

    // Quête 1 : quiz
    var themes = cfg.quiz.themes;
    if (!Array.isArray(themes) || !themes.length) {
      err('quiz.themes : aucun thème défini.');
    } else {
      var ids = {};
      themes.forEach(function (t, ti) {
        var tl = 'Quiz, thème « ' + (t.titre || ti + 1) + ' »';
        if (!t.id) err(tl + ' : identifiant "id" manquant.');
        else if (ids[t.id]) err(tl + ' : identifiant "' + t.id + '" utilisé deux fois.');
        ids[t.id] = true;
        if (!Array.isArray(t.questions) || !t.questions.length) {
          err(tl + ' : aucune question.');
          return;
        }
        if (t.questions.length !== 8) warn(tl + ' : ' + t.questions.length + ' questions (8 attendues).');
        t.questions.forEach(function (q, qi) {
          checkMcq(q, tl + ', question ' + (qi + 1), qi === 7 ? 4 : 3);
        });
      });
    }

    var Q = cfg.quetes;
    ['enigme', 'defi', 'dernierIndice', 'hotte'].forEach(function (k) {
      if (!Q[k]) err('config/quetes.js : bloc "' + k + '" manquant.');
    });
    if (report.errors.length) return report;

    // Quête 2
    if (!Array.isArray(Q.enigme.reponses) || !Q.enigme.reponses.filter(String).length) {
      err('Quête 2 : la liste "reponses" de l\'énigme est vide.');
    }
    // Quête 3
    if (!Array.isArray(Q.defi.questions) || !Q.defi.questions.length) {
      err('Quête 3 : aucune question.');
    } else {
      if (Q.defi.questions.length !== 3) warn('Quête 3 : ' + Q.defi.questions.length + ' questions (3 attendues).');
      Q.defi.questions.forEach(function (q, qi) { checkMcq(q, 'Quête 3, question ' + (qi + 1), 3); });
    }

    // Lieux
    var L = cfg.lieux;
    var refs = [
      ['Quête 1 (quiz.lieu)', cfg.quiz.lieu],
      ['Quête 2 (quetes.enigme.lieu)', Q.enigme.lieu],
      ['Quête 3 (quetes.defi.lieu)', Q.defi.lieu],
      ['Quête 4 (quetes.dernierIndice.lieu)', Q.dernierIndice.lieu],
    ];
    var seen = {};
    refs.forEach(function (r) {
      if (!r[1] || !L[r[1]]) err(r[0] + ' : le lieu "' + r[1] + '" n\'existe pas dans config/lieux.js.');
      else if (seen[r[1]]) err(r[0] + ' : le lieu "' + r[1] + '" est déjà utilisé par une autre quête.');
      seen[r[1]] = true;
    });
    var codes = {};
    Object.keys(L).forEach(function (id) {
      var p = L[id];
      var pl = 'Lieu ' + id;
      if (!p.nom) err(pl + ' : "nom" manquant.');
      if (!Array.isArray(p.reponsesAcceptees) || !p.reponsesAcceptees.filter(String).length) {
        err(pl + ' : la liste "reponsesAcceptees" est vide.');
      }
      var code = String(p.codeQR || '').trim().toUpperCase();
      if (!code) err(pl + ' : "codeQR" manquant.');
      else if (!/^[A-Z0-9-]+$/.test(code)) err(pl + ' : "codeQR" ne doit contenir que des lettres, chiffres ou tirets.');
      else if (codes[code]) err(pl + ' : le code QR "' + code + '" est déjà utilisé par le lieu ' + codes[code] + '.');
      codes[code] = id;
      if (id !== Q.dernierIndice.lieu && !String(p.indice || '').trim()) warn(pl + ' : aucun indice défini.');
    });

    // Paramètres
    var P = cfg.parametres;
    var pq = P.quiz || {};
    if (!(pq.tentativesAvantBlocage >= 1)) err('parametres.quiz.tentativesAvantBlocage doit être un nombre ≥ 1.');
    if (!(pq.dureeBlocageSecondes >= 0)) err('parametres.quiz.dureeBlocageSecondes doit être un nombre ≥ 0.');
    if (pq.erreursAutoriseesParTheme !== null && pq.erreursAutoriseesParTheme !== undefined &&
        !(pq.erreursAutoriseesParTheme >= 0)) {
      err('parametres.quiz.erreursAutoriseesParTheme doit valoir null ou un nombre ≥ 0.');
    }
    var fin = P.finDePartie || {};
    if (!fin.codeOrganisateur && !fin.qrFinalActif) {
      warn('Fin de partie : ni code organisateur ni QR final actif, la partie ne pourra pas être marquée comme terminée.');
    }
    if (P.modeTest && P.modeTest.actif) {
      warn('Le mode test est actif (parametres.modeTest.actif). Désactivez-le ou changez son code avant l\'événement.');
    }
    return report;
  }

  root.GQValidate = validateConfig;
})(typeof window !== 'undefined' ? window : globalThis);
