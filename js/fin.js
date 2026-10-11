/* Écran de fin : vraie scène 3D animée (three.js, assets/vendor/three.min.js,
 * chargé seulement ici).
 * Style « pâte à modeler » premium : le Père Noël fait des allers-retours
 * sur sa trottinette en dansant (bras, jambes, tête), trois lutins dansent
 * autour de lui, des cadeaux flottent et la neige tombe. Pas de cadre :
 * la scène se fond dans la page (fond transparent).
 * Deux bulles (config/quetes.js → traque.finBulles) apparaissent tour à tour.
 * Sans WebGL : repli sur l'image du Père Noël 3D qui se balance.
 * Styles : css/styles.css (section « Fin 3D »). */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;
  var THREE_SRC = 'assets/vendor/three.min.js';
  var FALLBACK = 'assets/img/pere-noel-3d.webp';

  GQ.finShow = function () {
    var B = (GQ.cfg.quetes.traque || {}).finBulles || [];
    var flakes = '';
    for (var i = 0; i < 22; i++) {
      flakes += '<i style="left:' + ((i * 37) % 100) + '%;animation-delay:-' + ((i * 0.83) % 9).toFixed(2) + 's;animation-duration:' + (7 + (i % 5)) + 's;width:' + (i % 3 ? 4 : 6) + 'px;height:' + (i % 3 ? 4 : 6) + 'px"></i>';
    }
    var bubbles = B.slice(0, 2).map(function (b, k) {
      var who = /no[eë]l/i.test(b.qui || '') ? 'santa' : 'elves';
      return '<p class="f3-bubble f3-bubble-' + (k + 1) + ' is-' + who + '"><b>' + esc(b.qui || '') + '</b>' + GQ.t(b.texte) + '</p>';
    }).join('');
    return (
      '<div class="f3" data-f3>' +
      '<div class="f3-snow" aria-hidden="true">' + flakes + '</div>' +
      '<div class="f3-scene" data-f3-scene aria-hidden="true">' +
      '<canvas class="f3-canvas" data-f3-canvas></canvas>' +
      '<img class="f3-fallback" src="' + FALLBACK + '" alt="" hidden>' +
      '</div>' +
      bubbles +
      '</div>'
    );
  };

  /* ------------------------------------------------------------------ */
  /* Chargement de three.js (une seule fois)                             */
  /* ------------------------------------------------------------------ */
  var loading = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = THREE_SRC;
      s.onload = function () { window.THREE ? resolve(window.THREE) : reject(new Error('three')); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return loading;
  }

  function fallback(root) {
    var img = root.querySelector('.f3-fallback');
    var cv = root.querySelector('canvas');
    if (cv) cv.hidden = true;
    if (img) img.hidden = false;
    root.classList.add('is-fallback');
  }

  /* ------------------------------------------------------------------ */
  /* Personnages (formes simples, matières mates façon pâte à modeler)   */
  /* ------------------------------------------------------------------ */
  function build(T) {
    var mats = {};
    function mat(c, rough) {
      var k = c + '|' + (rough || 0.6);
      if (!mats[k]) mats[k] = new T.MeshStandardMaterial({ color: c, roughness: rough || 0.6, metalness: 0 });
      return mats[k];
    }
    function mesh(geo, c, rough) {
      var m = new T.Mesh(geo, mat(c, rough));
      m.castShadow = true;
      return m;
    }
    function at(o, x, y, z) { o.position.set(x, y, z); return o; }
    function sphere(r, c, rough) { return mesh(new T.SphereGeometry(r, 32, 24), c, rough); }
    function capsule(r, len, c) { return mesh(new T.CapsuleGeometry(r, len, 8, 16), c); }
    function torus(r, tube, c) { var m = mesh(new T.TorusGeometry(r, tube, 14, 40), c, 0.9); m.rotation.x = Math.PI / 2; return m; }

    var RED = 0xe4323a, WHITE = 0xffffff, SKIN = 0xf3c6a8, NAVY = 0x0b1d45, BLUE = 0x17428c, SKY = 0x2fc0ee, GOLD = 0xf2c14e;

    /* Un membre articulé : pivot en haut, capsule qui pend vers le bas. */
    function limb(r, len, c, end) {
      var g = new T.Group();
      g.add(at(capsule(r, len, c), 0, -len / 2 - r * 0.3, 0));
      if (end) g.add(at(end, 0, -len - r * 1.1, 0));
      return g;
    }

    /* --- Le Père Noël --- */
    function santa() {
      var root = new T.Group();
      var hips = new T.Group(); root.add(hips); hips.position.y = 0.78;
      var legs = [-0.17, 0.17].map(function (x) {
        var boot = sphere(0.16, NAVY, 0.45); boot.scale.set(1, 0.75, 1.45); boot.position.z = 0.06;
        var l = limb(0.13, 0.38, RED, boot);
        l.position.set(x, 0, 0);
        hips.add(l);
        return l;
      });
      var body = new T.Group(); hips.add(body);
      var belly = sphere(0.52, RED); belly.scale.set(1, 1.05, 0.92); belly.position.y = 0.42; body.add(belly);
      body.add(at(torus(0.44, 0.1, WHITE), 0, 0.0, 0));
      var belt = mesh(new T.CylinderGeometry(0.5, 0.52, 0.13, 40), NAVY, 0.5); belt.position.y = 0.36; body.add(belt);
      var buckle = mesh(new T.BoxGeometry(0.2, 0.17, 0.05), GOLD, 0.3); buckle.position.set(0, 0.36, 0.5); body.add(buckle);
      var stripe = mesh(new T.BoxGeometry(0.14, 0.62, 0.06), WHITE, 0.9); stripe.position.set(0, 0.62, 0.43); stripe.rotation.x = -0.18; body.add(stripe);
      // Bras : gauche qui salue, droit sur le guidon.
      var arms = [-1, 1].map(function (s) {
        var mit = sphere(0.11, NAVY, 0.5);
        var a = limb(0.105, 0.42, RED, mit);
        a.add(at(torus(0.12, 0.05, WHITE), 0, -0.5, 0));
        a.position.set(0.47 * s, 0.82, 0);
        body.add(a);
        return a;
      });
      var head = new T.Group(); head.position.y = 1.2; body.add(head);
      head.add(sphere(0.33, SKIN, 0.55));
      var beard = sphere(0.36, WHITE, 0.95); beard.scale.set(1, 1.05, 0.7); beard.position.set(0, -0.2, 0.12); head.add(beard);
      [-1, 1].forEach(function (s) {
        var m = sphere(0.11, WHITE, 0.95); m.scale.set(1.5, 0.75, 0.9); m.position.set(0.1 * s, -0.06, 0.3); m.rotation.z = 0.35 * s; head.add(m);
        var cheek = sphere(0.07, 0xf29a9a, 0.7); cheek.position.set(0.19 * s, 0.02, 0.25); head.add(cheek);
        // Lunettes de soleil rondes.
        var lens = mesh(new T.CylinderGeometry(0.095, 0.095, 0.03, 28), NAVY, 0.15); lens.rotation.x = Math.PI / 2; lens.position.set(0.12 * s, 0.09, 0.31); head.add(lens);
        var rim = mesh(new T.TorusGeometry(0.1, 0.018, 10, 28), SKY, 0.3); rim.position.set(0.12 * s, 0.09, 0.325); head.add(rim);
      });
      var bridge = mesh(new T.BoxGeometry(0.07, 0.02, 0.02), SKY, 0.3); bridge.position.set(0, 0.1, 0.33); head.add(bridge);
      head.add(at(sphere(0.075, 0xe88a8a, 0.5), 0, 0.01, 0.34));
      var hat = new T.Group(); hat.position.y = 0.22; hat.rotation.z = -0.25; head.add(hat);
      hat.add(at(torus(0.31, 0.08, WHITE), 0, 0, 0));
      var cone = mesh(new T.ConeGeometry(0.3, 0.6, 32), RED); cone.position.set(0.05, 0.3, 0); cone.rotation.z = -0.35; hat.add(cone);
      hat.add(at(sphere(0.09, WHITE, 0.95), 0.18, 0.56, 0));
      return { root: root, hips: hips, body: body, head: head, arms: arms, legs: legs, hat: hat };
    }

    /* --- La trottinette --- */
    function scooter() {
      var g = new T.Group();
      var deck = mesh(new T.BoxGeometry(1.25, 0.08, 0.34), SKY, 0.35); deck.position.y = 0.17; g.add(deck);
      [-0.55, 0.55].forEach(function (x) {
        var w = mesh(new T.CylinderGeometry(0.14, 0.14, 0.1, 28), NAVY, 0.5); w.rotation.x = Math.PI / 2; w.position.set(x, 0.14, 0); g.add(w);
        var hub = mesh(new T.CylinderGeometry(0.06, 0.06, 0.12, 16), WHITE, 0.4); hub.rotation.x = Math.PI / 2; hub.position.set(x, 0.14, 0); g.add(hub);
      });
      var stem = mesh(new T.CylinderGeometry(0.04, 0.04, 1.25, 16), SKY, 0.35); stem.position.set(0.55, 0.78, 0); stem.rotation.z = -0.12; g.add(stem);
      var bar = mesh(new T.CylinderGeometry(0.035, 0.035, 0.6, 16), SKY, 0.35); bar.rotation.x = Math.PI / 2; bar.position.set(0.62, 1.38, 0); g.add(bar);
      [-0.3, 0.3].forEach(function (z) { var grip = capsule(0.05, 0.08, NAVY); grip.rotation.x = Math.PI / 2; g.add(at(grip, 0.62, 1.38, z)); });
      var lamp = sphere(0.07, 0xfff3b0, 0.2); lamp.material = new T.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xfff3b0, emissiveIntensity: 0.9 }); lamp.position.set(0.62, 1.22, 0); g.add(lamp);
      return g;
    }

    /* --- Un lutin --- */
    function elf(suit, alt) {
      var root = new T.Group();
      var hips = new T.Group(); hips.position.y = 0.42; root.add(hips);
      var legs = [-0.09, 0.09].map(function (x, i) {
        var shoe = sphere(0.085, RED, 0.5); shoe.scale.set(1, 0.7, 1.6); shoe.position.z = 0.05;
        var l = limb(0.065, 0.24, i ? WHITE : RED, shoe);
        l.position.x = x; hips.add(l); return l;
      });
      var body = new T.Group(); hips.add(body);
      var tunic = mesh(new T.ConeGeometry(0.27, 0.5, 28), suit, 0.6); tunic.position.y = 0.2; body.add(tunic);
      body.add(at(torus(0.17, 0.035, WHITE), 0, 0.12, 0));
      var arms = [-1, 1].map(function (s) {
        var a = limb(0.055, 0.22, suit, sphere(0.06, SKIN));
        a.position.set(0.13 * s, 0.36, 0); body.add(a); return a;
      });
      var head = new T.Group(); head.position.y = 0.58; body.add(head);
      head.add(sphere(0.2, SKIN, 0.55));
      [-1, 1].forEach(function (s) {
        var ear = mesh(new T.ConeGeometry(0.06, 0.2, 16), SKIN, 0.55); ear.position.set(0.2 * s, 0.02, 0); ear.rotation.z = -1.25 * s; head.add(ear);
        head.add(at(sphere(0.028, NAVY, 0.3), 0.07 * s, 0.03, 0.18));
        head.add(at(sphere(0.04, 0xf29a9a, 0.7), 0.12 * s, -0.04, 0.15));
      });
      var smile = mesh(new T.TorusGeometry(0.05, 0.012, 8, 20, Math.PI), NAVY, 0.4); smile.position.set(0, -0.06, 0.185); smile.rotation.z = Math.PI; head.add(smile);
      var hat = new T.Group(); hat.position.y = 0.14; head.add(hat);
      hat.add(at(torus(0.19, 0.045, WHITE), 0, 0, 0));
      var cone = mesh(new T.ConeGeometry(0.19, 0.5, 28), alt, 0.6); cone.position.set(0, 0.25, -0.03); cone.rotation.x = -0.35; hat.add(cone);
      hat.add(at(sphere(0.06, WHITE, 0.95), 0, 0.46, -0.16));
      return { root: root, hips: hips, body: body, head: head, arms: arms, legs: legs };
    }

    /* --- Un cadeau --- */
    function gift(c, rib, s) {
      var g = new T.Group();
      g.add(mesh(new T.BoxGeometry(s, s, s), c, 0.45));
      var r1 = mesh(new T.BoxGeometry(s * 1.02, s * 1.02, s * 0.18), rib, 0.5); g.add(r1);
      var r2 = mesh(new T.BoxGeometry(s * 0.18, s * 1.02, s * 1.02), rib, 0.5); g.add(r2);
      [-1, 1].forEach(function (k) {
        var bow = mesh(new T.TorusGeometry(s * 0.17, s * 0.06, 10, 24), rib, 0.5);
        bow.position.set(s * 0.14 * k, s * 0.6, 0); bow.rotation.y = Math.PI / 2; bow.rotation.x = 0.5 * k; g.add(bow);
      });
      return g;
    }

    return { santa: santa, scooter: scooter, elf: elf, gift: gift, colors: { RED: RED, WHITE: WHITE, BLUE: BLUE, SKY: SKY, NAVY: NAVY } };
  }

  /* ------------------------------------------------------------------ */
  /* Mise en scène                                                       */
  /* ------------------------------------------------------------------ */
  function stage(T, canvas, root) {
    var renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
    cam.position.set(0, 1.9, 8.6);
    cam.lookAt(0, 1.15, 0);

    scene.add(new T.HemisphereLight(0xcdefff, 0x17428c, 1.25));
    var sun = new T.DirectionalLight(0xffffff, 2.1);
    sun.position.set(3, 6, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -4; sun.shadow.camera.right = 4; sun.shadow.camera.top = 4; sun.shadow.camera.bottom = -2;
    sun.shadow.radius = 6;
    scene.add(sun);
    var rim = new T.DirectionalLight(0x8fe3ff, 1.4);
    rim.position.set(-4, 3, -4);
    scene.add(rim);

    var K = build(T);
    // Sol enneigé : disque doux qui reçoit les ombres.
    var ground = new T.Mesh(new T.CircleGeometry(3.1, 64), new T.MeshStandardMaterial({ color: 0xd4f0fb, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    var ring = new T.Mesh(new T.RingGeometry(3.1, 3.3, 64), new T.MeshBasicMaterial({ color: 0x2fc0ee, transparent: true, opacity: 0.35 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002;
    scene.add(ring);

    var rider = new T.Group();
    var sc = K.scooter();
    rider.add(sc);
    var S = K.santa();
    S.root.position.set(-0.05, 0.2, 0);
    S.root.scale.setScalar(0.92);
    rider.add(S.root);
    scene.add(rider);

    var elves = [
      { e: K.elf(K.colors.BLUE, K.colors.RED), x: -2.05, z: 0.8, ph: 0 },
      { e: K.elf(K.colors.SKY, K.colors.RED), x: 2.05, z: 0.8, ph: 1.7 },
      { e: K.elf(K.colors.RED, K.colors.BLUE), x: 0.1, z: 1.7, ph: 3.1 },
    ];
    elves.forEach(function (o) {
      o.e.root.position.set(o.x, 0, o.z);
      o.e.root.scale.setScalar(1.25);
      scene.add(o.e.root);
    });

    var gifts = [
      { g: K.gift(K.colors.RED, K.colors.WHITE, 0.42), x: -2.3, y: 2.6, z: -1.6 },
      { g: K.gift(K.colors.SKY, K.colors.RED, 0.34), x: 2.2, y: 2.9, z: -1.4 },
      { g: K.gift(K.colors.BLUE, K.colors.WHITE, 0.3), x: -1.2, y: 3.4, z: -2.6 },
      { g: K.gift(K.colors.RED, K.colors.SKY, 0.26), x: 1.5, y: 3.6, z: -2.8 },
    ];
    gifts.forEach(function (o, i) { o.g.position.set(o.x, o.y, o.z); o.ph = i * 1.3; scene.add(o.g); });

    // Neige.
    var N = 140, pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 10; pos[i * 3 + 1] = Math.random() * 6; pos[i * 3 + 2] = (Math.random() - 0.5) * 6; }
    var snowGeo = new T.BufferGeometry();
    snowGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
    var snow = new T.Points(snowGeo, new T.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.85 }));
    scene.add(snow);

    function resize() {
      var w = canvas.clientWidth || 360, h = canvas.clientHeight || 300;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      // On recule juste assez pour garder toute la scène en largeur.
      var fit = 2.85 / (Math.tan((cam.fov * Math.PI) / 360) * cam.aspect);
      cam.position.z = Math.max(8.6, Math.min(14, fit));
      cam.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var t0 = performance.now();
    var running = true;

    function pose(t) {
      // Allers-retours en trottinette, avec penchée dans les virages.
      var x = Math.sin(t * 0.55) * 1.15;
      var v = Math.cos(t * 0.55);
      rider.position.set(x, 0, 0.1);
      rider.rotation.y = v * 0.55;
      rider.rotation.z = -v * 0.06;
      sc.children.forEach(function (c) { if (c.geometry && c.geometry.type === 'CylinderGeometry' && Math.abs(c.position.y - 0.14) < 0.01) c.rotation.y = -t * 6; });
      // Le Père Noël danse sur sa trottinette.
      var beat = t * 4.2;
      S.hips.position.y = 0.78 + Math.abs(Math.sin(beat)) * 0.07;
      S.body.rotation.z = Math.sin(beat) * 0.09;
      S.body.rotation.y = Math.sin(beat * 0.5) * 0.18;
      S.head.rotation.z = Math.sin(beat + 1) * 0.14;
      S.head.rotation.x = Math.sin(beat * 2) * 0.05;
      S.hat.rotation.x = Math.sin(beat + 2) * 0.12;
      S.arms[0].rotation.z = -2.5 + Math.sin(t * 7) * 0.45; // bras gauche : salue
      S.arms[0].rotation.x = Math.sin(t * 3.5) * 0.25;
      S.arms[1].rotation.z = 0.9 + Math.sin(beat) * 0.12;     // bras droit : vers le guidon
      S.arms[1].rotation.x = -0.5;
      S.legs[0].rotation.x = Math.sin(beat) * 0.18;
      S.legs[1].rotation.x = -Math.sin(beat) * 0.18;
      // Les lutins dansent : sauts, bras qui pompent, demi-tours.
      elves.forEach(function (o, k) {
        var b = t * 5 + o.ph;
        var E = o.e;
        E.root.position.y = Math.abs(Math.sin(b)) * 0.22;
        E.root.rotation.y = k === 2 ? (t * 1.6) % (Math.PI * 2) : Math.sin(t * 1.8 + o.ph) * 0.7;
        E.body.rotation.z = Math.sin(b * 0.5) * 0.18;
        E.hips.rotation.z = Math.sin(b) * 0.15;
        E.arms[0].rotation.z = -1.4 - Math.sin(b * 2) * 1.0;
        E.arms[1].rotation.z = 1.4 + Math.sin(b * 2 + 1) * 1.0;
        E.legs[0].rotation.x = Math.max(0, Math.sin(b)) * 0.7;
        E.legs[1].rotation.x = Math.max(0, -Math.sin(b)) * 0.7;
        E.head.rotation.z = Math.sin(b) * 0.2;
      });
      gifts.forEach(function (o) {
        o.g.position.y = o.y + Math.sin(t * 1.3 + o.ph) * 0.18;
        o.g.rotation.y = t * 0.6 + o.ph;
        o.g.rotation.x = Math.sin(t * 0.8 + o.ph) * 0.25;
      });
      var p = snowGeo.attributes.position;
      for (var j = 0; j < N; j++) {
        var y = p.getY(j) - 0.012;
        p.setY(j, y < 0 ? 6 : y);
        p.setX(j, p.getX(j) + Math.sin(t + j) * 0.002);
      }
      p.needsUpdate = true;
    }

    function frame() {
      if (!running) return;
      if (!root.isConnected) { running = false; window.removeEventListener('resize', resize); renderer.dispose(); return; }
      if (!document.hidden) {
        pose((performance.now() - t0) / 1000);
        renderer.render(scene, cam);
      }
      requestAnimationFrame(frame);
    }
    if (still) { pose(2.2); renderer.render(scene, cam); } else { frame(); }
    root.classList.add('is-3d');
    return true;
  }

  /* Lancé après l'affichage de l'écran de fin. */
  GQ.finTilt = function () {
    var root = document.querySelector('[data-f3-scene]');
    if (!root) return;
    var canvas = root.querySelector('canvas');
    var gl = null;
    try { var probe = document.createElement('canvas'); gl = probe.getContext('webgl2') || probe.getContext('webgl'); } catch (e) { gl = null; }
    if (!gl) return fallback(root);
    loadThree().then(function (T) {
      if (!root.isConnected) return;
      if (!stage(T, canvas, root)) fallback(root);
    }, function () { fallback(root); });
  };
})();
