/* Quête 3 : le défi photo. L'équipe reproduit 3 des 6 modèles avec
 * l'appareil photo du téléphone. Chaque photo validée est envoyée au
 * serveur du jeu (récupération par les organisateurs). Sans réseau, elle
 * attend dans le navigateur (IndexedDB) et repart dès que possible.
 * Le lutin refuse une fois, au hasard, la première tentative d'une photo. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var C = GQ.C;
  var F = GQ.cfg.quetes.photos;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;

  function model(id) {
    return F.modeles.filter(function (m) { return m.id === id; })[0] || null;
  }

  /* ------------------------------------------------------------------ */
  /* Traitement de l'image : redimensionnement et compression JPEG       */
  /* ------------------------------------------------------------------ */

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }

  function toJpeg(img, max, quality) {
    var w = img.naturalWidth, h = img.naturalHeight;
    var k = Math.min(1, max / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.round(w * k);
    c.height = Math.round(h * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  }

  /* Photo prise → { full, thumb } (data URL JPEG). */
  function process(file) {
    return loadImage(file).then(function (r) {
      var out = { full: toJpeg(r.img, 1600, 0.82), thumb: toJpeg(r.img, 360, 0.7) };
      URL.revokeObjectURL(r.url);
      return out;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Envoi au serveur, avec file d'attente hors ligne (IndexedDB)        */
  /* ------------------------------------------------------------------ */

  var DB = 'gobinous-photos';
  function db() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('idb'));
      var req = indexedDB.open(DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('queue', { keyPath: 'key' }); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function store(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction('queue', mode);
        var r = fn(tx.objectStore('queue'));
        tx.oncomplete = function () { resolve(r && r.result); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function upload(item) {
    return fetch(GQ.apiUrl('photos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
    });
  }

  function markSent(item) {
    if (GQ.state.id === item.id) GQ.photoSent(item.modele);
    var el = document.querySelector('[data-sent="' + item.modele + '"]');
    if (el) el.outerHTML = sentTag(true);
  }

  /* Envoie une photo ; en cas d'échec, elle est mise en file d'attente. */
  function send(item) {
    item.key = item.id + ':' + item.modele;
    return upload(item).then(function () { markSent(item); }, function () {
      return store('readwrite', function (os) { return os.put(item); }).catch(function () { /* stockage indisponible */ });
    });
  }

  var flushing = false;
  function flush() {
    if (flushing || !GQ.sync || !GQ.sync.enabled) return;
    flushing = true;
    store('readonly', function (os) { return os.getAll(); }).then(function (items) {
      return (items || []).reduce(function (p, item) {
        return p.then(function () {
          return upload(item).then(function () {
            markSent(item);
            return store('readwrite', function (os) { return os.delete(item.key); });
          }, function () { /* toujours hors ligne */ });
        });
      }, Promise.resolve());
    }).catch(function () { /* pas de file */ }).then(function () { flushing = false; });
  }
  setInterval(flush, 15000);
  setTimeout(flush, 3000);
  GQ.photoQueue = { flush: flush };

  /* ------------------------------------------------------------------ */
  /* Écrans                                                              */
  /* ------------------------------------------------------------------ */

  function sentTag(sent) {
    return '<span class="photo-sent' + (sent ? ' is-sent' : '') + '">' + (sent ? icon('valide') + esc(F.envoiOk) : esc(F.envoiAttente)) + '</span>';
  }

  /* Bouton qui ouvre directement l'appareil photo (capture). */
  function cameraLabel(id, inner, cls, disabled) {
    return '<label class="' + cls + (disabled ? ' is-disabled' : '') + '">' + inner +
      '<input class="camera-input" type="file" accept="image/*" capture="environment" data-model="' + esc(id) + '"' + (disabled ? ' disabled' : '') + '></label>';
  }

  function intro() {
    return {
      key: 'q3-intro',
      html:
        C.questHead(3) +
        '<div class="caprice-card">' + GQ.art.elf('elfWave', 'caprice-elf') +
        '<div><p class="caprice-title">' + icon('cadenas') + esc(F.avertissementTitre) + '</p><p>' + t(F.avertissement) + '</p></div></div>' +
        C.frame('<p class="intro-text">' + t(F.intro) + '</p><p class="muted small">' + t(F.consentement) + '</p>') +
        C.cta(C.btn(esc(F.boutonIntro) + icon('fleche'), 'intro-next', ' data-n="3"')),
    };
  }

  function preview(pv) {
    var m = model(pv.model);
    return (
      '<section class="photo-preview">' +
      '<div class="preview-pair">' +
      '<figure><img src="' + esc(m.image) + '" alt=""><figcaption>' + t(m.titre) + '</figcaption></figure>' +
      '<figure class="preview-shot"><img src="' + pv.thumb + '" alt="Votre photo"><figcaption>Votre photo</figcaption></figure>' +
      '</div>' +
      C.feedbackSlot() +
      '<div class="btn-pair">' +
      C.btn(icon('valide') + esc(F.boutonValider), 'photo-validate', ' data-model="' + esc(pv.model) + '"', 'btn-red') +
      cameraLabel(pv.model, icon('photo') + esc(F.boutonRetenter), 'btn btn-secondary btn-camera') +
      '</div></section>'
    );
  }

  function play() {
    var q3 = GQ.state.q3;
    var count = GQ.photosValidated();
    var max = GQ.photoCount();
    var full = count >= max;
    var pv = GQ.ui.preview;
    var cards = F.modeles.map(function (m) {
      var done = q3.photos[m.id];
      var refused = q3.rejected === m.id && !done;
      var inner =
        '<span class="model-img"><img src="' + esc(done && done.thumb ? done.thumb : m.image) + '" alt=""></span>' +
        '<span class="model-title">' + t(m.titre) + '</span>' +
        (done ? '<span class="model-state">' + icon('valide') + esc(F.photoValidee) + '</span>' + '<span data-sent="' + esc(m.id) + '">' + sentTag(done.sent) + '</span>'
          : refused ? '<span class="model-state is-refused">' + icon('croix') + esc(F.rejetTitre) + '</span>'
            : '<span class="model-cta">' + icon('photo') + esc(F.boutonPhoto) + '</span>');
      if (done) return '<li><div class="model-card is-done">' + inner + '</div></li>';
      return '<li>' + cameraLabel(m.id, inner, 'model-card', full || !!pv) + '</li>';
    }).join('');
    var html =
      C.questHead(3) +
      (pv ? preview(pv) : '') +
      '<h2 class="section-title">' + t(F.choixTitre) + '</h2>' +
      '<p class="photo-count">' + icon('photo') + t(F.choixCompteur, { n: count, max: max }) + '</p>' +
      (pv ? '' : '<p class="muted small center">' + t(F.choixAide) + '</p>') +
      '<ul class="models">' + cards + '</ul>' +
      C.cta(C.btn(esc(F.boutonQuete) + icon('fleche'), 'photos-complete', full ? '' : ' aria-disabled="true"', 'btn-red'));
    return { key: 'q3-play' + (pv ? '-preview-' + pv.model : ''), html: html };
  }

  GQ.questScreens[3] = function () {
    var ph = GQ.state.phase[3];
    if (ph === 'play') return play();
    if (ph === 'success') {
      return {
        key: 'q3-success',
        celebrate: true,
        elf: { say: 'reussite' },
        html: C.successBlock({
          art: GQ.knit.icon('camera', 'success-ico'),
          title: F.reussiteTitre,
          html: '<p>' + t(F.reussiteTexte) + '</p>',
          cta: C.btn(esc(F.bouton) + icon('fleche'), 'complete-quest', ' data-n="3"', 'btn-red'),
        }),
      };
    }
    return intro();
  };

  /* Photo prise (ou reprise) : aperçu avant validation. */
  document.addEventListener('change', function (e) {
    var input = e.target.closest && e.target.closest('.camera-input');
    if (!input || !input.files || !input.files[0]) return;
    var id = input.dataset.model;
    var file = input.files[0];
    process(file).then(function (img) {
      GQ.uiReset();
      GQ.ui.preview = { model: id, thumb: img.thumb, full: img.full };
      GQ.render();
      var el = document.querySelector('.photo-preview');
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, function () {
      GQ.toast(F.erreurPhoto, 'error');
    });
  });

  GQ.actions['photo-validate'] = function (el) {
    var pv = GQ.ui.preview;
    if (!pv || pv.model !== el.dataset.model) return GQ.render();
    var res = GQ.photoValidate(pv.model, { thumb: pv.thumb, sent: false });
    if (res === 'rejet') {
      GQ.uiReset();
      GQ.render();
      GQ.modal({
        title: F.rejetTitre,
        html: '<div class="reject-elf">' + GQ.art.elf('elfWave', 'elf-big') + '</div><p class="reject-text">' + t(F.rejetTexte) + '</p>',
        cancel: F.rejetBouton,
      });
      return;
    }
    if (res === 'ok') {
      var s = GQ.state;
      var m = model(pv.model);
      send({ id: s.id, equipe: s.team, modele: pv.model, titre: m ? m.titre : pv.model, image: pv.full });
    }
    GQ.uiReset();
    GQ.render();
  };

  GQ.actions['photos-complete'] = function () {
    if (!GQ.photosComplete()) {
      GQ.toast(t(F.choixCompteur, { n: GQ.photosValidated(), max: GQ.photoCount() }), 'error');
      return;
    }
    GQ.uiReset();
    GQ.render();
  };
})();
