/* ==========================================================================
   RouteX — WebGL (three.js) scenes:
     1) initAuthScene   -> ambient drifting node network behind the login card
     2) initTopoScene   -> interactive, draggable 3D chain-topology graph
   Both are defensive: if THREE failed to load (offline viewer), they no-op.
   ========================================================================== */
(function (global) {
  "use strict";
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function makeDotTexture(hex) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, hex + "ff");
    g.addColorStop(0.4, hex + "bb");
    g.addColorStop(1, hex + "00");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function fibonacciSphere(n, radius) {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      pts.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
    }
    return pts;
  }

  /* ------------------------------------------------------------------ */
  /* 1) Ambient network — login hero                                     */
  /* ------------------------------------------------------------------ */
  function initAuthScene(canvas) {
    if (!global.THREE || !canvas) return { destroy() {} };
    const parent = canvas.parentElement;
    let w = parent.clientWidth, h = parent.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 13);

    const group = new THREE.Group();
    scene.add(group);

    const COUNT = 80;
    const anchors = [];
    for (let i = 0; i < COUNT; i++) {
      anchors.push(new THREE.Vector3((Math.random() - 0.5) * 19, (Math.random() - 0.5) * 11, (Math.random() - 0.5) * 10 - 1));
    }
    const phases = anchors.map(() => Math.random() * Math.PI * 2);
    const colors = anchors.map(() => (Math.random() < 0.78 ? 0x34d399 : 0x38bdf8));

    const posAttr = new Float32Array(COUNT * 3);
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(posAttr, 3));
    const tex = makeDotTexture("#34d399");
    const ptMat = new THREE.PointsMaterial({ size: 0.22, map: tex, transparent: true, depthWrite: false, opacity: 0.95, blending: THREE.AdditiveBlending, vertexColors: false });
    const points = new THREE.Points(ptGeo, ptMat);
    group.add(points);

    // brighter accent subset rendered separately for a two-tone glow
    const edges = [];
    const maxDist = 4.3;
    for (let i = 0; i < COUNT; i++) {
      let linked = 0;
      for (let j = i + 1; j < COUNT && linked < 3; j++) {
        if (anchors[i].distanceTo(anchors[j]) < maxDist) { edges.push([i, j]); linked++; }
      }
    }
    const lineAttr = new Float32Array(edges.length * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(lineAttr, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x5da98c, transparent: true, opacity: 0.16 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    const mouse = { x: 0, y: 0 };
    function onMove(e) {
      const r = parent.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    window.addEventListener("pointermove", onMove);

    function layout(t) {
      for (let i = 0; i < COUNT; i++) {
        const a = anchors[i], ph = phases[i];
        const x = a.x + Math.sin(t * 0.25 + ph) * 0.35;
        const y = a.y + Math.cos(t * 0.21 + ph) * 0.35;
        const z = a.z + Math.sin(t * 0.18 + ph * 1.3) * 0.35;
        posAttr[i * 3] = x; posAttr[i * 3 + 1] = y; posAttr[i * 3 + 2] = z;
      }
      ptGeo.attributes.position.needsUpdate = true;
      for (let e = 0; e < edges.length; e++) {
        const [i, j] = edges[e];
        lineAttr[e * 6] = posAttr[i * 3]; lineAttr[e * 6 + 1] = posAttr[i * 3 + 1]; lineAttr[e * 6 + 2] = posAttr[i * 3 + 2];
        lineAttr[e * 6 + 3] = posAttr[j * 3]; lineAttr[e * 6 + 4] = posAttr[j * 3 + 1]; lineAttr[e * 6 + 5] = posAttr[j * 3 + 2];
      }
      lineGeo.attributes.position.needsUpdate = true;
    }
    layout(0);

    let raf = null, running = true;
    const clock = new THREE.Clock();
    function tick() {
      if (!running) return;
      const t = clock.getElapsedTime();
      layout(t);
      group.rotation.y += 0.0009;
      group.rotation.x = Math.sin(t * 0.06) * 0.05;
      camera.position.x += (mouse.x * 1.4 - camera.position.x) * 0.02;
      camera.position.y += (-mouse.y * 1.0 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    if (REDUCED) {
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(tick);
    }

    function onResize() {
      w = parent.clientWidth; h = parent.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return {
      destroy() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onMove);
        ptGeo.dispose(); lineGeo.dispose(); ptMat.dispose(); lineMat.dispose(); renderer.dispose();
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* 2) Interactive chain topology — Network page                        */
  /* ------------------------------------------------------------------ */
  function initTopoScene(canvas, labelLayer, networks, edgesList) {
    if (!global.THREE || !canvas) {
      if (labelLayer) labelLayer.innerHTML = "";
      let fallback = null;
      if (canvas && canvas.parentElement) {
        fallback = document.createElement("div");
        fallback.className = "empty-state";
        fallback.style.cssText = "position:absolute;inset:0;";
        fallback.innerHTML = '<div class="eic">' + (global.RouteXIcons ? global.RouteXIcons.icon("network", { size: 24 }) : "") +
          "</div><h4>3D view unavailable</h4><p>This browser session couldn't load the WebGL renderer. Chain data below is still live.</p>";
        canvas.parentElement.appendChild(fallback);
      }
      return { destroy() { if (fallback) fallback.remove(); } };
    }
    const parent = canvas.parentElement;
    let w = parent.clientWidth, h = parent.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 11.5);

    const group = new THREE.Group();
    scene.add(group);

    const statusColor = { healthy: 0x34d399, degraded: 0xfbbf24, unavailable: 0xfb7185 };
    const R = 4.3;
    const positions = fibonacciSphere(networks.length, R);

    // wireframe sphere shell for structure
    const shellGeo = new THREE.IcosahedronGeometry(R, 2);
    const shellMat = new THREE.MeshBasicMaterial({ color: 0x2c3c58, wireframe: true, transparent: true, opacity: 0.12 });
    group.add(new THREE.Mesh(shellGeo, shellMat));

    const nodeMeshes = [];
    networks.forEach((net, i) => {
      const pos = positions[i];
      const color = statusColor[net.status] || 0x34d399;
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 20), new THREE.MeshBasicMaterial({ color }));
      core.position.copy(pos);
      group.add(core);
      const glowTex = makeDotTexture("#" + color.toString(16).padStart(6, "0"));
      const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 });
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(1.15, 1.15, 1.15);
      glow.position.copy(pos);
      group.add(glow);
      nodeMeshes.push({ net, pos, core });
    });

    const curves = [];
    edgesList.forEach(([aId, bId]) => {
      const ai = networks.findIndex((n) => n.id === aId);
      const bi = networks.findIndex((n) => n.id === bId);
      if (ai < 0 || bi < 0) return;
      const a = positions[ai], b = positions[bi];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.setLength(R * 1.42);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const pts = curve.getPoints(40);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x5da98c, transparent: true, opacity: 0.3 });
      group.add(new THREE.Line(geo, mat));
      const pulseTex = makeDotTexture("#6ee7b7");
      const pulseMat = new THREE.SpriteMaterial({ map: pulseTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const pulse = new THREE.Sprite(pulseMat);
      pulse.scale.set(0.38, 0.38, 0.38);
      group.add(pulse);
      curves.push({ curve, pulse, offset: Math.random() });
    });

    /* drag-to-rotate with inertia */
    let dragging = false, lastX = 0, lastY = 0, velX = 0, velY = 0, idleT = 0;
    canvas.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; idleT = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      velX = dx * 0.004; velY = dy * 0.004;
      group.rotation.y += velX;
      group.rotation.x += velY;
      group.rotation.x = Math.max(-1.1, Math.min(1.1, group.rotation.x));
    });
    window.addEventListener("pointerup", () => (dragging = false));

    const vec = new THREE.Vector3();
    function updateLabels() {
      nodeMeshes.forEach(({ net, core }) => {
        core.getWorldPosition(vec);
        const p = vec.clone().project(camera);
        const el = labelLayer.querySelector(`[data-net="${net.id}"]`);
        if (!el) return;
        if (p.z > 1) { el.style.opacity = "0"; return; }
        const x = (p.x * 0.5 + 0.5) * w;
        const y = (-p.y * 0.5 + 0.5) * h;
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -140%)`;
        const depth = (p.z + 1) / 2;
        el.style.opacity = String(Math.max(0.35, 1 - depth * 0.8));
      });
    }

    let raf = null, running = true;
    const clock = new THREE.Clock();
    function tick() {
      if (!running) return;
      const t = clock.getElapsedTime();
      if (!dragging) {
        velX *= 0.94; velY *= 0.94;
        idleT += 0.016;
        const auto = idleT > 1.2 ? 0.0016 : 0;
        group.rotation.y += velX + auto;
        group.rotation.x += velY;
      }
      curves.forEach((c, i) => {
        const tt = (t * 0.12 + c.offset) % 1;
        const p = c.curve.getPoint(tt);
        c.pulse.position.copy(p);
      });
      updateLabels();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    function onResize() {
      w = parent.clientWidth; h = parent.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return {
      destroy() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* 3) Ambient hero topology — Command Center banner                    */
  /* A label-free, non-interactive, continuously auto-rotating cousin   */
  /* of initTopoScene: same node/edge/pulse visual language as the      */
  /* Network page, scaled down as background decoration behind text.    */
  /* ------------------------------------------------------------------ */
  function initHeroScene(canvas, networks, edgesList) {
    if (!global.THREE || !canvas) return { destroy() {} };
    const parent = canvas.parentElement;
    let w = parent.clientWidth, h = parent.clientHeight;
    if (!w || !h) return { destroy() {} };

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
    camera.position.set(0, 0, 11.5);

    const group = new THREE.Group();
    group.rotation.x = 0.22;
    group.position.x = 1.6; // bias the sphere toward the right side of the banner
    scene.add(group);

    const statusColor = { healthy: 0xe10600, degraded: 0xe3a33d, unavailable: 0x8a8a8a };
    const R = 3.6;
    const positions = fibonacciSphere(networks.length, R);

    const shellGeo = new THREE.IcosahedronGeometry(R, 2);
    const shellMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a, wireframe: true, transparent: true, opacity: 0.14 });
    group.add(new THREE.Mesh(shellGeo, shellMat));

    networks.forEach((net, i) => {
      const pos = positions[i];
      const color = statusColor[net.status] || 0xe10600;
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshBasicMaterial({ color }));
      core.position.copy(pos);
      group.add(core);
      const glowTex = makeDotTexture("#" + color.toString(16).padStart(6, "0"));
      const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(0.95, 0.95, 0.95);
      glow.position.copy(pos);
      group.add(glow);
    });

    const curves = [];
    edgesList.forEach(([aId, bId]) => {
      const ai = networks.findIndex((n) => n.id === aId);
      const bi = networks.findIndex((n) => n.id === bId);
      if (ai < 0 || bi < 0) return;
      const a = positions[ai], b = positions[bi];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.setLength(R * 1.4);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const pts = curve.getPoints(32);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x8a1a14, transparent: true, opacity: 0.28 });
      group.add(new THREE.Line(geo, mat));
      const pulseTex = makeDotTexture("#ff6a52");
      const pulseMat = new THREE.SpriteMaterial({ map: pulseTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const pulse = new THREE.Sprite(pulseMat);
      pulse.scale.set(0.3, 0.3, 0.3);
      group.add(pulse);
      curves.push({ curve, pulse, offset: Math.random() });
    });

    let raf = null, running = true;
    const clock = new THREE.Clock();
    function tick() {
      if (!running) return;
      const t = clock.getElapsedTime();
      group.rotation.y += 0.0014;
      curves.forEach((c) => {
        const tt = (t * 0.1 + c.offset) % 1;
        c.pulse.position.copy(c.curve.getPoint(tt));
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    if (REDUCED) {
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(tick);
    }

    function onResize() {
      w = parent.clientWidth; h = parent.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return {
      destroy() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      }
    };
  }

  global.RouteXBG = { initAuthScene, initTopoScene, initHeroScene };
})(window);
