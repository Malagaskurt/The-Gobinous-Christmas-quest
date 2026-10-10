/* Appareil photo intégré au jeu (quête 3) : viseur plein écran, déclencheur
 * et bascule avant/arrière, sur téléphone comme sur ordinateur. Aucune
 * galerie ni explorateur de fichiers n'est proposé.
 * Nécessite une adresse en HTTPS (ou localhost) et l'autorisation de
 * l'appareil photo ; sinon un message explique comment l'autoriser. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;
  var icon = GQ.icon;

  var stream = null;
  var facing = 'environment';
  var resolver = null;
  var overlay = null;

  function supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  function stop() {
    if (stream) stream.getTracks().forEach(function (tr) { tr.stop(); });
    stream = null;
  }

  function close(result) {
    stop();
    if (overlay) { overlay.remove(); overlay = null; }
    document.body.classList.remove('no-scroll');
    var r = resolver;
    resolver = null;
    if (r) r(result || null);
  }

  function message(title, text) {
    var box = overlay && overlay.querySelector('.cam-msg');
    if (!box) return;
    box.innerHTML = '<p class="cam-msg-title">' + esc(title) + '</p><p>' + esc(text) + '</p>';
    box.hidden = false;
    overlay.querySelector('.cam-shutter').disabled = true;
  }

  function start() {
    stop();
    var video = overlay.querySelector('video');
    overlay.querySelector('.cam-msg').hidden = true;
    overlay.querySelector('.cam-shutter').disabled = false;
    overlay.classList.toggle('is-front', facing === 'user');
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
    }).then(function (s) {
      if (!overlay) { s.getTracks().forEach(function (tr) { tr.stop(); }); return; }
      stream = s;
      video.srcObject = s;
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* lecture automatique bloquée : la vidéo démarre au toucher */ });
      // Bascule disponible seulement s'il y a plusieurs caméras.
      if (navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(function (list) {
          var cams = list.filter(function (d) { return d.kind === 'videoinput'; });
          var sw = overlay && overlay.querySelector('.cam-switch');
          if (sw) sw.hidden = cams.length < 2;
        });
      }
    }).catch(function (e) {
      var denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      message(
        denied ? 'Appareil photo bloqué' : 'Appareil photo introuvable',
        denied
          ? 'Autorisez l\'accès à l\'appareil photo pour ce site (icône à gauche de l\'adresse, ou Réglages du téléphone → navigateur → Appareil photo), puis réessayez.'
          : 'Aucun appareil photo n\'a été détecté sur cet appareil.'
      );
    });
  }

  function shoot() {
    var video = overlay.querySelector('video');
    if (!stream || !video.videoWidth) return;
    var c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    var g = c.getContext('2d');
    if (facing === 'user') { g.translate(c.width, 0); g.scale(-1, 1); } // effet miroir, comme le viseur
    g.drawImage(video, 0, 0, c.width, c.height);
    overlay.classList.add('is-flash');
    c.toBlob(function (blob) { close(blob); }, 'image/jpeg', 0.9);
  }

  /* Ouvre le viseur. Retour : promesse d'une photo (Blob JPEG), ou null si
   * l'équipe ferme le viseur. o = { titre, image } : modèle à reproduire. */
  function open(o) {
    o = o || {};
    if (resolver) close(null);
    return new Promise(function (resolve) {
      resolver = resolve;
      overlay = document.createElement('div');
      overlay.className = 'cam';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-label', 'Appareil photo');
      overlay.innerHTML =
        '<video class="cam-video" playsinline muted autoplay></video>' +
        '<div class="cam-top">' +
        (o.image ? '<img class="cam-model" src="' + esc(o.image) + '" alt="Modèle à reproduire">' : '') +
        '<p class="cam-title">' + esc(o.titre || '') + '</p>' +
        '<button type="button" class="cam-close" aria-label="Fermer l\'appareil photo">' + icon('croix') + '</button>' +
        '</div>' +
        '<div class="cam-msg" hidden></div>' +
        '<div class="cam-bar">' +
        '<span class="cam-spacer"></span>' +
        '<button type="button" class="cam-shutter" aria-label="Prendre la photo"><span></span></button>' +
        '<button type="button" class="cam-switch" aria-label="Changer de caméra" hidden>⟲</button>' +
        '</div>';
      document.body.appendChild(overlay);
      document.body.classList.add('no-scroll');
      overlay.querySelector('.cam-close').addEventListener('click', function () { close(null); });
      overlay.querySelector('.cam-shutter').addEventListener('click', shoot);
      overlay.querySelector('.cam-switch').addEventListener('click', function () {
        facing = facing === 'user' ? 'environment' : 'user';
        start();
      });
      if (!supported()) {
        message('Appareil photo indisponible', location.protocol === 'https:' || location.hostname === 'localhost'
          ? 'Ce navigateur ne donne pas accès à l\'appareil photo. Essayez avec Safari (iPhone) ou Chrome (Android, ordinateur).'
          : 'L\'appareil photo ne fonctionne que si le jeu est ouvert avec une adresse sécurisée (https://).');
        return;
      }
      start();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (overlay && e.key === 'Escape') close(null);
  });
  // Écran quitté (retour, changement de page) : on libère la caméra.
  window.addEventListener('hashchange', function () { if (overlay) close(null); });

  GQ.camera = { open: open, close: close, supported: supported };
})();
