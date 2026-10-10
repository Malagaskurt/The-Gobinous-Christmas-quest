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
  function say(file, text) {
    GQ.audio.duck(true);
    return GQ.audio.voice(file).catch(function () { return tts(text); }).then(function () {
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

  var runId = 0;
  function runSimulation() {
    var id = ++runId;
    var subs = R.sousTitres || [];
    var total = simDuration() * 1000;
    var startedAt = Date.now();
    GQ.every(200, function () {
      var bar = document.querySelector('[data-bar]');
      if (bar) bar.style.width = Math.min(100, ((Date.now() - startedAt) / total) * 100) + '%';
    });
    function show(seg) {
      var sub = document.querySelector('[data-sub]');
      if (sub) sub.textContent = seg.texte;
    }
    (function next(i) {
      if (id !== runId || GQ.state.phase[5] !== 'video') return;
      if (i >= subs.length) return wait(600).then(function () { if (id === runId) videoEnded(); });
      var seg = subs[i];
      show(seg);
      // Chaque séquence dure au moins le temps prévu, et toujours jusqu'à la
      // fin de la phrase de Barnabé.
      Promise.all([say(seg.audio, seg.voix || seg.texte), wait((seg.a - seg.de) * 1000)]).then(function () { next(i + 1); });
    })(0);
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
      '<button type="button" class="cctv-tap" data-action="video-tap" hidden>' + GQ.pix('play', 'tap-pix') + '<span>' + esc(R.videoToucher) + '</span></button></div>' +
      '<p class="cctv-sub" data-sub aria-live="polite"></p>' +
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
      '<ol class="audit">' + R.indices.map(function (x, i) { return '<li>' + t(x) + '</li>'; }).join('') + '</ol>' +
      (R.conclusion ? '<p class="terminal-text"><b>' + t(R.conclusion) + '</b></p>' : '') +
      '</section>';
    if (gel) {
      html += C.freezeView({ suite: R.gelSuite });
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
    say(R.audio, R.messageVocal).then(endCall);
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
        '<div class="call-sub">' + C.typewriter('q5-call', t(R.messageVocal), 'call-text') + '</div>' +
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

  /* Écran de fin : une page à part, sans en-tête de jeu, qui « signe »
   * l'aventure (ciel étoilé, scène tricotée, bilan, dernières consignes). */
  function end() {
    var s = GQ.state;
    var c = GQ.clock();
    var d = new Date((s.finished && s.finished.at) || Date.now());
    var stars = '';
    for (var i = 0; i < 26; i++) {
      stars += '<i style="left:' + ((i * 37) % 100) + '%;top:' + ((i * 53) % 70) + '%;animation-delay:' + ((i % 7) * 0.45).toFixed(2) + 's"></i>';
    }
    function stat(k, v) { return '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'; }
    return {
      key: 'q5-end',
      bare: true,
      tone: 'blue',
      celebrate: 'big',
      music: 'noel',
      html:
        '<main class="finale">' +
        '<div class="garland" aria-hidden="true"></div>' +
        '<div class="finale-sky" aria-hidden="true">' + stars + '</div>' +
        '<div class="finale-inner">' +
        GQ.logo('clair', 'finale-logo') +
        '<p class="kicker">' + GQ.icon('etoile') + ' Fin de l\'aventure ' + GQ.icon('etoile') + '</p>' +
        C.knitTitle(R.finTitre, { color: '#E4323A' }) +
        '<p class="finale-sub">' + t(R.finSousTitre) + '</p>' +
        '<div class="finale-scene">' + GQ.knit.scene('finale-knit') + '</div>' +
        '<p class="finale-lead">' + t(R.finTexte, { equipe: s.team || '' }) + '</p>' +
        '<dl class="finale-stats">' +
        stat('Votre temps', c ? GQ.mmss(c.elapsed) : '—') +
        stat('Quêtes', '5/5') +
        stat('Joker', s.joker.used ? 'utilisé' : 'intact') +
        '</dl>' +
        '<section class="finale-card"><h2>' + t(R.finConsignesTitre) + '</h2><ul>' +
        R.finConsignes.map(function (x) { return '<li><span class="finale-ico" aria-hidden="true">' + GQ.pix(x.icone) + '</span><span>' + t(x.texte) + '</span></li>'; }).join('') +
        '</ul></section>' +
        '<p class="finale-voeux">' + GQ.knit.title(R.finVoeux, { alt: C.plain(R.finVoeux), color: '#E4323A', outline: true, cls: 'finale-voeux-img' }) + '</p>' +
        '<p class="finale-sign">— ' + t(R.finSignature) + '</p>' +
        '<p class="finale-date">' + t(T.fin.termineeLe, {
          date: d.toLocaleDateString('fr-FR'),
          heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }) + '</p>' +
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

  GQ.forms.lair = function (form, value) {
    if (!value.trim()) return C.formError(value, T.general.reponseVide);
    var res = GQ.lairAnswer(value);
    GQ.uiReset();
    if (!res || res.ok || res.frozen) return GQ.render();
    C.formError(value, T.general.mauvaiseReponse);
  };
})();
