/* Appareil photo intégré au jeu : viseur plein écran, déclencheur et
 * bascule avant/arrière, sur téléphone comme sur ordinateur. Aucune
 * galerie ni explorateur de fichiers n'est proposé.
 * Option vidéo (bucket list de la Party) : onglets Photo / Vidéo, la vidéo
 * est filmée avec le son (MediaRecorder), 60 secondes au maximum.
 * Nécessite une adresse en HTTPS (ou localhost) et l'autorisation de
 * l'appareil photo ; sinon un message explique comment l'autoriser. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;
  var icon = GQ.icon;

  var stream = null;
  var facing = 'environment';
  var mode = 'photo'; // 'photo' ou 'video'
  var recorder = null;
  var chunks = [];
  var recTimer = null;
  var MAX_REC = 60;
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
    if (recorder && recorder.state !== 'inactive') { recorder.onstop = null; try { recorder.stop(); } catch (e) { /* déjà arrêté */ } }
    recorder = null;
    clearInterval(recTimer);
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
    overlay.classList.toggle('is-video', mode === 'video');
    return navigator.mediaDevices.getUserMedia({
      audio: mode === 'video',
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

  /* Vidéo : un appui lance l'enregistrement, un second l'arrête. */
  function canRecord() { return !!window.MediaRecorder; }
  function pickType() {
    var types = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (var i = 0; i < types.length; i++) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) return types[i];
    }
    return '';
  }
  function toggleRecord() {
    if (!stream) return;
    var rec = overlay.querySelector('.cam-rec');
    if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
    var type = pickType();
    try {
      recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    } catch (e) {
      message('Vidéo indisponible', 'Ce navigateur ne sait pas filmer ici. Utilisez « Galerie » pour envoyer une vidéo filmée avec l\'appareil du téléphone.');
      return;
    }
    chunks = [];
    recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = function () {
      clearInterval(recTimer);
      var t = (recorder && recorder.mimeType) || type || 'video/webm';
      var blob = new Blob(chunks, { type: t.split(';')[0] });
      close(blob.size ? blob : null);
    };
    recorder.start(500);
    overlay.classList.add('is-recording');
    var t0 = Date.now();
    var draw = function () {
      var sec = Math.floor((Date.now() - t0) / 1000);
      if (rec) rec.textContent = GQ.mmss(sec * 1000) + ' / ' + GQ.mmss(MAX_REC * 1000);
      if (sec >= MAX_REC && recorder && recorder.state === 'recording') recorder.stop();
    };
    draw();
    recTimer = setInterval(draw, 250);
  }

  function setMode(m) {
    if (recorder && recorder.state === 'recording') return;
    mode = m;
    overlay.querySelectorAll('[data-cam-mode]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-cam-mode') === m); });
    overlay.querySelector('.cam-shutter').setAttribute('aria-label', m === 'video' ? 'Filmer' : 'Prendre la photo');
    start();
  }

  /* Ouvre le viseur. Retour : promesse d'une photo (Blob JPEG) ou d'une
   * vidéo (Blob MP4/WebM), ou null si l'équipe ferme le viseur.
   * o = { titre, image : modèle à reproduire, video : true pour proposer
   * aussi la vidéo, mode : 'photo' ou 'video' au départ }. */
  function open(o) {
    o = o || {};
    if (resolver) close(null);
    var withVideo = !!o.video && canRecord();
    mode = withVideo && o.mode === 'video' ? 'video' : 'photo';
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
        (withVideo ? '<p class="cam-rec" aria-live="polite"></p>' : '') +
        '<div class="cam-bar">' +
        (withVideo
          ? '<div class="cam-modes"><button type="button" data-cam-mode="photo" class="' + (mode === 'photo' ? 'is-on' : '') + '">Photo</button>' +
            '<button type="button" data-cam-mode="video" class="' + (mode === 'video' ? 'is-on' : '') + '">Vidéo</button></div>'
          : '<span class="cam-spacer"></span>') +
        '<button type="button" class="cam-shutter" aria-label="Prendre la photo"><span></span></button>' +
        '<button type="button" class="cam-switch" aria-label="Changer de caméra" hidden>⟲</button>' +
        '</div>';
      document.body.appendChild(overlay);
      document.body.classList.add('no-scroll');
      overlay.querySelector('.cam-close').addEventListener('click', function () { close(null); });
      overlay.querySelector('.cam-shutter').addEventListener('click', function () { if (mode === 'video') toggleRecord(); else shoot(); });
      overlay.querySelectorAll('[data-cam-mode]').forEach(function (b) {
        b.addEventListener('click', function () { setMode(b.getAttribute('data-cam-mode')); });
      });
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

  GQ.camera = { open: open, close: close, supported: supported, canRecord: canRecord };
})();
