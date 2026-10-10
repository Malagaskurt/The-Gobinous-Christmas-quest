/* Quête 5 : la traque du 33ᵉ étage. Vidéo à lecture unique, rapport
 * d'analyse, code du repaire (TOKYO), lutin démasqué, faux appel et fin.
 * ⚠ Aucun texte affiché avant TOKYO ne doit contenir « salle » ou
 *   « porte » (voir config/quetes.js). */
(function () {
  'use strict';

  var GQ = window.GQ;
  var C = GQ.C;
  var R = GQ.cfg.quetes.traque;
  var E = GQ.cfg.quetes.enquete;
  var T = GQ.cfg.textes;
  var t = GQ.t;
  var esc = GQ.esc;
  var icon = GQ.icon;

  var playingSince = 0; // lecture de la vidéo en cours dans cet onglet

  function simDuration() {
    var subs = R.sousTitres || [];
    return subs.length ? subs[subs.length - 1].a : 35;
  }

  /* ------------------------------------------------------------------ */
  /* Écrans                                                              */
  /* ------------------------------------------------------------------ */

  function intro() {
    return {
      key: 'q5-intro',
      html:
        C.questHead(5) +
        '<div class="alert-card" role="alert">' + GQ.knit.icon('lock', 'alert-ico') +
        '<p class="alert-title">⚠️ ' + t(R.avertissementTitre) + '</p><p>' + t(R.avertissement) + '</p></div>' +
        C.cta(C.btn('▶ ' + esc(R.boutonVideo), 'video-start', '', 'btn-red btn-blink')),
    };
  }

  /* Transmission simulée : portrait du lutin, accessoires et sous-titres
   * minutés (utilisée tant qu'aucun fichier vidéo n'est fourni). */
  function simulated() {
    return (
      '<div class="cctv" aria-live="polite">' +
      '<p class="cctv-top"><span class="rec">● REC</span><span>' + esc(R.camera) + '</span></p>' +
      '<div class="cctv-scene"><img class="cctv-elf" src="' + esc(E.fiche.photo) + '" alt="Barnabé SIX-SEVEN">' +
      '<span class="cctv-prop" data-prop></span></div>' +
      '<p class="cctv-sub" data-sub></p>' +
      '<div class="cctv-bar"><i data-bar></i></div>' +
      '</div>'
    );
  }

  function runSimulation() {
    var total = simDuration() * 1000;
    var subs = R.sousTitres || [];
    var last = -1;
    GQ.every(200, function () {
      var el = Date.now() - playingSince;
      var bar = document.querySelector('[data-bar]');
      if (bar) bar.style.width = Math.min(100, (el / total) * 100) + '%';
      var sec = el / 1000;
      var idx = -1;
      subs.forEach(function (s, i) { if (sec >= s.de && sec < s.a) idx = i; });
      if (idx !== last && idx !== -1) {
        last = idx;
        var sub = document.querySelector('[data-sub]');
        var prop = document.querySelector('[data-prop]');
        if (sub) sub.textContent = subs[idx].texte;
        if (prop) { prop.textContent = subs[idx].accessoire || ''; prop.classList.remove('pop'); void prop.offsetWidth; prop.classList.add('pop'); }
      }
      if (el >= total) videoEnded();
    });
  }

  function realVideo() {
    return '<div class="cctv"><p class="cctv-top"><span class="rec">● REC</span><span>' + esc(R.camera) + '</span></p>' +
      '<video class="cctv-video" src="' + esc(R.video) + '" playsinline autoplay disablepictureinpicture controlslist="nodownload noplaybackrate nofullscreen"></video>' +
      '<div class="cctv-bar"><i data-bar></i></div></div>';
  }

  function runVideo() {
    var v = document.querySelector('.cctv-video');
    if (!v) return;
    v.addEventListener('ended', videoEnded);
    v.addEventListener('error', function () { R.video = ''; GQ.render(); });
    v.addEventListener('timeupdate', function () {
      var bar = document.querySelector('[data-bar]');
      if (bar && v.duration) bar.style.width = (v.currentTime / v.duration) * 100 + '%';
    });
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* lecture refusée : le bouton natif n'existe pas, on relance au toucher */ v.addEventListener('click', function () { v.play(); }, { once: true }); });
  }

  function videoEnded() {
    if (GQ.state.phase[5] !== 'video') return;
    playingSince = 0;
    GQ.setPhase(5, 'report');
    GQ.uiReset();
    GQ.render();
  }

  function video() {
    if (!playingSince) {
      // Vidéo déjà lancée (rechargement de la page) : elle s'est autodétruite.
      return {
        key: 'q5-video-gone',
        html:
          C.questHead(5) +
          '<div class="alert-card">' + GQ.knit.icon('lock', 'alert-ico') + '<p class="alert-title">' + t(R.videoDetruite) + '</p></div>' +
          C.cta(C.btn(esc(T.general.continuer) + icon('fleche'), 'video-skip', '', 'btn-red')),
      };
    }
    var real = !!String(R.video || '').trim();
    return {
      key: 'q5-video',
      html:
        '<h1 class="sr-only" tabindex="-1">' + t(R.titre) + '</h1>' +
        (real ? realVideo() : simulated()) +
        (GQ.test.isActive() ? C.btn('Test : passer la vidéo', 'video-skip', '', 'btn-test') : ''),
      after: real ? runVideo : runSimulation,
    };
  }

  function report() {
    var gel = GQ.freezeRemaining();
    var dur = GQ.durationLabel(GQ.penaltyRule('repaire').sec * 1000);
    var html =
      C.questHead(5) +
      '<section class="terminal">' +
      '<p class="terminal-title">' + t(R.rapportTitre) + '</p>' +
      '<p class="terminal-text">' + t(R.rapport) + '</p>' +
      '<ol class="audit">' + R.indices.map(function (x, i) { return '<li><b>Indice ' + (i + 1) + ' :</b> ' + t(x) + '</li>'; }).join('') + '</ol>' +
      '<p class="terminal-text"><b>' + t(R.conclusion) + '</b></p>' +
      '</section>';
    if (gel) {
      html += C.freezeView({ texte: R.gelTexte });
    } else {
      html += '<p class="notice notice-warn">' + icon('cadenas') + '<span>' + t(R.unEssai.replace('{duree}', dur)) + '</span></p>' +
        GQ.jokerBlock('q5', R.indiceJoker) +
        C.textAnswer({ form: 'lair', label: R.label, button: R.bouton, caps: true, max: 12, fieldCls: 'field-code', expected: R.reponses, btnCls: 'btn-red' });
    }
    return {
      key: 'q5-report' + (gel ? '-gel' : ''),
      frozen: !!gel,
      elf: gel ? { say: 'blocage' } : null,
      after: gel ? C.freezeAfter : null,
      html: html,
    };
  }

  function found() {
    return {
      key: 'q5-found',
      celebrate: 'big',
      after: C.runTypewriters,
      html:
        '<h1 class="sr-only" tabindex="-1">' + t(R.titre) + '</h1>' +
        '<section class="busted">' +
        '<div class="busted-elf"><img src="' + esc(E.fiche.photo) + '" alt="Barnabé SIX-SEVEN"><span class="busted-sweat" aria-hidden="true">💧</span></div>' +
        '<div class="busted-bubble">' + C.typewriter('q5-found', t(R.trouve), 'busted-text') + '</div>' +
        '</section>' +
        C.cta(C.btn(esc(R.boutonAppel), 'call', '', 'btn-red btn-blink btn-call')),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Faux appel : sonnerie (Web Audio) puis message vocal                */
  /* ------------------------------------------------------------------ */

  var audioCtx = null;
  var callTimer = null;

  function ring(done) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var now = audioCtx.currentTime;
      for (var r = 0; r < 3; r++) {
        [0, 0.45].forEach(function (off) {
          var o = audioCtx.createOscillator();
          var g = audioCtx.createGain();
          o.frequency.value = 440;
          var o2 = audioCtx.createOscillator();
          o2.frequency.value = 480;
          g.gain.setValueAtTime(0, now + r * 1.6 + off);
          g.gain.linearRampToValueAtTime(0.12, now + r * 1.6 + off + 0.02);
          g.gain.setValueAtTime(0.12, now + r * 1.6 + off + 0.38);
          g.gain.linearRampToValueAtTime(0, now + r * 1.6 + off + 0.4);
          o.connect(g); o2.connect(g); g.connect(audioCtx.destination);
          o.start(now + r * 1.6 + off); o2.start(now + r * 1.6 + off);
          o.stop(now + r * 1.6 + off + 0.42); o2.stop(now + r * 1.6 + off + 0.42);
        });
      }
    } catch (e) { /* pas de son : on passe directement au message */ }
    callTimer = setTimeout(done, navigator.webdriver ? 50 : 4800);
  }

  function frenchVoice() {
    var voices = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    return voices.filter(function (v) { return /^fr/i.test(v.lang); })[0] || null;
  }

  function speak() {
    var status = document.querySelector('[data-call-status]');
    if (status) status.textContent = '00:00';
    var sub = document.querySelector('.call-sub');
    if (sub) sub.classList.add('is-on');
    C.runTypewriters();
    var started = Date.now();
    GQ.every(500, function () {
      var el = document.querySelector('[data-call-status]');
      if (el) el.textContent = GQ.mmss(Date.now() - started);
    });
    if (String(R.audio || '').trim()) {
      var a = new Audio(R.audio);
      a.addEventListener('ended', endCall);
      a.play().catch(function () { /* lecture refusée : sous-titres seulement */ });
      GQ.callAudio = a;
      return;
    }
    if (window.speechSynthesis && window.SpeechSynthesisUtterance && !navigator.webdriver) {
      var u = new SpeechSynthesisUtterance(GQ.normalizeSpeech(R.messageVocal));
      u.lang = 'fr-FR';
      var v = frenchVoice();
      if (v) u.voice = v;
      u.rate = 1.08;
      u.pitch = 1.35;
      u.onend = endCall;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  }
  var EMOJI;
  try { EMOJI = new RegExp('\\p{Extended_Pictographic}', 'gu'); } catch (e) { EMOJI = /[\u2600-\u27BF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g; }

  /* Texte lu à voix haute : on retire les émojis et guillemets. */
  GQ.normalizeSpeech = function (s) {
    return String(s).replace(/[«»"]/g, '').replace(/MDR/g, 'Mort de rire').replace(EMOJI, '');
  };

  function stopAudio() {
    clearTimeout(callTimer);
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (GQ.callAudio) { GQ.callAudio.pause(); GQ.callAudio = null; }
  }

  function endCall() {
    var b = document.querySelector('[data-action="hang-up"]');
    if (b) b.classList.add('btn-blink');
  }

  function call() {
    return {
      key: 'q5-call',
      html:
        '<h1 class="sr-only" tabindex="-1">' + t(R.appelNom) + '</h1>' +
        '<section class="phone">' +
        '<div class="phone-avatar"><img src="' + esc(E.fiche.photo) + '" alt=""><span class="phone-wave"></span></div>' +
        '<p class="phone-name">' + t(R.appelNom) + '</p>' +
        '<p class="phone-status" data-call-status>' + t(R.appelEnCours) + '</p>' +
        '<div class="call-sub">' + C.typewriter('q5-call', t(R.messageVocal), 'call-text') + '</div>' +
        '</section>' +
        C.cta(C.btn(icon('tel') + esc(R.boutonRaccrocher), 'hang-up', '', 'btn-red btn-hangup')),
      after: function () { if (!callTimer) ring(speak); },
    };
  }

  function end() {
    var s = GQ.state;
    var c = GQ.clock();
    var d = new Date((s.finished && s.finished.at) || Date.now());
    return {
      key: 'q5-end',
      celebrate: 'big',
      html:
        '<section class="success">' +
        '<div class="success-art"><div class="elf-scene"><span class="elf-say">' + t(GQ.elf.line('fin')) + '</span>' + GQ.art.elf('elfGift', 'elf-big') + '</div></div>' +
        '<p class="kicker">🏁</p>' +
        C.knitTitle(R.finTitre, { color: '#E4323A', max: 9 }) +
        C.frame('<p>' + t(R.finTexte) + '</p>' +
          (c ? '<p class="final-time">' + t(T.chrono.tempsFinal, { temps: GQ.mmss(c.elapsed) }) + '</p>' : '') +
          '<p class="muted small">' + t(T.fin.termineeLe, {
            date: d.toLocaleDateString('fr-FR'),
            heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          }) + '</p>', 'frame-center') +
        '</section>',
    };
  }

  GQ.questScreens[5] = function () {
    GQ.freezeCheck();
    var s = GQ.state;
    if (s.finished) return end();
    var ph = s.phase[5];
    if (ph === 'video') return video();
    if (ph === 'report') return report();
    if (ph === 'found') return found();
    if (ph === 'call') return call();
    if (ph === 'end') return end();
    return intro();
  };

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */

  GQ.actions['video-start'] = function () {
    if (!GQ.videoStart()) return GQ.render();
    playingSince = Date.now();
    GQ.uiReset();
    GQ.render();
  };

  GQ.actions['video-skip'] = function () {
    if (GQ.state.phase[5] !== 'video') return GQ.render();
    playingSince = 0;
    GQ.setPhase(5, 'report');
    GQ.uiReset();
    GQ.render();
  };

  GQ.actions.call = function () {
    if (GQ.state.phase[5] !== 'found') return GQ.render();
    // Débloque le son et la voix pendant le geste de l'utilisateur.
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.resume) audioCtx.resume();
    } catch (e) { /* pas de Web Audio */ }
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      try { speechSynthesis.speak(new SpeechSynthesisUtterance(' ')); } catch (e) { /* voix indisponible */ }
    }
    callTimer = null;
    GQ.setPhase(5, 'call');
    GQ.uiReset();
    GQ.render();
  };

  GQ.actions['hang-up'] = function () {
    stopAudio();
    GQ.finish('fin');
    GQ.uiReset();
    GQ.render();
  };

  GQ.forms.lair = function (form, value) {
    if (!value.trim()) return C.formError(value, T.general.reponseVide);
    var res = GQ.lairAnswer(value);
    GQ.uiReset();
    if (!res || res.ok || res.frozen) return GQ.render();
    C.formError(value, T.general.mauvaiseReponse);
  };
})();
