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
        (R.notif ? '<div class="push" role="alert"><span class="push-app">' + GQ.knit.icon('bell', 'push-ico') + esc(R.notifApp) + '<span class="push-time">' + esc(R.notifHeure) + '</span></span><p>' + t(R.notif) + '</p></div>' : '') +
        '<div class="alert-card">' + GQ.knit.icon('lock', 'alert-ico') +
        '<p class="alert-title">' + t(R.avertissementTitre) + '</p><p>' + t(R.avertissement) + '</p></div>' +
        C.cta(C.btn(GQ.pix('play', 'btn-pix') + esc(R.boutonVideo), 'video-start', '', 'btn-red btn-blink')),
    };
  }

  /* Transmission simulée : portrait du lutin, accessoires et sous-titres
   * minutés (utilisée tant qu'aucun fichier vidéo n'est fourni). */
  function simulated() {
    return (
      '<div class="cctv" aria-live="polite">' +
      '<p class="cctv-top"><span class="rec"><i></i>REC</span><span>' + esc(R.camera) + '</span></p>' +
      '<div class="cctv-scene"><img class="cctv-elf" src="' + esc(E.fiche.photo) + '" alt="Barnabé SIX-SEVEN"></div>' +
      '<p class="cctv-sub" data-sub></p>' +
      '<div class="cctv-bar"><i data-bar></i></div>' +
      '</div>'
    );
  }

  /* Voix de Barnabé : fichier MP3 s'il existe, sinon voix de synthèse du
   * téléphone. Retour : promesse résolue à la fin de la phrase. */
  function say(file, text, onStart) {
    GQ.audio.duck(true);
    return GQ.audio.voice(file, onStart).catch(function () { if (onStart) onStart(true); return tts(text); }).then(function () {
      GQ.audio.duck(false);
    }, function () { GQ.audio.duck(false); });
  }

  function tts(text) {
    return new Promise(function (resolve) {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || navigator.webdriver) return resolve();
      var u = new SpeechSynthesisUtterance(GQ.normalizeSpeech(text));
      u.lang = 'fr-FR';
      var v = frenchVoice();
      if (v) u.voice = v;
      u.rate = 0.95;
      u.pitch = 1.05;
      var guard = setTimeout(resolve, 1500 + String(text).length * 90);
      u.onend = u.onerror = function () { clearTimeout(guard); resolve(); };
      speechSynthesis.speak(u);
    });
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* Sous-titre en cours à l'instant `sec` d'une liste { de, a, texte }. */
  function lineAt(list, sec) {
    var seg = (list || []).filter(function (x) { return sec >= x.de && sec < x.a; })[0];
    return seg ? seg.texte : '';
  }

  /* Transmission simulée (sans fichier vidéo) : voix de Barnabé et
   * sous-titres minutés sur sa voix. */
  var runId = 0;
  function runSimulation() {
    var id = ++runId;
    var subs = R.sousTitres || [];
    var total = simDuration() * 1000;
    var startedAt = 0;
    var offset = subs.length ? subs[0].de : 0;
    GQ.every(200, function () {
      if (!startedAt) return;
      var ms = Date.now() - startedAt;
      var bar = document.querySelector('[data-bar]');
      if (bar) bar.style.width = Math.min(100, (ms / total) * 100) + '%';
      var sub = document.querySelector('[data-sub]');
      var txt = lineAt(subs, ms / 1000 + offset);
      if (sub && sub.textContent !== txt) sub.textContent = txt;
    });
    var all = subs.map(function (x) { return x.texte; }).join(' ');
    Promise.all([
      say(R.videoVoix, all, function () { startedAt = Date.now(); }),
      wait(total),
    ]).then(function () { if (id === runId) wait(600).then(function () { if (id === runId) videoEnded(); }); });
  }

  /* Vraie vidéo (MP4 avec voix et musique) : sous-titres synchronisés,
   * passage automatique au rapport à la fin. Si la lecture coince (réseau,
   * lecture refusée…), un bouton permet toujours de continuer. */
  function realVideo() {
    return '<div class="cctv cctv-real">' +
      '<div class="cctv-frame"><video class="cctv-video" playsinline webkit-playsinline preload="auto" disablepictureinpicture controlslist="nodownload noplaybackrate nofullscreen">' +
      '<source src="' + esc(R.video) + '" type="video/mp4">' +
      (/\.mp4$/i.test(R.video) ? '<source src="' + esc(R.video.replace(/\.mp4$/i, '.webm')) + '" type="video/webm">' : '') +
      '</video>' +
      // Sous-titres incrustés en bas de l'image, comme à la télé.
      '<p class="cctv-sub cctv-sub-over" data-sub aria-live="polite"></p>' +
      '<button type="button" class="cctv-tap" data-action="video-tap" hidden>' + GQ.pix('play', 'tap-pix') + '<span>' + esc(R.videoToucher) + '</span></button></div>' +
      '<div class="cctv-bar"><i data-bar></i></div></div>' +
      '<div class="video-rescue" data-rescue hidden><p class="muted small center">' + esc(R.videoBloquee) + '</p>' +
      C.btn(esc(R.boutonApresVideo) + icon('fleche'), 'video-skip', '', 'btn-red') + '</div>';
  }

  function showRescue() {
    var r = document.querySelector('[data-rescue]');
    if (r) r.hidden = false;
  }

  function runVideo() {
    var v = document.querySelector('.cctv-video');
    if (!v) return;
    var subs = R.sousTitres || [];
    // Minutage exact produit par tools/generer-video.py (si présent).
    if (window.fetch && /\.mp4$/i.test(R.video)) {
      fetch(R.video.replace(/\.mp4$/i, '-sous-titres.json'), { cache: 'no-store' }).then(function (r) {
        return r.ok ? r.json() : null;
      }).then(function (list) { if (Array.isArray(list) && list.length) subs = list; }, function () { /* minutage de la config */ });
    }
    var lastT = -1;
    var still = 0;
    v.addEventListener('ended', function () { setTimeout(videoEnded, 600); });
    v.addEventListener('error', showRescue);
    // Avec plusieurs sources, l'échec de la dernière est signalé sur <source>.
    var last = v.querySelectorAll('source');
    if (last.length) last[last.length - 1].addEventListener('error', showRescue);
    v.addEventListener('timeupdate', function () {
      var bar = document.querySelector('[data-bar]');
      if (bar && v.duration) bar.style.width = (v.currentTime / v.duration) * 100 + '%';
      var seg = subs.filter(function (x) { return v.currentTime >= x.de && v.currentTime < x.a; })[0];
      var el = document.querySelector('[data-sub]');
      var txt = seg ? seg.texte : '';
      if (el && el.textContent !== txt) el.textContent = txt;
    });
    // Filet de sécurité : lecture figée plus de 6 s → bouton « continuer ».
    GQ.every(1000, function () {
      if (v.ended) return;
      if (!v.paused && v.currentTime === lastT) still += 1; else still = 0;
      if (v.paused && v.currentTime === 0) still += 1;
      lastT = v.currentTime;
      if (still >= 6) showRescue();
    });
    play(v);
  }

  function play(v) {
    var tap = document.querySelector('.cctv-tap');
    var p;
    try { p = v.play(); } catch (e) { p = null; }
    if (p && p.then) {
      p.then(function () { if (tap) tap.hidden = true; }, function () { if (tap) tap.hidden = false; });
    }
  }

  GQ.actions['video-tap'] = function () {
    var v = document.querySelector('.cctv-video');
    if (v) play(v);
  };

  function videoEnded() {
    if (GQ.state.phase[5] !== 'video') return;
    playingSince = 0;
    runId++;
    GQ.audio.stopVoice();
    GQ.audio.duck(false);
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
      music: real ? null : 'japon',
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
      '<ul class="clues">' + R.indices.map(function (x, i) {
        if (typeof x === 'string') return '<li class="clue is-open"><span class="clue-front">' + t(x) + '</span></li>';
        var open = GQ.ui.clues && GQ.ui.clues[i];
        return '<li><button type="button" class="clue' + (open ? ' is-open' : '') + '" data-action="clue" data-i="' + i + '" aria-expanded="' + !!open + '">' +
          '<span class="clue-title">' + GQ.pix(['clock', 'tower', 'bell', 'loupe'][i] || 'star', 'clue-pix') + t(x.titre) + '</span>' +
          '<span class="clue-front">' + t(x.recto) + '</span>' +
          (open ? '<span class="clue-back">' + icon('fleche') + t(x.verso) + '</span>' : '<span class="clue-hint">Touchez pour analyser</span>') +
          '</button></li>';
      }).join('') + '</ul>' +
      (R.conclusion ? '<p class="terminal-text"><b>' + t(R.conclusion) + '</b></p>' : '') +
      '</section>';
    var rescue = GQ.lairRescue();
    if (gel) {
      html += C.freezeView({ suite: R.gelSuite });
    } else {
      html += (rescue === 'reponse'
        ? '<section class="rescue rescue-answer"><p class="rescue-title">' + GQ.pix('gift', 'rescue-pix') + t(R.reponseSecoursTitre) + '</p><p>' + t(R.reponseSecours) + '</p></section>'
        : rescue === 'indice'
        ? '<section class="rescue"><p class="rescue-title">' + GQ.pix('loupe', 'rescue-pix') + t(R.indiceSecoursTitre) + '</p><p>' + t(R.indiceSecours) + '</p></section>' +
          '<p class="notice notice-warn">' + icon('cadenas') + '<span>' + t(R.unEssai.replace('{duree}', dur)) + '</span></p>'
        : '<p class="notice notice-warn">' + icon('cadenas') + '<span>' + t(R.unEssai.replace('{duree}', dur)) + '</span></p>') +
        (rescue === 'reponse' ? '' : GQ.jokerBlock('q5', R.indiceJoker)) +
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
        '<div class="busted-elf"><img src="' + esc(E.fiche.photo) + '" alt="Barnabé SIX-SEVEN"><span class="busted-sweat" aria-hidden="true">' + GQ.pix('drop') + '</span></div>' +
        '<div class="busted-bubble">' + C.typewriter('q5-found', t(R.trouve), 'busted-text') + '</div>' +
        '</section>' +
        C.cta(C.btn(icon('tel') + esc(R.boutonAppel), 'call', '', 'btn-red btn-blink btn-call')),
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

  /* Message vocal : sous-titres synchronisés sur la voix de Barnabé. */
  function speak() {
    var status = document.querySelector('[data-call-status]');
    if (status) status.textContent = '00:00';
    var sub = document.querySelector('.call-sub');
    if (sub) sub.classList.add('is-on');
    var started = 0;
    var lines = R.messageVocalSousTitres || [];
    var fallback = false;
    GQ.every(150, function () {
      if (!started) return;
      var ms = Date.now() - started;
      var el = document.querySelector('[data-call-status]');
      if (el) el.textContent = GQ.mmss(ms);
      var box = document.querySelector('[data-call-line]');
      var txt = fallback || !lines.length ? R.messageVocal : lineAt(lines, ms / 1000);
      if (box && txt && box.textContent !== txt) {
        box.textContent = txt;
        box.classList.remove('is-new');
        void box.offsetWidth;
        box.classList.add('is-new');
      }
    });
    say(R.audio, R.messageVocal, function (tts) { started = Date.now(); fallback = !!tts; }).then(endCall);
  }

  var EMOJI;
  try { EMOJI = new RegExp('\\p{Extended_Pictographic}', 'gu'); } catch (e) { EMOJI = /[\u2600-\u27BF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g; }

  /* Texte lu à voix haute : on retire les émojis et guillemets. */
  GQ.normalizeSpeech = function (s) {
    return String(s).replace(/[«»"]/g, '').replace(/MDR/g, 'Mort de rire').replace(EMOJI, '');
  };

  function stopAudio() {
    clearTimeout(callTimer);
    GQ.audio.stopVoice();
    GQ.audio.duck(false);
  }

  function endCall() {
    var b = document.querySelector('[data-action="hang-up"]');
    if (b) b.classList.add('btn-blink');
    var box = document.querySelector('[data-call-line]');
    if (box) box.textContent = R.messageVocal;
  }

  function call() {
    return {
      key: 'q5-call',
      music: null,
      html:
        '<h1 class="sr-only" tabindex="-1">' + t(R.appelNom) + '</h1>' +
        '<section class="phone">' +
        '<div class="phone-avatar"><img src="' + esc(E.fiche.photo) + '" alt=""><span class="phone-wave"></span></div>' +
        '<p class="phone-name">' + t(R.appelNom) + '</p>' +
        '<p class="phone-status" data-call-status>' + t(R.appelEnCours) + '</p>' +
        '<div class="call-sub"><p class="call-text" data-call-line aria-live="polite"></p></div>' +
        '</section>' +
        C.cta(C.btn(icon('tel') + esc(R.boutonRaccrocher), 'hang-up', '', 'btn-red btn-hangup')),
      after: function () { if (!callTimer) ring(speak); },
    };
  }

  /* Dans la salle : un paquet, une photo de groupe avec lui. */
  function paquet() {
    var pv = GQ.ui.paquet;
    var body = pv
      ? '<figure class="paquet-shot"><img src="' + pv.thumb + '" alt="Votre photo"></figure>' +
        '<div class="btn-pair">' + C.btn(icon('valide') + esc(R.paquetValider), 'paquet-validate', '', 'btn-red') +
        C.btn(icon('photo') + esc(R.paquetReprendre), 'paquet-take', '', 'btn-secondary') + '</div>'
      : '<div class="paquet-art">' + GQ.knit.icon('gift', 'paquet-gift') + GQ.knit.icon('elfWave', 'paquet-elf') + '</div>' +
        C.cta(C.btn(icon('photo') + esc(R.boutonPhotoPaquet), 'paquet-take', '', 'btn-red btn-blink') +
          '<button type="button" class="btn btn-ghost" data-action="paquet-skip">' + esc(R.paquetSansPhoto) + '</button>');
    return {
      key: 'q5-paquet' + (pv ? '-preview' : ''),
      tone: 'red',
      html:
        C.questHead(5, null, R.paquetTitre) +
        C.frame('<p class="intro-text">' + t(R.paquetTexte) + '</p>') +
        body,
    };
  }

  /* Écran de fin : léger et festif. Un grand titre, le lutin qui danse
   * sur une musique pop-électro, et la consigne finale en petit. */
  function end() {
    var s = GQ.state;
    var c = GQ.clock();
    var stars = '';
    for (var i = 0; i < 22; i++) {
      stars += '<i style="left:' + ((i * 37) % 100) + '%;top:' + ((i * 53) % 70) + '%;animation-delay:' + ((i % 7) * 0.45).toFixed(2) + 's"></i>';
    }
    // Barnabé démasqué danse sur la musique de fin.
    var frames = GQ.knit.icon('elfWave', 'dance-face');
    return {
      key: 'q5-end',
      bare: true,
      tone: 'blue',
      celebrate: 'big',
      music: 'fete',
      html:
        '<main class="finale finale-light">' +
        '<div class="garland" aria-hidden="true"></div>' +
        '<div class="finale-sky" aria-hidden="true">' + stars + '</div>' +
        '<div class="finale-inner">' +
        GQ.logo('clair', 'finale-logo') +
        C.knitTitle(R.finTitre, { color: '#E4323A' }) +
        '<div class="dance" aria-hidden="true"><span class="dance-spot dance-spot-a"></span><span class="dance-spot dance-spot-b"></span>' +
        '<div class="dance-elf">' + frames + '</div><span class="dance-floor"></span></div>' +
        '<p class="finale-team">' + t(R.finTexte, { equipe: s.team || '' }) + (c ? ' · <span class="nowrap">' + GQ.mmss(c.elapsed) + '</span>' : '') + '</p>' +
        '<p class="finale-next">' + t(R.finConsigne) + '</p>' +
        '<p class="finale-home"><a class="btn btn-ghost" href="#/">' + icon('retour') + esc(R.boutonAccueil || 'Retour à l\'accueil') + '</a></p>' +
        '</div></main>',
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
    if (ph === 'paquet') return paquet();
    if (ph === 'end') return end();
    return intro();
  };

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */

  GQ.actions['video-start'] = function () {
    if (!GQ.videoStart()) return GQ.render();
    GQ.audio.prime((R.sousTitres[0] || {}).audio);
    playingSince = Date.now();
    GQ.uiReset();
    GQ.render();
  };

  GQ.actions['video-skip'] = function () {
    if (GQ.state.phase[5] !== 'video') return GQ.render();
    playingSince = 0;
    runId++;
    GQ.audio.stopVoice();
    GQ.audio.duck(false);
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
    GQ.audio.prime(R.audio);
    callTimer = null;
    GQ.setPhase(5, 'call');
    GQ.uiReset();
    GQ.render();
  };

  GQ.actions['hang-up'] = function () {
    stopAudio();
    GQ.audio.sfx('hangup');
    GQ.setPhase(5, 'paquet');
    GQ.uiReset();
    GQ.render();
  };

  /* Photo de l'équipe avec le paquet choisi. */
  GQ.actions['paquet-take'] = function () {
    GQ.camera.open({ titre: R.paquetModele, image: GQ.knit.src('gift') }).then(function (blob) {
      if (!blob) return;
      return GQ.photoTools.process(blob).then(function (img) {
        GQ.ui.paquet = img;
        GQ.render();
      }, function () { GQ.toast(GQ.cfg.quetes.photos.erreurPhoto, 'error'); });
    });
  };

  GQ.actions['paquet-validate'] = function () {
    var img = GQ.ui.paquet;
    var s = GQ.state;
    if (!img || s.phase[5] !== 'paquet') return GQ.render();
    GQ.photoTools.send({ id: s.id, equipe: s.team, modele: 'paquet', titre: R.paquetModele, image: img.full });
    s.q5.paquet = Date.now();
    GQ.finish('fin');
    GQ.uiReset();
    GQ.render();
  };

  GQ.actions['paquet-skip'] = function () {
    if (GQ.state.phase[5] !== 'paquet') return GQ.render();
    GQ.finish('fin');
    GQ.uiReset();
    GQ.render();
  };

  /* Rapport : un indice touché révèle son analyse (et le reste). */
  GQ.actions.clue = function (el) {
    GQ.ui.clues = GQ.ui.clues || {};
    GQ.ui.clues[el.dataset.i] = true;
    var keep = document.querySelector('.answer-form .field');
    if (keep) GQ.ui.value = keep.value;
    GQ.render();
  };

  GQ.forms.lair = function (form, value) {
    if (!value.trim()) return C.formError(value, T.general.reponseVide);
    var res = GQ.lairAnswer(value);
    GQ.uiReset();
    if (!res || res.ok || res.frozen || res.revealed) return GQ.render();
    C.formError(value, T.general.mauvaiseReponse);
  };
})();
