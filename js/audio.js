/* Son du jeu : musique de fond (Noël pendant le parcours, japonaise sous la
 * vidéo de Barnabé), voix de Barnabé et bouton pour couper le son.
 * Les navigateurs n'autorisent le son qu'après un geste de l'utilisateur :
 * la musique démarre au premier appui sur l'écran. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var M = GQ.cfg.parametres.musique || {};
  var PKEY = GQ.storageKey + ':son';
  var tracks = {};
  var current = null; // piste demandée par l'écran affiché
  var unlocked = false;
  var ducked = false;

  function pref() {
    try { return localStorage.getItem(PKEY) !== 'off'; } catch (e) { return true; }
  }
  function setPref(on) {
    try { localStorage.setItem(PKEY, on ? 'on' : 'off'); } catch (e) { /* préférence en mémoire seulement */ }
  }
  var enabled = M.actif !== false && pref();

  function src(name) { return name === 'japon' ? M.japon : M.noel; }
  function baseVolume(name) {
    var v = name === 'japon' ? M.volumeVideo : M.volume;
    return Math.max(0, Math.min(1, Number(v) || 0.15));
  }

  function track(name) {
    if (!tracks[name]) {
      var a = new Audio(src(name));
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0;
      tracks[name] = a;
    }
    return tracks[name];
  }

  /* Fondu de volume (iOS ignore parfois volume : la pause reste fiable). */
  function fade(a, to, ms, done) {
    clearInterval(a._fade);
    var from = a.volume;
    var steps = Math.max(1, Math.round(ms / 50));
    var i = 0;
    a._fade = setInterval(function () {
      i += 1;
      a.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
      if (i >= steps) {
        clearInterval(a._fade);
        if (done) done();
      }
    }, 50);
  }

  function apply() {
    Object.keys(tracks).forEach(function (name) {
      var a = tracks[name];
      if (name !== current || !enabled || !unlocked) {
        if (!a.paused) fade(a, 0, 600, function () { a.pause(); });
      }
    });
    if (!current || !enabled || !unlocked || !src(current)) return;
    var a = track(current);
    var target = baseVolume(current) * (ducked ? 0.25 : 1);
    if (a.paused) {
      var p = a.play();
      if (p && p.catch) p.catch(function () { /* lecture refusée : on réessaiera au prochain geste */ });
    }
    fade(a, target, 900);
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    apply();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, unlock, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      Object.keys(tracks).forEach(function (n) { tracks[n].pause(); });
    } else {
      apply();
    }
  });

  var voice = null;
  function voiceEl() {
    if (!voice) {
      voice = new Audio();
      voice.preload = 'auto';
    }
    return voice;
  }

  GQ.audio = {
    isOn: function () { return enabled; },
    /* Piste voulue par l'écran affiché : 'noel', 'japon' ou null. */
    scene: function (name) {
      if (M.actif === false) name = null;
      if (name === current) return;
      current = name;
      apply();
    },
    toggle: function () {
      enabled = !enabled;
      setPref(enabled);
      unlocked = true;
      apply();
      return enabled;
    },
    /* Baisse la musique pendant que Barnabé parle. */
    duck: function (on) {
      ducked = !!on;
      apply();
    },
    /* À appeler pendant un appui (bouton) : autorise ensuite la lecture
     * des voix sur iPhone, qui exige un geste pour chaque lecteur audio.
     * Un seul lecteur sert donc pour toutes les répliques. */
    prime: function (url) {
      var a = voiceEl();
      if (!String(url || '').trim()) return;
      a.src = url;
      a.muted = true;
      var p = a.play();
      if (p && p.then) p.then(function () { a.pause(); a.muted = false; }, function () { a.muted = false; });
      else { a.pause(); a.muted = false; }
    },
    /* Lit un fichier de voix. Retour : promesse résolue à la fin de la
     * lecture, rejetée si le fichier est absent ou illisible. */
    voice: function (url) {
      return new Promise(function (resolve, reject) {
        if (!String(url || '').trim()) return reject(new Error('aucun fichier'));
        var a = voiceEl();
        a.onended = function () { resolve(a); };
        a.onerror = function () { reject(new Error('fichier illisible')); };
        if (a.getAttribute('src') !== url) a.src = url;
        a.muted = false;
        a.currentTime = 0;
        var p = a.play();
        if (p && p.catch) p.catch(reject);
      });
    },
    stopVoice: function () {
      if (voice) { voice.onended = voice.onerror = null; voice.pause(); }
      if (window.speechSynthesis) speechSynthesis.cancel();
    },
  };

  /* Bouton son (en-tête et accueil). */
  GQ.soundButton = function () {
    if (M.actif === false) return '';
    var on = enabled;
    return '<button type="button" class="top-btn sound-btn' + (on ? '' : ' is-off') + '" data-action="toggle-sound" aria-pressed="' + on + '" aria-label="' + (on ? 'Couper le son' : 'Activer le son') + '">' +
      GQ.icon(on ? 'son' : 'muet') + '<span>' + (on ? 'Son' : 'Muet') + '</span></button>';
  };

  GQ.actions = GQ.actions || {};
  GQ.actions['toggle-sound'] = function () {
    var on = GQ.audio.toggle();
    document.querySelectorAll('.sound-btn').forEach(function (b) {
      b.outerHTML = GQ.soundButton();
    });
    GQ.toast(on ? 'Musique activée' : 'Musique coupée', 'info');
  };
})();
