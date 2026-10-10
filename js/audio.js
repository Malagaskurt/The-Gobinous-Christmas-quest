/* Son du jeu : petit fond musical de Noël (deux morceaux très doux qui
 * s'enchaînent), voix de Barnabé (vidéo et appel de la quête 5), effets
 * sonores (réussite, erreur, gel, déverrouillage) et bouton pour couper le
 * son.
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
    var v = name === 'japon' ? M.japon : name === 'fete' ? M.fete : M.noel;
    return (Array.isArray(v) ? v : [v]).filter(Boolean);
  }
  function level(name) {
    var v = name === 'japon' ? M.volumeVideo : name === 'fete' ? M.volumeFete : M.volume;
    v = Math.max(0, Math.min(1, Number(v) || 0.05));
    return v * (ducked ? 0.15 : 1);
  }

  /* iPhone : le son du jeu ne doit pas dépendre du bouton silencieux. */
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* non pris en charge */ }

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
    var c = audioCtx();
    if (c && !unlock.primed) { unlock.primed = true; primeCtx(); }
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
    // Fin d'appel : « tu-tu-tu », comme sur un téléphone.
    hangup: function (c, out, t) {
      for (var i = 0; i < 3; i++) {
        tone(c, out, 425, t + i * 0.32, 0.18, 'sine', 0.3);
        tone(c, out, 850, t + i * 0.32, 0.18, 'sine', 0.04);
      }
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
  /* Voix de Barnabé (appel de la quête 5)                              */
  /* Les fichiers sont décodés puis joués par Web Audio : une fois le    */
  /* son débloqué par un premier appui, toutes les répliques passent,    */
  /* y compris sur iPhone. Chaque lecture a un minuteur de sécurité : la */
  /* promesse se résout toujours, le jeu ne peut pas rester bloqué.      */
  /* ------------------------------------------------------------------ */

  var buffers = {}; // url → promesse d'AudioBuffer
  var speaking = null; // { src, done }

  function load(url) {
    if (!buffers[url]) {
      var c = audioCtx();
      buffers[url] = !c || !window.fetch
        ? Promise.reject(new Error('web audio'))
        : fetch(url).then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          return r.arrayBuffer();
        }).then(function (data) {
          // Safari ancien : decodeAudioData sans promesse.
          return new Promise(function (resolve, reject) { c.decodeAudioData(data, resolve, reject); });
        });
      buffers[url].catch(function () { delete buffers[url]; });
    }
    return buffers[url];
  }

  function stopVoice() {
    if (speaking) {
      var s = speaking;
      speaking = null;
      try { s.src.stop(); } catch (e) { /* déjà arrêtée */ }
      s.done();
    }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  /* Lit un fichier de voix. Résolue à la fin (ou au plus tard à la durée
   * du fichier + 1,5 s) ; rejetée si le fichier est illisible ou si le son
   * n'est pas disponible. Son coupé : résolue tout de suite. */
  function playVoice(url, onStart) {
    if (!String(url || '').trim()) return Promise.reject(new Error('aucun fichier'));
    if (!enabled) return Promise.resolve();
    return load(url).then(function (buf) {
      var c = audioCtx();
      if (!c) throw new Error('son indisponible');
      if (c.state === 'running') return buf;
      // Contexte en cours de réveil : on lui laisse un instant.
      return Promise.race([c.resume(), new Promise(function (r) { setTimeout(r, 600); })]).then(function () {
        if (c.state !== 'running') throw new Error('son bloqué');
        return buf;
      });
    }).then(function (buf) {
      var c = audioCtx();
      stopVoice();
      return new Promise(function (resolve) {
        var src = c.createBufferSource();
        var g = c.createGain();
        g.gain.value = Math.max(0, Math.min(2, Number(M.volumeVoix) || 1));
        src.buffer = buf;
        src.connect(g);
        g.connect(c.destination);
        var guard;
        var me = {
          src: src,
          done: function () {
            clearTimeout(guard);
            if (speaking === me) speaking = null;
            ducked = !!speaking;
            apply();
            resolve();
          },
        };
        src.onended = function () { if (speaking === me) me.done(); };
        guard = setTimeout(function () { if (speaking === me) { try { src.stop(); } catch (e) { /* fin */ } me.done(); } }, buf.duration * 1000 + 1500);
        speaking = me;
        ducked = true;
        apply();
        src.start(0);
        if (onStart) onStart();
      });
    });
  }

  /* Débloque le son sur iPhone : un son vide joué pendant un appui. */
  function primeCtx() {
    var c = audioCtx();
    if (!c) return;
    try {
      var b = c.createBuffer(1, 1, 22050);
      var s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch (e) { /* rien à débloquer */ }
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
      if (!enabled) stopVoice();
      apply();
      return enabled;
    },
    sfx: sfx,
    /* Baisse fortement la musique (pendant une voix ou une vidéo). */
    duck: function (on) {
      ducked = !!on || !!speaking;
      apply();
    },
    /* À appeler pendant un appui : débloque le son et précharge le fichier. */
    prime: function (url) {
      unlock();
      primeCtx();
      if (String(url || '').trim()) load(url).catch(function () { /* préchargement facultatif */ });
    },
    preload: function (url) { if (String(url || '').trim()) load(url).catch(function () { /* facultatif */ }); },
    voice: playVoice,
    stopVoice: stopVoice,
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
