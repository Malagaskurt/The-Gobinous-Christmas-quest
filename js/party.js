/* Gobinous Christmas Party (#/party) : code secret, présentation du
 * goûter et du sapin, puis la bucket list « Treats & Chill » : 20 défis à
 * valider par une photo ou une vidéo (appareil photo, caméra ou galerie).
 * Chaque défi validé rapporte des Gobz ; le serveur du jeu les compte et
 * tient le classement en direct. Sans serveur, les défis sont validés sur
 * le téléphone (à montrer aux organisateurs) et le classement est masqué.
 * Textes et défis : config/party.js. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var PC = GQ.cfg.party;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;
  var C = GQ.C;
  var screens = GQ.screens;
  var actions = GQ.actions;
  var forms = GQ.forms;
  var KEY = 'gobinous-club:party';
  var REFRESH_MS = 12000;

  /* ------------------------------------------------------------------ */
  /* État du joueur (sur ce téléphone)                                   */
  /* ------------------------------------------------------------------ */

  function newId() {
    var a = '';
    while (a.length < 16) a += Math.random().toString(36).slice(2);
    return a.slice(0, 16);
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.id) return Object.assign({ ok: false, nom: '', done: {} }, s);
    } catch (e) { /* pas de sauvegarde */ }
    return { id: newId(), ok: false, nom: '', done: {} };
  }
  var me = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(me)); } catch (e) { /* mémoire seule */ }
  }
  GQ.party = {
    state: function () { return me; },
    reset: function () { me = { id: newId(), ok: false, nom: '', done: {} }; save(); },
  };

  function defi(n) { return PC.defis[n - 1]; }
  function total() {
    return Object.keys(me.done).reduce(function (sum, n) { return sum + ((defi(Number(n)) || {}).points || 0); }, 0);
  }
  function money(n) { return n + ' ' + PC.monnaie; }

  /* ------------------------------------------------------------------ */
  /* Serveur : inscription, preuves, classement                          */
  /* ------------------------------------------------------------------ */

  var board = null; // classement : [{ id, nom, points, defis }]
  var online = null; // true / false / null (inconnu)

  function canServe() { return /^https?:/.test(location.protocol); }

  function fetchBoard() {
    if (!canServe()) { online = false; return Promise.resolve(); }
    return fetch(GQ.apiUrl('party/classement'), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('http');
      return r.json();
    }).then(function (d) {
      online = true;
      board = d.joueurs || [];
    }, function () { online = false; });
  }

  function register() {
    if (!canServe()) return Promise.resolve();
    return fetch(GQ.apiUrl('party/joueur'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: me.id, nom: me.nom }),
    }).then(function (r) { online = r.ok; }, function () { online = false; });
  }

  /* Envoi d'une preuve avec progression. Résolue { ok, offline } . */
  function upload(n, blob, onProgress, name) {
    return new Promise(function (resolve, reject) {
      if (!canServe() || online === false) return resolve({ offline: true });
      var xhr = new XMLHttpRequest();
      var url = GQ.apiUrl('party/preuve') + '?id=' + encodeURIComponent(me.id) + '&defi=' + n + '&nom=' + encodeURIComponent(me.nom) + '&fichier=' + encodeURIComponent(name || blob.name || '');
      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');
      xhr.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = function () {
        if (xhr.status === 200) return resolve({ ok: true });
        if (xhr.status === 404) { online = false; return resolve({ offline: true }); }
        reject(new Error(xhr.status === 413 ? 'lourd' : 'http'));
      };
      xhr.onerror = function () { reject(new Error('reseau')); };
      xhr.send(blob);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Préparation du fichier                                              */
  /* ------------------------------------------------------------------ */

  var MAX = 8 * 1024 * 1024 * 1024; // 8 Go : vidéos longues acceptées
  function isVideo(f) { return /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|mkv|avi|3gp|3g2|mts|m2ts|wmv|flv|mpe?g|hevc)$/i.test(f.name || ''); }
  function videoType(f) {
    if (f.type) return f.type;
    return /\.mov$/i.test(f.name) ? 'video/quicktime' : /\.webm$/i.test(f.name) ? 'video/webm' : 'video/mp4';
  }

  /* Photo → JPEG allégé (1600 px) ; vidéo → envoyée telle quelle. */
  function prepare(file) {
    if (isVideo(file)) {
      if (file.size > MAX) return Promise.reject(new Error('lourd'));
      var v = file.type ? file : new Blob([file], { type: videoType(file) });
      return Promise.resolve({ blob: v, video: true, preview: URL.createObjectURL(v), name: file.name || 'video' });
    }
    if (file.size > MAX) return Promise.reject(new Error('lourd'));
    return GQ.photoTools.process(file).then(function (img) {
      return fetch(img.full).then(function (r) { return r.blob(); }).then(function (b) {
        return { blob: b, video: false, preview: img.full, thumb: img.thumb, name: 'photo.jpg' };
      });
    }, function () {
      // Format que le navigateur ne sait pas afficher (HEIC, RAW…) : la photo
      // est envoyée telle quelle, sans aperçu.
      return { blob: file, video: false, preview: '', name: file.name || 'photo' };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Écrans                                                              */
  /* ------------------------------------------------------------------ */

  function header() {
    return GQ.clubHeader({ href: 'programme', label: 'Programme' });
  }

  function codeScreen() {
    return {
      key: 'party-code',
      bare: true,
      party: true,
      html:
        header() +
        '<main class="screen screen-plain">' +
        '<div class="center-head">' + GQ.knit.icon('tree', 'head-ico') + '<p class="kicker">Gobinous</p>' + C.knitTitle(PC.titre.replace(/^Christmas\s+/i, '')) + '</div>' +
        GQ.elfTalk('<p>' + t(PC.codeBulle) + '</p>') +
        C.textAnswer({ form: 'party-code', label: PC.codeLabel, button: 'Entrer', caps: true, max: 20, fieldCls: 'field-code', btnCls: 'btn-red', expected: [PC.code] }) +
        '</main>',
    };
  }

  function nameScreen() {
    if (GQ.ui.value == null && me.nom) GQ.ui.value = me.nom;
    return {
      key: 'party-name',
      bare: true,
      party: true,
      html:
        header() +
        '<main class="screen screen-plain">' +
        '<div class="center-head"><p class="kicker">Gobinous</p>' + C.knitTitle(PC.titre.replace(/^Christmas\s+/i, '')) + '</div>' +
        GQ.elfTalk('<p class="elf-talk-big">' + t(PC.bulle) + '</p><p>' + t(PC.texte) + '</p><p>' + t(PC.defiTexte) + '</p>') +
        C.textAnswer({ form: 'party-name', label: PC.nomLabel, button: PC.nomBouton, placeholder: PC.nomPlaceholder, max: 40, btnCls: 'btn-red' }) +
        '</main>',
    };
  }

  function rankOf() {
    if (!board) return null;
    for (var i = 0; i < board.length; i++) if (board[i].id === me.id) return i + 1;
    return null;
  }

  function scoreHtml() {
    var r = rankOf();
    return '<div class="gobz" data-gobz>' +
      '<p class="gobz-hello">' + esc(me.nom) + '</p>' +
      '<div class="gobz-count">' + GQ.pix('coin', 'gobz-coin') +
      '<span class="sr-only">' + esc(money(total())) + '</span>' +
      GQ.knit.text(String(total()), { alt: '', color: '#00ADE1', outline: true, cls: 'gobz-img' }) +
      '<span class="gobz-unit">' + esc(PC.monnaie) + '</span></div>' +
      '<p class="gobz-meta">' + Object.keys(me.done).length + ' / ' + PC.defis.length + ' défis' +
      (r ? ' · <b>' + (r === 1 ? '1er' : r + 'e') + '</b> sur ' + board.length : '') + '</p></div>';
  }

  function boardHtml() {
    var head = '<h2 class="section-title">' + GQ.pix('crown') + ' ' + t(PC.classementTitre) + '</h2>';
    if (online === false) return head + '<p class="muted small center">' + t(PC.classementHorsLigne) + '</p>';
    if (!board) return head + '<p class="muted small center">…</p>';
    var list = board.filter(function (x) { return x.points > 0 || x.id === me.id; });
    if (!list.length) return head + '<p class="muted small center">' + t(PC.classementVide) + '</p>';
    var top = list.slice(0, 10);
    var mine = rankOf();
    return head + '<ol class="ranking">' + top.map(function (x, i) {
      return '<li class="' + (x.id === me.id ? 'is-me' : '') + '"><span class="rank-n">' + (i + 1) + '</span>' +
        '<span class="rank-name">' + esc(x.nom) + '</span><span class="rank-pts">' + esc(money(x.points)) + '</span></li>';
    }).join('') + '</ol>' +
      (mine && mine > 10 ? '<p class="small center">Vous êtes <b>' + mine + 'e</b> avec ' + esc(money(total())) + '.</p>' : '');
  }

  function cardHtml(d, n) {
    var done = me.done[n];
    return '<li><button type="button" class="defi' + (done ? ' is-done' : '') + '" data-action="defi-open" data-n="' + n + '">' +
      '<span class="defi-num">' + n + '</span>' +
      '<span class="defi-body"><span class="defi-title">' + t(d.titre) + '</span>' +
      '<span class="defi-text">' + t(d.texte) + '</span></span>' +
      (done
        ? '<span class="defi-state">' + (done.thumb ? '<img src="' + done.thumb + '" alt="">' : GQ.pix(done.video ? 'play' : 'camera')) + icon('valide') + '</span>'
        : '<span class="defi-pts">+' + d.points + '<small>' + esc(PC.monnaie) + '</small></span>') +
      '</button></li>';
  }

  /* Aperçu de la preuve avant envoi. */
  function previewHtml(pv) {
    var d = defi(pv.n);
    var media = pv.video
      ? '<video src="' + esc(pv.preview) + '" controls playsinline muted></video>'
      : pv.preview ? '<img src="' + esc(pv.preview) + '" alt="Votre photo">' : '<p class="proof-noprev">' + icon('galerie') + ' Photo prête à l\'envoi</p>';
    return '<section class="proof" data-proof>' +
      '<p class="proof-title">' + GQ.pix('star') + ' Défi ' + pv.n + ' · ' + t(d.titre) + '</p>' +
      '<div class="proof-media">' + media + '</div>' +
      '<p class="proof-progress" data-progress' + (pv.sending ? '' : ' hidden') + '><i style="width:0"></i><span></span></p>' +
      C.feedbackSlot() +
      '<div class="btn-pair">' +
      C.btn(icon('valide') + esc(PC.boutonValider.replace('{points}', d.points).replace('{monnaie}', PC.monnaie)), 'defi-send', '', 'btn-red') +
      C.btn(esc(PC.boutonReprendre), 'defi-cancel', '', 'btn-secondary') +
      '</div></section>';
  }

  function listScreen() {
    var pv = GQ.ui.proof;
    return {
      key: 'party-list' + (pv ? '-proof-' + pv.n : ''),
      bare: true,
      party: true,
      html:
        header() +
        '<main class="screen screen-plain screen-party">' +
        scoreHtml() +
        (pv ? previewHtml(pv) : '') +
        '<div class="center-head party-list-head"><p class="kicker">' + t(PC.listeSousTitre) + '</p>' +
        C.knitTitle(PC.listeTitre) + '</div>' +
        '<ul class="defis">' + PC.defis.map(function (d, i) { return cardHtml(d, i + 1); }).join('') + '</ul>' +
        '<section class="party-board" data-board>' + boardHtml() + '</section>' +
        '<p class="center"><button type="button" class="btn btn-ghost" data-action="party-rename">Changer de nom</button></p>' +
        '</main>',
      after: function () {
        var tick = function () {
          fetchBoard().then(function () {
            var b = document.querySelector('[data-board]');
            if (b) b.innerHTML = boardHtml();
            var g = document.querySelector('[data-gobz]');
            if (g) g.outerHTML = scoreHtml();
          });
        };
        tick();
        GQ.every(REFRESH_MS, tick);
        if (pv) {
          var el = document.querySelector('[data-proof]');
          if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      },
    };
  }

  screens.party = function () {
    if (!me.ok) return codeScreen();
    if (!me.nom || GQ.ui.rename) return nameScreen();
    return listScreen();
  };

  /* ------------------------------------------------------------------ */
  /* Formulaires et actions                                              */
  /* ------------------------------------------------------------------ */

  forms['party-code'] = function (form, value) {
    var norm = function (s) { return String(s).toUpperCase().replace(/\s+/g, ''); };
    if (!value.trim()) return C.formError(value, GQ.cfg.textes.general.reponseVide);
    if (norm(value) !== norm(PC.code)) return C.formError(value, PC.codeErreur);
    me.ok = true;
    save();
    GQ.audio.sfx('unlock');
    GQ.uiReset();
    GQ.render();
  };

  forms['party-name'] = function (form, value) {
    if (!value.trim()) return C.formError(value, PC.nomErreur);
    me.nom = value.trim().slice(0, 40);
    save();
    register();
    GQ.uiReset();
    GQ.render();
  };

  actions['party-rename'] = function () {
    GQ.uiReset();
    GQ.ui.rename = true;
    GQ.render();
  };

  /* Fenêtre d'un défi : appareil photo, caméra (vidéo) ou galerie. */
  actions['defi-open'] = function (el) {
    var n = Number(el.dataset.n);
    var d = defi(n);
    if (!d) return;
    var done = me.done[n];
    // Appareil photo intégré (photo ou vidéo avec le son) et galerie.
    var canFilm = GQ.camera.canRecord();
    var photo = '<button type="button" class="btn ' + (d.video ? 'btn-secondary' : 'btn-red') + '" data-action="defi-camera" data-mode="photo" data-n="' + n + '">' + icon('photo') + esc(PC.boutonPhoto) + '</button>';
    var video = canFilm
      ? '<button type="button" class="btn ' + (d.video ? 'btn-red' : 'btn-secondary') + '" data-action="defi-camera" data-mode="video" data-n="' + n + '">' + icon('video') + esc(PC.boutonVideo) + '</button>'
      : '<label class="btn ' + (d.video ? 'btn-red' : 'btn-secondary') + ' btn-file">' + icon('video') + esc(PC.boutonVideo) +
        '<input type="file" accept="video/*" capture="environment" data-defi-file="' + n + '"></label>';
    var gallery = '<label class="btn btn-secondary btn-file">' + icon('galerie') + esc(PC.boutonGalerie) +
      '<input type="file" accept="image/*,video/*" data-defi-file="' + n + '"></label>';
    GQ.modal({
      title: d.titre,
      html: '<p class="defi-modal-pts">+' + d.points + ' ' + esc(PC.monnaie) + (done ? ' · ' + esc(PC.dejaValide) : '') + '</p>' +
        '<p>' + t(d.texte) + '</p>' +
        '<div class="defi-actions">' + (d.video ? video + photo : photo + video) + gallery + '</div>',
      cancel: 'Fermer',
    });
  };

  function choose(n, file) {
    if (GQ.closeModal) GQ.closeModal();
    if (!file) return;
    prepare(file).then(function (p) {
      GQ.uiReset();
      GQ.ui.proof = Object.assign({ n: n }, p);
      GQ.render();
    }, function (e) {
      GQ.toast(e && e.message === 'lourd' ? PC.tropLourd : GQ.cfg.quetes.photos.erreurPhoto, 'error');
    });
  }

  actions['defi-camera'] = function (el) {
    var n = Number(el.dataset.n);
    if (GQ.closeModal) GQ.closeModal();
    GQ.camera.open({ titre: defi(n).titre, video: true, mode: el.dataset.mode }).then(function (blob) {
      if (blob) choose(n, blob);
    });
  };

  document.addEventListener('change', function (e) {
    var input = e.target.closest && e.target.closest('[data-defi-file]');
    if (!input) return;
    choose(Number(input.getAttribute('data-defi-file')), input.files && input.files[0]);
  });

  actions['defi-cancel'] = function () {
    GQ.uiReset();
    GQ.render();
  };

  actions['defi-send'] = function (el) {
    var pv = GQ.ui.proof;
    if (!pv || pv.sending) return;
    pv.sending = true;
    el.disabled = true;
    var bar = document.querySelector('[data-progress]');
    if (bar) bar.hidden = false;
    var setPct = function (pct) {
      if (!bar) return;
      bar.querySelector('i').style.width = pct + '%';
      bar.querySelector('span').textContent = PC.envoiEnCours.replace('{pct}', pct);
    };
    setPct(0);
    upload(pv.n, pv.blob, setPct, pv.name).then(function (r) {
      me.done[pv.n] = { at: Date.now(), thumb: pv.thumb || null, video: pv.video, local: !!r.offline };
      save();
      var d = defi(pv.n);
      GQ.uiReset();
      GQ.render();
      GQ.audio.sfx('win');
      GQ.celebrate(false);
      GQ.toast('**' + PC.defiValide + '** +' + d.points + ' ' + PC.monnaie, 'info');
    }, function (e) {
      pv.sending = false;
      GQ.ui.msg = { kind: 'error', text: e.message === 'lourd' ? PC.tropLourd : PC.envoiErreur, shake: true };
      GQ.render();
    });
  };
})();
