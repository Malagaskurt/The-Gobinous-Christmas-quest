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
    ['parametres', 'textes', 'quiz', 'quetes', 'etapes'].forEach(function (k) {
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

    function checkMcq(q, label) {
      if (!q || typeof q.question !== 'string' || !q.question.trim()) err(label + ' : texte de la question manquant.');
      checkChoice(q, label);
      if (q && q.aVerifier) report.toVerify.push(label + ' — ' + q.aVerifier);
    }

    function checkChoice(q, label) {
      if (!Array.isArray(q.choix) || q.choix.length < 2 || q.choix.length > 4) {
        err(label + ' : la liste "choix" doit contenir de 2 à 4 propositions.');
        return;
      }
      var idx = LETTERS.indexOf(String(q.reponse || '').trim().toUpperCase());
      if (idx === -1 || idx >= q.choix.length) {
        err(label + ' : "reponse" doit être une lettre parmi ' + LETTERS.slice(0, q.choix.length).split('').join(', ') + '.');
      }
    }

    function checkAnswers(list, label) {
      if (!Array.isArray(list) || !list.filter(String).length) err(label + ' : la liste "reponses" est vide.');
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
        t.questions.forEach(function (q, qi) { checkMcq(q, tl + ', question ' + (qi + 1)); });
      });
    }
    if (!cfg.quiz.etage) err('config/quiz.js : bloc "etage" manquant.');
    else checkAnswers(cfg.quiz.etage.reponses, 'Quiz, étage à deviner');

    var Q = cfg.quetes;
    ['message', 'photos', 'enquete', 'traque'].forEach(function (k) {
      if (!Q[k]) err('config/quetes.js : bloc "' + k + '" manquant.');
    });
    if (report.errors.length) return report;

    // Quête 2
    checkAnswers(Q.message.reponses, 'Quête 2');
    (Q.message.lignes || []).forEach(function (l, i) {
      if (/[^A-Za-z\s]/.test(String(l))) warn('Quête 2, ligne ' + (i + 1) + ' : seules les lettres A à Z sont chiffrées (accents et ponctuation ignorés).');
    });
    // Quête 3
    var models = Q.photos.modeles || [];
    if (models.length < (Q.photos.nombre || 3)) err('Quête 3 : moins de modèles que de photos à prendre.');
    models.forEach(function (m, i) { if (!m.id || !m.image) err('Quête 3, modèle ' + (i + 1) + ' : "id" ou "image" manquant.'); });
    // Quête 4
    (Q.enquete.modules || []).forEach(function (m, i) {
      var ml = 'Quête 4, module ' + (i + 1);
      if (m.choix) checkChoice(m, ml);
      else checkAnswers(m.reponses, ml);
      if (m.aVerifier) report.toVerify.push(ml + ' — ' + m.aVerifier);
    });
    // Quête 5
    checkAnswers(Q.traque.reponses, 'Quête 5');
    var avantTokyo = [Q.traque.titre, Q.traque.avertissementTitre, Q.traque.avertissement, Q.traque.rapportTitre, Q.traque.rapport, Q.traque.conclusion, Q.traque.label, Q.traque.unEssai, Q.traque.gelSuite, Q.traque.indiceJoker, cfg.etapes[5] && cfg.etapes[5].histoire, cfg.etapes[5] && cfg.etapes[5].lieu]
      .concat(Q.traque.indices || [])
      .concat((Q.traque.sousTitres || []).map(function (x) { return x.texte; }));
    if (avantTokyo.some(function (x) { return /\b(salle|porte)s?\b/i.test(String(x || '')); })) {
      err('Quête 5 : un texte affiché avant la découverte du repaire contient « salle » ou « porte ».');
    }

    // Étages et mots secrets
    var seen = {};
    for (var n = 1; n <= 5; n++) {
      var st = cfg.etapes[n];
      if (!st) { err('config/etapes.js : étape ' + n + ' manquante.'); continue; }
      var w = String(st.motSecret || '').trim().toUpperCase();
      if (!w) err('Étape ' + n + ' : "motSecret" manquant.');
      else if (seen[w]) err('Étape ' + n + ' : le mot secret "' + w + '" est déjà utilisé par l\'étape ' + seen[w] + '.');
      seen[w] = n;
      if (!String(st.histoire || '').trim()) warn('Étape ' + n + ' : aucun texte "histoire".');
    }

    // Paramètres
    var P = cfg.parametres;
    var pq = P.quiz || {};
    if (!(pq.tentativesAvantBlocage >= 1)) err('parametres.quiz.tentativesAvantBlocage doit être un nombre ≥ 1.');
    if (!(pq.dureeBlocageSecondes >= 0)) err('parametres.quiz.dureeBlocageSecondes doit être un nombre ≥ 0.');
    ['etage', 'message', 'enquete', 'repaire'].forEach(function (k) {
      var r = (P.penalites || {})[k];
      if (!r) return err('parametres.penalites.' + k + ' manquant.');
      if (!(r.essais >= 1)) err('parametres.penalites.' + k + '.essais doit être un nombre ≥ 1.');
      if (!(r.gelSecondes >= 0)) err('parametres.penalites.' + k + '.gelSecondes doit être un nombre ≥ 0.');
      if (['valider', 'reessayer'].indexOf(r.apresGel) === -1) err('parametres.penalites.' + k + '.apresGel doit valoir "valider" ou "reessayer".');
    });
    if (P.chrono && P.chrono.actif !== false && !(P.chrono.dureeMinutes > 0)) {
      err('parametres.chrono.dureeMinutes doit être un nombre de minutes > 0.');
    }
    if (P.modeTest && P.modeTest.actif) {
      warn('Le mode test est actif (parametres.modeTest.actif). Désactivez-le ou changez son code avant l\'événement.');
    }

    // Christmas Party
    var PA = cfg.party;
    if (PA) {
      if (!String(PA.code || '').trim()) err('party.code : code secret manquant.');
      (PA.defis || []).forEach(function (d, i) {
        if (!String(d.titre || '').trim() || !String(d.texte || '').trim()) err('party.defis[' + (i + 1) + '] : titre ou texte manquant.');
        if (!(Number(d.points) > 0)) err('party.defis[' + (i + 1) + '].points doit être un nombre > 0.');
      });
      if (!(PA.defis || []).length) err('party.defis : aucun défi.');
    }

    // Christmas Wrap-Up
    var WU = cfg.wrapup;
    if (WU) {
      var qs = WU.questions || [];
      if (qs.length > 5) warn('wrapup.questions : ' + qs.length + ' questions (5 maximum conseillé).');
      var ids = {};
      qs.forEach(function (q, i) {
        var where = 'wrapup.questions[' + (i + 1) + ']';
        if (!/^[a-z0-9_-]{1,30}$/i.test(q.id || '')) err(where + '.id invalide (lettres, chiffres, tirets).');
        if (ids[q.id]) err(where + '.id en double : ' + q.id);
        ids[q.id] = true;
        if (['etoiles', 'echelle', 'choix', 'texte'].indexOf(q.type) === -1) err(where + '.type doit valoir etoiles, echelle, choix ou texte.');
        if (q.type === 'choix' && !((q.options || []).length >= 2)) err(where + '.options : au moins 2 propositions.');
      });
    }
    return report;
  }

  root.GQValidate = validateConfig;
})(typeof window !== 'undefined' ? window : globalThis);
