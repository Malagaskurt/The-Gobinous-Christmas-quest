/* Le Vlog des Gobinous (#/vlog) : dépôt des photos et vidéos de
 * l'événement, tous formats, vidéos longues comprises. Les fichiers sont
 * envoyés tels quels, un par un, avec une barre de progression ; l'écran
 * reste allumé pendant l'envoi quand le téléphone le permet.
 * Textes : config/vlog.js. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var V = GQ.cfg.vlog;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;
  var C = GQ.C;
  var KEY = 'gobinous-club:vlog';

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.id) return s;
    } catch (e) { /* rien */ }
    var a = '';
    while (a.length < 16) a += Math.random().toString(36).slice(2);
    return { id: a.slice(0, 16), nom: '' };
  }
  var me = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(me)); } catch (e) { /* mémoire seule */ }
  }

  var queue = []; // { file, name, size, video, pct, state: 'wait'|'send'|'ok'|'ko' }
  var sending = false;
  var mine = null; // envois déjà reçus par le serveur
  var online = null;
  var wakeLock = null;

  function size(n) {
    if (n == null) return '';
    if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' Ko';
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1).replace('.', ',') + ' Mo';
    return (n / 1024 / 1024 / 1024).toFixed(2).replace('.', ',') + ' Go';
  }
  function isVideo(f) { return /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|mkv|avi|3gp|3g2|mts|m2ts|wmv|flv|mpe?g|hevc)$/i.test(f.name || ''); }

  function fetchMine() {
    if (!/^https?:/.test(location.protocol)) { online = false; return Promise.resolve(); }
    return fetch(GQ.apiUrl('vlog/mes') + '?id=' + encodeURIComponent(me.id), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('http');
      return r.json();
    }).then(function (d) { online = true; mine = d.envois; }, function () { online = false; });
  }

  function upload(item) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', GQ.apiUrl('vlog') + '?id=' + encodeURIComponent(me.id) + '&nom=' + encodeURIComponent(me.nom) + '&fichier=' + encodeURIComponent(item.name));
      xhr.setRequestHeader('Content-Type', item.file.type || 'application/octet-stream');
      xhr.upload.onprogress = function (e) {
        if (!e.lengthComputable) return;
        item.pct = Math.round((e.loaded / e.total) * 100);
        paintItem(item);
      };
      xhr.onload = function () { if (xhr.status === 200) resolve(); else reject(new Error(String(xhr.status))); };
      xhr.onerror = function () { reject(new Error('reseau')); };
      xhr.send(item.file);
    });
  }

  function keepAwake(on) {
    try {
      if (on && navigator.wakeLock && !wakeLock) navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }, function () { /* refusé */ });
      if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
    } catch (e) { /* non pris en charge */ }
  }

  function pump() {
    if (sending) return;
    var next = queue.filter(function (x) { return x.state === 'wait'; })[0];
    if (!next) { keepAwake(false); fetchMine().then(paintMine); return; }
    sending = true;
    keepAwake(true);
    next.state = 'send';
    next.pct = 0;
    paintItem(next);
    upload(next).then(function () {
      next.state = 'ok';
      next.pct = 100;
      GQ.audio.sfx('ok');
    }, function () {
      next.state = 'ko';
    }).then(function () {
      paintItem(next);
      sending = false;
      pump();
    });
  }

  function add(files) {
    Array.prototype.forEach.call(files || [], function (f) {
      queue.unshift({ id: Math.random().toString(36).slice(2), file: f, name: f.name || ('video-' + Date.now() + (f.type === 'video/mp4' ? '.mp4' : f.type ? '.' + f.type.split('/')[1] : '')), size: f.size, video: isVideo(f), pct: 0, state: 'wait' });
    });
    GQ.render();
    pump();
  }

  function itemHtml(x) {
    var label = x.state === 'ok' ? icon('valide') + esc(V.envoye)
      : x.state === 'ko' ? '<button type="button" class="link-btn vlog-retry" data-action="vlog-retry" data-id="' + x.id + '">' + esc(V.echec) + ' · ' + esc(V.reessayer) + '</button>'
        : x.state === 'send' ? esc(V.envoi.replace('{pct}', x.pct)) : esc(V.enAttente);
    return '<li class="vlog-item is-' + x.state + '" data-item="' + x.id + '">' +
      '<span class="vlog-ico">' + icon(x.video ? 'video' : 'galerie') + '</span>' +
      '<span class="vlog-meta"><span class="vlog-name">' + esc(x.name) + '</span><span class="vlog-size">' + size(x.size) + '</span>' +
      '<span class="vlog-bar"><i style="width:' + (x.state === 'ok' ? 100 : x.pct) + '%"></i></span></span>' +
      '<span class="vlog-state">' + label + '</span></li>';
  }

  function paintItem(x) {
    var el = document.querySelector('[data-item="' + x.id + '"]');
    if (el) el.outerHTML = itemHtml(x);
  }

  function mineHtml() {
    if (online === false) return '<p class="notice notice-warn">' + icon('cadenas') + '<span>' + t(V.horsLigne) + '</span></p>';
    if (!mine) return '';
    return '<h2 class="section-title">' + t(V.mesEnvois) + ' · ' + mine.length + '</h2>' +
      (mine.length ? '<ul class="vlog-mine">' + mine.map(function (m) {
        return '<li>' + icon(/^video\//.test(m.type) ? 'video' : 'galerie') + '<span>' + esc(m.fichier) + '</span><small>' + size(m.taille) + '</small></li>';
      }).join('') + '</ul>' : '<p class="muted small center">' + t(V.aucun) + '</p>');
  }
  function paintMine() {
    var el = document.querySelector('[data-mine]');
    if (el) el.innerHTML = mineHtml();
  }

  GQ.screens.vlog = function () {
    var head = GQ.clubHeader({ href: 'programme', label: 'Programme' }) +
      '<main class="screen screen-plain screen-vlog">' +
      '<div class="center-head">' + GQ.knit.icon('camera', 'head-ico') + '<p class="kicker">Gobinous</p>' + C.knitTitle('Le Vlog') + '</div>';
    if (!me.nom || GQ.ui.rename) {
      if (GQ.ui.value == null && me.nom) GQ.ui.value = me.nom;
      return {
        key: 'vlog-name',
        bare: true,
        html: head +
          GQ.elfTalk('<p class="elf-talk-big">' + t(V.bulle) + '</p><p>' + t(V.texte) + '</p>') +
          C.textAnswer({ form: 'vlog-name', label: V.nomLabel, button: 'Continuer', placeholder: V.nomPlaceholder, max: 40, btnCls: 'btn-red' }) +
          '</main>',
      };
    }
    return {
      key: 'vlog',
      bare: true,
      html: head +
        '<p class="vlog-hello">' + esc(me.nom) + ' · <button type="button" class="link-btn" data-action="vlog-rename">' + esc(V.changerNom) + '</button></p>' +
        '<p class="center muted">' + t(V.texte) + '</p>' +
        '<div class="vlog-actions">' +
        '<label class="btn btn-red btn-file">' + icon('galerie') + esc(V.boutonGalerie) +
        '<input type="file" accept="image/*,video/*" multiple data-vlog-files></label>' +
        '<button type="button" class="btn btn-secondary" data-action="vlog-camera">' + icon('video') + esc(V.boutonCamera) + '</button>' +
        '</div>' +
        (queue.length ? '<p class="small muted center">' + t(V.garderOuvert) + '</p><ul class="vlog-queue">' + queue.map(itemHtml).join('') + '</ul>' : '') +
        '<section data-mine>' + mineHtml() + '</section>' +
        '</main>',
      after: function () { fetchMine().then(paintMine); },
    };
  };

  GQ.forms['vlog-name'] = function (form, value) {
    if (!value.trim()) return C.formError(value, V.nomErreur);
    me.nom = value.trim().slice(0, 40);
    save();
    GQ.uiReset();
    GQ.render();
  };

  GQ.actions['vlog-rename'] = function () {
    GQ.uiReset();
    GQ.ui.rename = true;
    GQ.render();
  };

  GQ.actions['vlog-camera'] = function () {
    GQ.camera.open({ titre: V.titre, video: true }).then(function (blob) {
      if (!blob) return;
      var ext = /^video\//.test(blob.type) ? (blob.type === 'video/mp4' ? 'mp4' : 'webm') : 'jpg';
      var f;
      try { f = new File([blob], 'vlog-' + Date.now() + '.' + ext, { type: blob.type }); } catch (e) { f = blob; f.name = 'vlog-' + Date.now() + '.' + ext; }
      add([f]);
    });
  };

  GQ.actions['vlog-retry'] = function (el) {
    queue.forEach(function (x) { if (x.id === el.dataset.id) x.state = 'wait'; });
    GQ.render();
    pump();
  };

  document.addEventListener('change', function (e) {
    var input = e.target.closest && e.target.closest('[data-vlog-files]');
    if (!input) return;
    add(input.files);
    input.value = '';
  });

  // Page quittée pendant un envoi : on prévient.
  window.addEventListener('beforeunload', function (e) {
    if (sending) { e.preventDefault(); e.returnValue = ''; }
  });
})();
