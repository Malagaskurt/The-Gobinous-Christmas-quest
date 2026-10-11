/* Événements plein écran pendant le jeu :
 *  - le « hack » de Barnabé : il gèle l'écran 30 s (givre, message
 *    sarcastique, compte à rebours), une fois par équipe, à un moment tiré
 *    au hasard mais toujours avant la salle Tokyo. Le même écran sert aux
 *    gels de la quête 5 (2 mauvais codes d'affilée) ;
 *  - les alertes de temps : écran rouge clignotant à 10, 5 et 1 minute(s)
 *    restantes, puis « Temps écoulé » (on peut continuer).
 * Réglages : config/parametres.js (hack, chrono) ; textes : config/textes.js
 * (hack, alertes). */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;
  var t = GQ.t;
  var P = GQ.cfg.parametres;
  var T = GQ.cfg.textes;
  var HK = T.hack || {};
  var AL = T.alertes || {};

  function pick(v) { return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] || '' : v || ''; }
  function onGame() { return /^#\/quete\//.test(location.hash); }
  function busy() { return !!document.getElementById('hack') || !!document.getElementById('time-alert'); }

  /* ------------------------------------------------------------------ */
  /* Le hack de Barnabé                                                  */
  /* ------------------------------------------------------------------ */
  var hackTimer = null;

  /* Écran gelé jusqu'à `until` (horodatage). opts.phrases : messages. */
  function showHack(until, opts) {
    opts = opts || {};
    var old = document.getElementById('hack');
    if (old) old.remove();
    clearInterval(hackTimer);
    var el = document.createElement('div');
    el.id = 'hack';
    el.className = 'hack';
    el.setAttribute('role', 'alertdialog');
    el.setAttribute('aria-live', 'assertive');
    el.innerHTML =
      '<div class="hack-frost" aria-hidden="true"></div>' +
      '<div class="hack-glitch" aria-hidden="true"></div>' +
      '<div class="hack-card">' +
      '<p class="hack-kicker">' + GQ.icon('cadenas') + esc(HK.kicker || 'Alerte intrusion') + '</p>' +
      '<div class="hack-ava"><img src="' + esc(GQ.art3d.photo()) + '" alt=""></div>' +
      '<p class="hack-title">' + esc(opts.titre || HK.titre || 'Écran piraté') + '</p>' +
      '<p class="hack-text" data-hack-text>' + t(pick(opts.phrases || HK.phrases)) + '</p>' +
      '<p class="hack-count"><span data-hack-count>15</span><small>' + esc(HK.compteur || 'secondes') + '</small></p>' +
      '</div>';
    document.body.appendChild(el);
    document.body.classList.add('has-hack');
    if (GQ.audio) GQ.audio.sfx('hackAlarm');
    if (navigator.vibrate) { try { navigator.vibrate([400, 150, 400, 150, 400]); } catch (e) { /* pas de vibreur */ } }
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    var count = el.querySelector('[data-hack-count]');
    function tick() {
      var left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      if (count) count.textContent = left;
      if (left > 0) return;
      clearInterval(hackTimer);
      // Fin du gel : petite pique de Barnabé, puis l'écran se débloque.
      var txt = el.querySelector('[data-hack-text]');
      if (txt) txt.innerHTML = t(pick(HK.fin));
      el.classList.add('is-thaw');
      if (GQ.audio) GQ.audio.sfx('unlock');
      setTimeout(function () {
        el.classList.remove('is-in');
        document.body.classList.remove('has-hack');
        setTimeout(function () { el.remove(); if (opts.render !== false) GQ.render(); }, 450);
      }, 1800);
    }
    tick();
    hackTimer = setInterval(tick, 250);
  }

  /* Le hack surprise peut-il se déclencher maintenant ? */
  function hackAllowed() {
    var s = GQ.state;
    var ph = s.phase[s.quest];
    if (!onGame() || s.finished || !s.clockStart || busy()) return false;
    if (document.getElementById('map-full') || document.querySelector('.cam')) return false;
    if (GQ.freezeRemaining() > 0) return false;
    if (s.quest === 5 && /^(video|found|call|end|paquet)$/.test(ph || '')) return false;
    return true;
  }

  function hackTick() {
    var H = P.hack || {};
    if (H.actif === false) return;
    var s = GQ.state;
    var c = GQ.clock();
    if (!c) return;
    if (!s.hack) {
      // Moment tiré au hasard pour cette équipe (début, milieu ou fin).
      var a = Number(H.entrePourcent && H.entrePourcent[0]) || 10;
      var b = Number(H.entrePourcent && H.entrePourcent[1]) || 65;
      s.hack = { plan: Math.round(c.total * (a + Math.random() * (b - a)) / 100), until: 0, done: false };
      GQ.save();
    }
    var h = s.hack;
    if (h.until > Date.now()) {
      if (!document.getElementById('hack') && onGame()) showHack(h.until);
      return;
    }
    if (h.done) return;
    // Obligatoirement avant la salle Tokyo : au plus tard en arrivant à
    // la dernière étape.
    var late = s.quest === 5 && /^(access|intro|report)$/.test(s.phase[5] || '');
    if ((c.elapsed >= h.plan || late) && hackAllowed()) {
      h.done = true;
      h.until = Date.now() + (Number(H.secondes) || 15) * 1000;
      GQ.save();
      showHack(h.until);
    }
  }

  GQ.hack = { show: showHack };

  /* ------------------------------------------------------------------ */
  /* Alertes de temps                                                    */
  /* ------------------------------------------------------------------ */
  function showAlert(kind, title, text, button) {
    var el = document.createElement('div');
    el.id = 'time-alert';
    el.className = 'time-alert is-' + kind;
    el.setAttribute('role', 'alertdialog');
    el.innerHTML =
      '<div class="time-alert-inner">' +
      '<p class="time-alert-kicker">' + GQ.icon('chrono') + esc(AL.kicker || 'Chrono') + '</p>' +
      '<p class="time-alert-title">' + t(title) + '</p>' +
      '<p class="time-alert-text">' + t(text) + '</p>' +
      '<button type="button" class="btn btn-primary" data-alert-close>' + esc(button || AL.ok || 'Compris') + '</button>' +
      '</div>';
    document.body.appendChild(el);
    if (GQ.audio) GQ.audio.sfx('alarm');
    if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200, 100, 200]); } catch (e) { /* pas de vibreur */ } }
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    function close() {
      el.classList.remove('is-in');
      setTimeout(function () { el.remove(); }, 350);
    }
    el.querySelector('[data-alert-close]').addEventListener('click', close);
    if (kind !== 'end') setTimeout(close, 6000);
  }

  function alertTick() {
    var s = GQ.state;
    var c = GQ.clock();
    if (!c || s.finished || !onGame() || busy()) return;
    s.alertes = s.alertes || {};
    if (c.remaining <= 0) {
      if (s.alertes.fin) return;
      [10, 5, 1].forEach(function (m) { s.alertes[m] = true; });
      s.alertes.fin = true;
      GQ.save();
      return showAlert('end', AL.finTitre, AL.finTexte, AL.finBouton);
    }
    // La plus petite échéance franchie (pas d'empilement après un
    // rechargement).
    var hit = null;
    [10, 5, 1].forEach(function (m) { if (c.remaining <= m * 60000 && !s.alertes[m]) hit = m; });
    if (hit == null) return;
    [10, 5, 1].forEach(function (m) { if (m >= hit) s.alertes[m] = true; });
    GQ.save();
    showAlert('warn', t(AL.titre || 'Plus que {n} min !', { n: hit }), AL['texte' + hit] || AL.texte || '', AL.ok);
  }

  setInterval(function () {
    if (window.GQ_EVENTS_OFF) return;
    try { hackTick(); alertTick(); } catch (e) { /* jamais bloquant */ }
  }, 1000);
})();
