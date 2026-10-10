/* Son du jeu : musique de fond (deux musiques de Noël qui s'enchaînent
 * pendant le parcours, musique japonaise sous la vidéo de Barnabé), voix de
 * Barnabé, effets sonores (réussite, erreur, gel, déverrouillage) et bouton
 * pour couper le son.
 * Les navigateurs n'autorisent le son qu'après un geste de l'utilisateur :
 * la musique démarre au premier appui sur l'écran.
 * Le volume de la musique passe par Web Audio : c'est la seule façon de le
 * baisser sur iPhone, qui ignore le réglage de volume des lecteurs audio. */
(function () {
  'use strict';

  var GQ = window.GQ;
  var M = GQ.cfg.parametres.musique || {};
  var PKEY = GQ.storageKey + ':son';
  var current = null; // ambiance voulue par l'écran affiché
  var unlocked = false;
  var ducked = false;
  var ctx = null;
  var players = {}; // ambiance → { el, gain, list, index }

  function pref() {
    try { return localStorage.getItem(PKEY) !== 'off'; } catch (e) { return true; }
  }
  function setPref(on) {
    try { localStorage.setItem(PKEY, on ? 'on' : 'off'); } catch (e) { /* préférence en mémoire seulement */ }
  }
  var enabled = M.actif !== false && pref();

  function list(name) {
    var v = name === 'japon' ? M.japon : M.noel;
    return (Array.isArray(v) ? v : [v]).filter(Boolean);
  }
  function level(name) {
    var v = name === 'japon' ? M.volumeVideo : M.volume;
    v = Math.max(0, Math.min(1, Number(v) || 0.08));
    return v * (ducked ? 0.12 : 1);
  }

  function audioCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { try { ctx = new AC(); } catch (e) { ctx = null; } }
    }
    if (ctx && ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }

  /* Lecteur d'une ambiance : les morceaux de la liste s'enchaînent. */
  function player(name) {
    if (players[name]) return players[name];
    var files = list(name);
    var el = new Audio();
    el.preload = 'auto';
    el.loop = files.length === 1;
    var p = { el: el, list: files, index: 0, gain: null };
    el.src = files[0];
    el.addEventListener('ended', function () {
      p.index = (p.index + 1) % p.list.length;
      el.src = p.list[p.index];
      if (current === name && enabled) el.play().catch(function () { /* geste requis */ });
    });
    var c = audioCtx();
    if (c && c.createMediaElementSource) {
      try {
        p.gain = c.createGain();
        p.gain.gain.value = 0;
        c.createMediaElementSource(el).connect(p.gain);
        p.gain.connect(c.destination);
      } catch (e) { p.gain = null; }
    }
    if (!p.gain) el.volume = 0;
    players[name] = p;
    return p;
  }

  function setLevel(p, value, seconds) {
    if (p.gain && ctx) {
      var g = p.gain.gain;
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(g.value, ctx.currentTime);
      g.linearRampToValueAtTime(value, ctx.currentTime + seconds);
    } else {
      p.el.volume = value;
    }
  }

  function apply() {
    Object.keys(players).forEach(function (name) {
      var p = players[name];
      if (name !== current || !enabled || !unlocked) {
        setLevel(p, 0, 0.6);
        clearTimeout(p.stop);
        p.stop = setTimeout(function () { if (name !== current || !enabled) p.el.pause(); }, 700);
      }
    });
    if (!current || !enabled || !unlocked || !list(current).length) return;
    var p = player(current);
    clearTimeout(p.stop);
    if (p.el.paused) {
      var pr = p.el.play();
      if (pr && pr.catch) pr.catch(function () { /* lecture refusée : on réessaiera au prochain geste */ });
    }
    setLevel(p, level(current), 0.9);
  }

  function unlock() {
    audioCtx();
    if (unlocked) return;
    unlocked = true;
    apply();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, unlock, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      Object.keys(players).forEach(function (n) { players[n].el.pause(); });
    } else {
      apply();
    }
  });

  /* ------------------------------------------------------------------ */
  /* Effets sonores (synthétisés, aucun fichier)                         */
  /* ------------------------------------------------------------------ */

  function tone(c, out, f, start, dur, type, vol, glideTo) {
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, start);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g);
    g.connect(out);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  var SFX = {
    // Petite cloche montante : réponse validée.
    ok: function (c, out, t) {
      [1046.5, 1318.5, 1568].forEach(function (f, i) {
        tone(c, out, f, t + i * 0.075, 0.45, 'sine', 0.22);
        tone(c, out, f * 2, t + i * 0.075, 0.25, 'sine', 0.05);
      });
    },
    // Fanfare de clochettes : quête réussie.
    win: function (c, out, t) {
      [784, 988, 1175, 1568, 1976].forEach(function (f, i) {
        tone(c, out, f, t + i * 0.09, 0.7, 'sine', 0.2);
        tone(c, out, f * 2.76, t + i * 0.09, 0.3, 'sine', 0.04);
      });
      tone(c, out, 2093, t + 0.5, 1.1, 'triangle', 0.08);
    },
    // « Bonk » descendant : mauvaise réponse.
    error: function (c, out, t) {
      tone(c, out, 311, t, 0.16, 'square', 0.07, 233);
      tone(c, out, 220, t + 0.15, 0.28, 'square', 0.07, 147);
    },
    // Givre qui cristallise : gel.
    freeze: function (c, out, t) {
      for (var i = 0; i < 7; i++) tone(c, out, 2600 - i * 230, t + i * 0.05, 0.35, 'sine', 0.06);
      tone(c, out, 880, t, 0.8, 'triangle', 0.05, 440);
    },
    // Déverrouillage : mot secret accepté.
    unlock: function (c, out, t) {
      tone(c, out, 523, t, 0.12, 'triangle', 0.12, 784);
      tone(c, out, 1568, t + 0.12, 0.5, 'sine', 0.18);
      tone(c, out, 2093, t + 0.18, 0.4, 'sine', 0.08);
    },
  };

  function sfx(name) {
    if (!enabled || M.effets === false || !SFX[name]) return;
    var c = audioCtx();
    if (!c || c.state !== 'running') return;
    var out = c.createGain();
    out.gain.value = Math.max(0, Math.min(1, Number(M.volumeEffets) || 0.5));
    out.connect(c.destination);
    SFX[name](c, out, c.currentTime + 0.01);
  }

  /* ------------------------------------------------------------------ */
  /* Voix de Barnabé                                                     */
  /* ------------------------------------------------------------------ */

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
    /* Ambiance voulue par l'écran affiché : 'noel', 'japon' ou null. */
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
    sfx: sfx,
    /* Baisse fortement la musique pendant que Barnabé parle. */
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
    GQ.toast(on ? 'Son activé' : 'Son coupé', 'info');
  };
})();
