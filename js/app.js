/* ==========================================================================
   RouteX — application shell, router and page renderers
   ========================================================================== */
(function () {
  "use strict";
  const D = window.RouteXData;
  const I = window.RouteXIcons.icon;
  const PM = window.RouteXIcons.providerMark;
  const C = window.RouteXCharts;

  const PROVIDER_COLOR = { cctp: "#38BDF8", stargate: "#B48BFF", across: "#34D399", hop: "#FFD166", wormhole: "#FF8A6B" };
  const POLICY_ICON = { balanced: "scale", cheapest: "dollar", fastest: "zap", reliable: "shield-check" };

  const state = {
    session: null,
    route: "command-center",
    exec: { source: "ethereum", destination: "arbitrum", asset: "usdc", amount: 5000, policy: "balanced" },
    pageCleanup: null,
    authScene: null,
    topoScene: null,
    heroScene: null
  };

  try { state.session = JSON.parse(localStorage.getItem("routex_session") || "null"); } catch (e) { state.session = null; }

  /* ------------------------------ utilities ------------------------------ */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function relTime(mins) {
    if (mins < 1) return "just now";
    if (mins < 60) return Math.round(mins) + "m ago";
    if (mins < 1440) return Math.round(mins / 60) + "h ago";
    return Math.round(mins / 1440) + "d ago";
  }
  function statusPill(status) {
    const map = { healthy: ["pill-good", "Healthy"], degraded: ["pill-warning", "Degraded"], unavailable: ["pill-critical", "Unavailable"] };
    const [cls, label] = map[status] || map.healthy;
    return `<span class="pill ${cls}"><span class="dot"></span>${label}</span>`;
  }
  function netChip(net) {
    return `<span class="net-tag"><span class="net-dot" style="background:${net.color}"></span>${net.name}</span>`;
  }
  function providerChip(p) {
    const color = PROVIDER_COLOR[p.id] || "#34D399";
    return `<span class="chip"><span class="chip-dot" style="background:${color};color:#fff">${PM(p.id, { size: 11, strokeWidth: 2.1 })}</span>${p.name}</span>`;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

  /* Shared-chain pairs derived from provider coverage — used to drive both
     the Network page's interactive topology and the Command Center's
     ambient hero animation, so the two stay visually consistent. */
  function buildNetworkEdges() {
    const edges = [];
    const seen = new Set();
    D.PROVIDERS.forEach((p) => {
      for (let i = 0; i < p.networks.length; i++) {
        for (let j = i + 1; j < p.networks.length; j++) {
          const key = [p.networks[i], p.networks[j]].sort().join("-");
          if (!seen.has(key)) { seen.add(key); edges.push([p.networks[i], p.networks[j]]); }
        }
      }
    });
    return edges;
  }

  function toast(message, icon) {
    const stack = qs("#toast-stack");
    if (!stack) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = I(icon || "check-circle") + `<span>${escapeHtml(message)}</span>`;
    stack.appendChild(t);
    setTimeout(() => {
      t.classList.add("leaving");
      setTimeout(() => t.remove(), 320);
    }, 3200);
  }

  /* ------------------------------ scroll reveal ---------------------------- */
  // Staggered entrance as cards cross into view — replaces the old pointer-tilt
  // effect with motion that's purposeful (happens once, on arrival) rather than
  // continuous or hover-driven.
  let revealObserver = null;
  function enableReveal(root) {
    const nodes = qsa(".reveal", root);
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("in"));
      return;
    }
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = Math.min(parseInt(el.dataset.revealIndex || "0", 10) * 55, 330);
            el.style.transitionDelay = delay + "ms";
            el.classList.add("in");
            revealObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    nodes.forEach((n, i) => {
      n.dataset.revealIndex = i % 8;
      revealObserver.observe(n);
    });
  }

  /* An inline SVG "routing hub" illustration — a core node with orbiting
     chain-nodes — standing in for a hero photo the CSP won't let us load. */
  function authIllustration() {
    return `
    <svg class="auth-illustration" viewBox="0 0 420 420" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="illo-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FF6A52" stop-opacity="0.9"/>
          <stop offset="55%" stop-color="#E10600" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#E10600" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="210" cy="210" r="90" fill="url(#illo-core)"/>
      <ellipse cx="210" cy="210" rx="150" ry="78" stroke="#333333" stroke-width="1" opacity="0.7"/>
      <ellipse cx="210" cy="210" rx="110" ry="150" stroke="#2A2A2A" stroke-width="1" opacity="0.6" transform="rotate(28 210 210)"/>
      <ellipse cx="210" cy="210" rx="170" ry="100" stroke="#2A2A2A" stroke-width="1" opacity="0.5" transform="rotate(-24 210 210)"/>
      <circle cx="210" cy="210" r="30" fill="#141414" stroke="#E10600" stroke-width="1.6"/>
      <circle cx="210" cy="210" r="30" fill="none" stroke="#E10600" stroke-width="1.6">
        <animate attributeName="r" values="30;38;30" dur="3.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0;0.8" dur="3.4s" repeatCount="indefinite"/>
      </circle>
      <path d="M190 210 L164 210 M230 210 L256 210 M210 190 L210 164 M210 230 L210 256" stroke="#E10600" stroke-width="1.4"/>
      <g>
        <circle cx="360" cy="210" r="7" fill="#E10600"/>
        <circle cx="360" cy="210" r="12" fill="none" stroke="#E10600" stroke-width="1" opacity="0.5"/>
      </g>
      <g>
        <circle cx="86" cy="232" r="6" fill="#C0C0C0"/>
        <circle cx="86" cy="232" r="11" fill="none" stroke="#C0C0C0" stroke-width="1" opacity="0.4"/>
      </g>
      <g>
        <circle cx="282" cy="90" r="5.5" fill="#8A0A08"/>
      </g>
      <g>
        <circle cx="130" cy="110" r="5" fill="#C0C0C0"/>
      </g>
      <g>
        <circle cx="300" cy="330" r="5.5" fill="#E10600"/>
      </g>
      <g>
        <circle cx="120" cy="330" r="5" fill="#8A0A08"/>
      </g>
    </svg>`;
  }

  /* ============================== AUTH SCREEN ============================== */
  function renderAuth() {
    if (state.topoScene) { state.topoScene.destroy(); state.topoScene = null; }
    const root = qs("#app-root");
    root.innerHTML = `
      <div class="auth-screen">
        <canvas id="auth-canvas"></canvas>
        <div class="auth-grid-overlay"></div>
        ${authIllustration()}
        <div class="auth-card">
          <div class="auth-logo">
            <div class="auth-logo-mark">${I("route", { size: 20 })}</div>
            <div class="auth-logo-text">Route<span>X</span></div>
          </div>
          <div class="auth-eyebrow">Cross-chain execution intelligence</div>
          <h1>Welcome back</h1>
          <p class="lead">Sign in to evaluate, compare and execute the optimal cross-chain route for any transfer — in seconds.</p>
          <form id="auth-form">
            <div class="field">
              <label for="auth-email">Email</label>
              <div class="field-input">${I("mail", { size: 17 })}<input id="auth-email" type="email" placeholder="you@company.com" autocomplete="email" /></div>
            </div>
            <div class="field">
              <label for="auth-pass">Password</label>
              <div class="field-input">${I("lock", { size: 17 })}<input id="auth-pass" type="password" placeholder="••••••••••" autocomplete="current-password" /></div>
            </div>
            <div class="auth-actions">
              <button type="submit" class="btn btn-primary btn-full">${I("zap", { size: 16 })}Sign in</button>
            </div>
          </form>
          <div class="auth-divider">or</div>
          <button id="demo-btn" class="btn btn-outline btn-full">${I("play", { size: 15 })}Launch demo workspace</button>
          <div class="auth-meta">
            <span>${I("shield-check", { size: 13 })} SOC2-style demo environment</span>
          </div>
          <div class="auth-foot">Hackathon build for <b>Buildonomics</b> · No real funds are moved</div>
        </div>
      </div>`;
    state.authScene = window.RouteXBG.initAuthScene(qs("#auth-canvas"));
    qs("#auth-form").addEventListener("submit", (e) => { e.preventDefault(); login(); });
    qs("#demo-btn").addEventListener("click", () => login());
  }

  function login() {
    const card = qs(".auth-card");
    if (card) card.classList.add("page-fade-leave");
    localStorage.setItem("routex_session", JSON.stringify({ at: Date.now() }));
    state.session = { at: Date.now() };
    setTimeout(() => {
      if (state.authScene) { state.authScene.destroy(); state.authScene = null; }
      renderShell();
      navigate(location.hash.replace("#", "") || "command-center", true);
    }, 360);
  }

  function logout() {
    localStorage.removeItem("routex_session");
    state.session = null;
    if (state.topoScene) { state.topoScene.destroy(); state.topoScene = null; }
    location.hash = "";
    renderAuth();
  }

  /* ============================== APP SHELL ============================== */
  const NAV = [
    { group: "Overview", items: [{ id: "command-center", label: "Command Center", icon: "grid" }] },
    { group: "Operations", items: [
      { id: "execution", label: "Execution", icon: "route" },
      { id: "bridges", label: "Bridges", icon: "bridge" },
      { id: "analytics", label: "Analytics", icon: "bars" }
    ] },
    { group: "Platform", items: [
      { id: "intelligence", label: "Intelligence", icon: "brain" },
      { id: "security", label: "Security", icon: "shield" },
      { id: "network", label: "Network", icon: "network" }
    ] }
  ];
  const PAGE_META = {
    "command-center": ["Command Center", "Real-time overview of the RouteX execution network"],
    execution: ["Execution", "Define a transfer and get an explainable, intelligent route"],
    bridges: ["Bridges", "Compare cross-chain infrastructure providers"],
    analytics: ["Analytics", "Deeper insight into execution performance"],
    intelligence: ["Intelligence", "What the route-intelligence engine is seeing right now"],
    security: ["Security", "Audit status, risk scoring and incident history"],
    network: ["Network", "Live topology of every supported chain"]
  };

  function renderShell() {
    const root = qs("#app-root");
    const navHtml = NAV.map((g) => `
      <div class="nav-group-label">${g.group}</div>
      ${g.items.map((it) => `
        <a href="#${it.id}" class="nav-link" data-route="${it.id}">
          ${I(it.icon, { size: 18 })}<span>${it.label}</span>
          ${it.id === "security" ? "" : ""}
        </a>`).join("")}
    `).join("");

    root.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar" id="sidebar">
          <div class="brand">
            <div class="brand-mark">${I("route", { size: 18 })}</div>
            <div class="brand-text">Route<span>X</span></div>
          </div>
          <nav>${navHtml}</nav>
          <div class="sidebar-foot">
            <div class="status-chip">
              <span class="dot"></span>
              <div class="status-chip-text"><b>All systems nominal</b><span>7/8 networks healthy</span></div>
            </div>
          </div>
        </aside>
        <div class="nav-backdrop" id="nav-backdrop"></div>
        <div class="main-col">
          <header class="topbar">
            <div class="flex items-center gap-sm">
              <button class="icon-btn" id="nav-toggle" style="display:none">${I("menu", { size: 18 })}</button>
              <div class="page-heading"><h1 id="page-title"></h1><div class="sub" id="page-sub"></div></div>
            </div>
            <div class="flex items-center gap-sm">
              <div class="topbar-search">${I("search", { size: 15 })}<input placeholder="Search routes, tx, providers…" /></div>
              <button class="icon-btn" id="bell-btn">${I("bell", { size: 17 })}<span class="dot"></span></button>
              <button class="icon-btn" id="logout-btn" title="Sign out">${I("logout", { size: 17 })}</button>
              <div class="avatar">RX</div>
            </div>
          </header>
          <main class="content" id="content"></main>
        </div>
      </div>
      <div id="toast-stack"></div>`;

    qs("#logout-btn").addEventListener("click", logout);
    qs("#bell-btn").addEventListener("click", () => toast("You're all caught up — no new alerts.", "bell"));
    function setNavOpen(open) {
      qs("#sidebar").classList.toggle("open", open);
      qs("#nav-backdrop").classList.toggle("show", open);
    }
    qs("#nav-toggle").addEventListener("click", () => setNavOpen(!qs("#sidebar").classList.contains("open")));
    qs("#nav-backdrop").addEventListener("click", () => setNavOpen(false));
    qsa(".nav-link").forEach((a) => a.addEventListener("click", () => setNavOpen(false)));

    const mq = window.matchMedia("(max-width:860px)");
    function syncToggle() { qs("#nav-toggle").style.display = mq.matches ? "flex" : "none"; }
    mq.addEventListener("change", syncToggle); syncToggle();
  }

  /* ================================ ROUTER ================================ */
  function navigate(route, replace) {
    if (!PAGE_META[route]) route = "command-center";
    if (state.pageCleanup) { state.pageCleanup(); state.pageCleanup = null; }
    state.route = route;
    if (!replace) location.hash = route; else history.replaceState(null, "", "#" + route);

    qsa(".nav-link").forEach((a) => a.classList.toggle("active", a.dataset.route === route));
    qs("#page-title").textContent = PAGE_META[route][0];
    qs("#page-sub").textContent = PAGE_META[route][1];

    const content = qs("#content");
    content.classList.remove("view"); void content.offsetWidth; content.classList.add("view");

    const renderers = {
      "command-center": renderCommandCenter, execution: renderExecution, bridges: renderBridges,
      analytics: renderAnalytics, intelligence: renderIntelligence, security: renderSecurity, network: renderNetwork
    };
    renderers[route](content);
    enableReveal(content);
  }

  window.addEventListener("hashchange", () => {
    if (!state.session) return;
    navigate(location.hash.replace("#", ""));
  });

  /* ============================== COMMAND CENTER ============================== */
  function renderCommandCenter(root) {
    const vol = D.COMMAND_CENTER_VOLUME;
    const totalVol = vol.reduce((a, b) => a + b, 0);
    const activeNets = D.NETWORKS.filter((n) => n.status !== "unavailable").length;
    const avgLatency = D.ANALYTICS.latencyAvgS[D.ANALYTICS.latencyAvgS.length - 1];
    const successRate = D.ANALYTICS.successRate[D.ANALYTICS.successRate.length - 1];

    root.innerHTML = `
      <div class="hero-strip section reveal">
        <div class="hgrid"></div>
        <canvas class="hero-topo-canvas" id="hero-topo-canvas"></canvas>
        <div class="hero-strip-inner">
          <div>
            <div class="auth-eyebrow" style="margin-bottom:10px">${I("sparkles", { size: 13 })} RouteX Intelligence</div>
            <h2>One execution layer. Every chain. The best route, explained.</h2>
            <p>RouteX continuously scores ${D.PROVIDERS.length} bridge providers across ${D.NETWORKS.length} networks on cost, time, liquidity and reliability — then tells you exactly why a route won.</p>
            <div class="hero-badges">
              <span class="chip">${I("network", { size: 14 })} ${D.NETWORKS.length} networks monitored</span>
              <span class="chip">${I("bridge", { size: 14 })} ${D.PROVIDERS.length} providers compared</span>
              <span class="chip">${I("brain", { size: 14 })} Explainable scoring</span>
            </div>
          </div>
          <a href="#execution" class="btn btn-primary" style="flex:none">${I("route", { size: 16 })}Plan an execution</a>
        </div>
      </div>

      <div class="kpi-grid">
        ${kpiCard("layers", "Execution volume (24h)", "$" + totalVol.toFixed(1) + "M", "+12.4%", true, "kpi-vol", "spark-vol")}
        ${kpiCard("network", "Active networks", activeNets + " / " + D.NETWORKS.length, activeNets === D.NETWORKS.length ? "all healthy" : "1 unavailable", activeNets === D.NETWORKS.length, null, "spark-nets")}
        ${kpiCard("clock", "Avg execution latency", D.formatDuration(avgLatency), "-6.1%", true, "kpi-latency", "spark-latency")}
        ${kpiCard("check-circle", "Success rate", D.formatPct(successRate, 1), "+0.3%", true, "kpi-success", "spark-success")}
      </div>

      <div class="grid-2 section">
        <div class="card reveal card-glow">
          <div class="section-head"><div><h2>Execution performance</h2><div class="sub">Volume routed, last 24 hours</div></div><span class="pill pill-good"><span class="dot"></span>Live</span></div>
          <div class="chart-wrap" id="cc-chart"></div>
        </div>
        <div class="card reveal">
          <div class="section-head"><div><h2>Network health</h2><div class="sub">Operational status right now</div></div></div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${D.NETWORKS.map((n) => `
              <div class="net-card" style="background:var(--surface-2);border-radius:12px;">
                <div class="nic" style="background:${n.color}">${n.glyph}</div>
                <div class="ninfo">
                  <div class="nm">${n.name}</div>
                  <div class="meta">${n.congestion}% congestion · ${n.latencyMs}ms</div>
                </div>
                ${statusPill(n.status)}
              </div>`).join("")}
          </div>
        </div>
      </div>

      <div class="section card reveal">
        <div class="section-head"><div><h2>Recent executions</h2><div class="sub">Latest cross-chain transfers processed by RouteX</div></div><a href="#analytics" class="btn btn-ghost btn-sm">${I("bars", { size: 14 })}View analytics</a></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tx</th><th>Route</th><th>Asset</th><th>Provider</th><th>Cost</th><th>Latency</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              ${D.RECENT_EXECUTIONS.map((r) => `
                <tr>
                  <td class="mono">${D.short(r.id)}</td>
                  <td>${netChip(r.source)} <span style="color:var(--text-tertiary)">→</span> ${netChip(r.destination)}</td>
                  <td class="mono">${r.amount.toLocaleString()} ${r.asset.symbol}</td>
                  <td>${providerChip(r.provider)}</td>
                  <td class="mono">$${r.cost.toFixed(2)}</td>
                  <td class="mono">${r.latency}s</td>
                  <td>${execStatusPill(r.status)}</td>
                  <td style="color:var(--text-tertiary)">${relTime(r.minsAgo)}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`;

    C.lineAreaChart(qs("#cc-chart"), {
      values: vol, labels: vol.map((_, i) => `H-${23 - i}`), height: 230,
      color: "var(--accent)", formatY: (v) => "$" + v.toFixed(2) + "M"
    });
    C.countUp(qs("#kpi-vol"), totalVol, { format: (v) => "$" + v.toFixed(1) + "M" });
    C.countUp(qs("#kpi-latency"), avgLatency, { format: (v) => D.formatDuration(v) });
    C.countUp(qs("#kpi-success"), successRate, { format: (v) => D.formatPct(v, 1) });
    C.sparkline(qs("#spark-vol"), { values: D.miniTrend("spark-vol", 16, totalVol, totalVol * 0.22) });
    C.sparkline(qs("#spark-nets"), { values: D.miniTrend("spark-nets", 16, activeNets, 0.6) });
    C.sparkline(qs("#spark-latency"), { values: D.miniTrend("spark-latency", 16, avgLatency, avgLatency * 0.2) });
    C.sparkline(qs("#spark-success"), { values: D.miniTrend("spark-success", 16, successRate, 1.2) });

    const heroCanvas = qs("#hero-topo-canvas");
    if (heroCanvas && window.RouteXBG) {
      state.heroScene = window.RouteXBG.initHeroScene(heroCanvas, D.NETWORKS, buildNetworkEdges().slice(0, 14));
    }
    state.pageCleanup = () => { if (state.heroScene) { state.heroScene.destroy(); state.heroScene = null; } };
  }

  function kpiCard(icon, label, value, delta, up, id, sparkId) {
    return `
      <div class="card kpi-card reveal">
        <div class="kpi-top"><div class="kpi-icon">${I(icon, { size: 18 })}</div></div>
        <div class="kpi-label">${label}</div>
        <div class="kpi-value"${id ? ` id="${id}"` : ""}>${value}</div>
        <div class="kpi-foot">
          <span class="kpi-delta ${up ? "up" : "down"}">${I(up ? "arrow-up-right" : "arrow-down-right", { size: 12 })}${delta}</span>
          ${sparkId ? `<div class="kpi-spark" id="${sparkId}"></div>` : ""}
        </div>
      </div>`;
  }
  function execStatusPill(status) {
    const map = { Completed: ["pill-good", "check-circle"], Processing: ["pill-info", "clock"], Failed: ["pill-critical", "x-circle"] };
    const [cls, ic] = map[status] || map.Completed;
    return `<span class="pill ${cls}">${I(ic, { size: 11 })}${status}</span>`;
  }

  /* ============================== EXECUTION ============================== */
  function renderExecution(root) {
    const netOpts = (sel) => D.NETWORKS.map((n) => `<option value="${n.id}" ${n.id === sel ? "selected" : ""}>${n.name}</option>`).join("");
    const assetOpts = (sel) => D.ASSETS.map((a) => `<option value="${a.id}" ${a.id === sel ? "selected" : ""}>${a.symbol}</option>`).join("");

    root.innerHTML = `
      <div class="exec-layout">
        <div class="card reveal">
          <div class="section-head"><h2>New execution</h2></div>
          <div class="field">
            <label>Amount &amp; asset</label>
            <div class="amount-field">
              <input id="f-amount" type="number" min="0" step="any" value="${state.exec.amount}" />
              <select id="f-asset">${assetOpts(state.exec.asset)}</select>
            </div>
          </div>
          <div class="field">
            <label>Source network</label>
            <div class="select-field"><select id="f-source">${netOpts(state.exec.source)}</select>${I("chevron-down", { size: 15 })}</div>
          </div>
          <div class="swap-row">
            <div style="flex:1;height:1px;background:var(--border)"></div>
            <button class="swap-btn" id="f-swap" type="button" title="Swap">${I("arrow-up-right", { size: 15 })}</button>
            <div style="flex:1;height:1px;background:var(--border)"></div>
          </div>
          <div class="field">
            <label>Destination network</label>
            <div class="select-field"><select id="f-dest">${netOpts(state.exec.destination)}</select>${I("chevron-down", { size: 15 })}</div>
          </div>
          <div class="field">
            <label>Execution policy</label>
            <div class="policy-grid">
              ${D.POLICIES.map((p) => `
                <div class="policy-opt ${p.id === state.exec.policy ? "active" : ""}" data-policy="${p.id}">
                  <div class="pname">${I(POLICY_ICON[p.id], { size: 14 })}${p.label}</div>
                  <div class="pdesc">${p.description}</div>
                </div>`).join("")}
            </div>
          </div>
          <button class="btn btn-primary btn-full" id="f-submit" style="margin-top:18px">${I("zap", { size: 16 })}Find best route</button>
        </div>

        <div id="exec-results"></div>
      </div>`;

    function readForm() {
      state.exec.amount = Math.max(0, Number(qs("#f-amount").value) || 0);
      state.exec.asset = qs("#f-asset").value;
      state.exec.source = qs("#f-source").value;
      state.exec.destination = qs("#f-dest").value;
    }
    qsa(".policy-opt", root).forEach((el) => el.addEventListener("click", () => {
      state.exec.policy = el.dataset.policy;
      qsa(".policy-opt", root).forEach((o) => o.classList.toggle("active", o === el));
    }));
    qs("#f-swap").addEventListener("click", () => {
      const s = qs("#f-source").value, d = qs("#f-dest").value;
      qs("#f-source").value = d; qs("#f-dest").value = s;
    });
    qs("#f-submit").addEventListener("click", () => {
      readForm();
      if (state.exec.source === state.exec.destination) { toast("Source and destination must differ", "alert-triangle"); return; }
      runEvaluation(true);
    });

    runEvaluation(false);
  }

  function runEvaluation(withLoading) {
    const results = qs("#exec-results");
    if (!results) return;
    if (withLoading) {
      results.innerHTML = `<div class="card" style="min-height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;">
        <div class="boot-mark"><svg viewBox="0 0 56 56"><circle class="boot-ring" cx="28" cy="28" r="22"/><circle class="boot-arc" cx="28" cy="28" r="22"/></svg></div>
        <div class="boot-label" style="color:var(--text-tertiary)">Scanning ${window.RouteXData.PROVIDERS.length} providers…</div>
      </div>`;
    }
    const render = () => {
      const ev = D.evaluateRoutes(state.exec);
      results.innerHTML = buildResultsHtml(ev);
      bindResultsEvents(ev, results);
      enableReveal(results);
    };
    if (withLoading) setTimeout(render, 650); else render();
  }

  function buildResultsHtml(ev) {
    if (!ev.recommended) {
      return `<div class="card"><div class="empty-state"><div class="eic">${I("alert-triangle", { size: 24 })}</div><h4>No route available</h4><p>No provider currently supports this network pair. Try a different source or destination.</p></div></div>`;
    }
    const rec = ev.recommended;
    const mid = rec.midNetwork;
    return `
      <div class="card reveal card-glow" style="margin-bottom:16px">
        <div class="section-head"><h2>Route preview</h2></div>
        <div class="route-visual">
          <div class="route-node"><div class="nic" style="background:${ev.source.color}">${ev.source.glyph}</div><span>${ev.source.name}</span></div>
          <div class="route-path">${mid ? `<div class="route-mid-tag">via ${mid.name}</div>` : ""}<div class="flow-dot"></div></div>
          ${mid ? `<div class="route-node"><div class="nic" style="background:${mid.color}">${mid.glyph}</div><span>${mid.name}</span></div><div class="route-path"><div class="flow-dot" style="animation-delay:1.1s"></div></div>` : ""}
          <div class="route-node"><div class="nic" style="background:${ev.destination.color}">${ev.destination.glyph}</div><span>${ev.destination.name}</span></div>
        </div>
      </div>

      <div class="reco-card reveal">
        <div class="reco-top">
          <span class="reco-badge">${I("sparkles", { size: 12 })}Recommended route</span>
          ${providerChip(rec.provider)}
        </div>
        <div class="flex items-center gap-lg" style="flex-wrap:wrap">
          <div id="reco-gauge" style="flex:none"></div>
          <div class="reco-metrics" style="flex:1;min-width:220px;margin:0">
            <div class="reco-metric"><div class="m-label">Amount</div><div class="m-value mono">${ev.amount.toLocaleString()} ${ev.asset.symbol}</div></div>
            <div class="reco-metric"><div class="m-label">Est. cost</div><div class="m-value mono">${D.formatUSD(rec.costUSD)}</div></div>
            <div class="reco-metric"><div class="m-label">Est. time</div><div class="m-value mono">${D.formatDuration(rec.timeS)}</div></div>
            <div class="reco-metric"><div class="m-label">Reliability</div><div class="m-value mono">${D.formatPct(rec.reliability, 1)}</div></div>
          </div>
        </div>
        <div class="reco-why" style="margin-top:18px">
          ${I("info", { size: 16 })}
          <p><b>Why this route?</b><br/>${ev.reason}</p>
        </div>
      </div>

      ${ev.alternatives.length ? `
      <div class="card section" style="margin-top:16px">
        <div class="section-head"><div><h2>Evaluated route options</h2><div class="sub">Other paths RouteX scored for this transfer</div></div></div>
        ${ev.alternatives.map((alt, i) => `
          <div class="alt-route">
            <div class="alt-rank">#${i + 2}</div>
            <div class="alt-info">
              <div class="nm">${alt.provider.name} ${alt.hop === "multi" ? "<span style=\"color:var(--text-tertiary);font-weight:600\">· multi-hop</span>" : ""}</div>
              <div class="vi">${alt.viaLabel}</div>
            </div>
            <div class="alt-stats">
              <div><div class="v">${D.formatUSD(alt.costUSD)}</div><div class="l">Cost</div></div>
              <div><div class="v">${D.formatDuration(alt.timeS)}</div><div class="l">Time</div></div>
              <div><div class="v">${D.formatPct(alt.reliability, 0)}</div><div class="l">Reliable</div></div>
            </div>
          </div>`).join("")}
      </div>` : ""}
      <div style="margin-top:14px"><button class="btn btn-primary btn-full" id="confirm-exec">${I("check", { size: 16 })}Confirm execution</button></div>`;
  }

  function bindResultsEvents(ev, root) {
    const btn = qs("#confirm-exec", root);
    if (btn) btn.addEventListener("click", () => {
      toast(`Route confirmed: ${ev.recommended.provider.name} · ${ev.source.name} → ${ev.destination.name}`, "check-circle");
    });
    const gaugeHolder = qs("#reco-gauge", root);
    if (gaugeHolder && ev.recommended) {
      C.gaugeChart(gaugeHolder, {
        value: ev.recommended.reliability, max: 100, size: 112, thickness: 9,
        color: "var(--accent)", label: "reliability"
      });
    }
  }

  /* ============================== BRIDGES ============================== */
  function renderBridges(root) {
    const totalVolume = D.PROVIDERS.reduce((s, p) => s + p.volume24hM, 0);
    const totalRoutes = D.PROVIDERS.reduce((s, p) => s + p.networks.length, 0);
    const avgCost = D.PROVIDERS.reduce((s, p) => s + p.baseFeeBps, 0) / D.PROVIDERS.length;
    const avgReliability = D.PROVIDERS.reduce((s, p) => s + p.reliabilityBase, 0) / D.PROVIDERS.length;
    const maxVol = Math.max(...D.PROVIDERS.map((p) => p.volume24hM));

    root.innerHTML = `
      <div class="kpi-grid">
        ${kpiCard("bridge", "Bridge volume (24h)", "$" + totalVolume.toFixed(0) + "M", "+8.2%", true, "kpi-bvol")}
        ${kpiCard("route", "Active routes", totalRoutes, "+2 this week", true, "kpi-routes")}
        ${kpiCard("dollar", "Avg. fee", avgCost.toFixed(1) + " bps", "-0.4bps", true, "kpi-fee")}
        ${kpiCard("shield-check", "Avg. reliability", D.formatPct(avgReliability, 1), "+0.2%", true, "kpi-rel")}
      </div>

      <div class="grid-2 section">
        <div class="card reveal">
          <div class="section-head"><h2>Bridge utilization</h2><div class="sub">Share of 24h cross-chain volume</div></div>
          ${D.PROVIDERS.map((p) => `
            <div class="bar-row">
              <div class="bar-label"><span class="chip-dot" style="background:${PROVIDER_COLOR[p.id]};width:16px;height:16px;color:#fff">${PM(p.id, { size: 9.5, strokeWidth: 2.2 })}</span>${p.name}</div>
              <div class="bar-track"><div class="bar-fill" data-w="${((p.volume24hM / maxVol) * 100).toFixed(0)}"></div></div>
              <div class="bar-val">$${p.volume24hM}M</div>
            </div>`).join("")}
        </div>
        <div class="card reveal">
          <div class="section-head"><h2>Provider share</h2><div class="sub">Of total routed volume</div></div>
          <div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap">
            <div id="bridge-donut"></div>
            <div class="chart-legend" style="flex-direction:column">
              ${D.PROVIDERS.map((p) => `<div class="legend-item"><span class="legend-swatch" style="background:${PROVIDER_COLOR[p.id]}"></span>${p.name} · ${((p.volume24hM / totalVolume) * 100).toFixed(1)}%</div>`).join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="card section reveal">
        <div class="section-head"><div><h2>Provider comparison</h2><div class="sub">Speed, cost-efficiency, reliability and liquidity, normalized</div></div></div>
        <div id="provider-radar" style="display:flex;justify-content:center"></div>
      </div>

      <div class="section grid-auto">
        ${D.PROVIDERS.map((p) => `
          <div class="card reveal">
            <div class="flex items-center gap-sm" style="margin-bottom:10px">
              <span class="chip-dot" style="background:${PROVIDER_COLOR[p.id]};width:34px;height:34px;border-radius:10px;color:#fff">${PM(p.id, { size: 17, strokeWidth: 1.9 })}</span>
              <div><div style="font-weight:700;font-size:14.5px">${p.name}</div><div style="font-size:11.5px;color:var(--text-tertiary)">${p.model}</div></div>
            </div>
            <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:12px">${p.blurb}</p>
            <div class="flex gap-xs" style="flex-wrap:wrap">${p.auditors.map((a) => `<span class="chip">${I("shield-check", { size: 12 })}${a}</span>`).join("")}</div>
          </div>`).join("")}
      </div>

      <div class="card section reveal">
        <div class="section-head"><h2>Provider performance</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Provider</th><th>Model</th><th>24h volume</th><th>Avg time</th><th>Avg fee</th><th>Reliability</th><th>Risk score</th></tr></thead>
            <tbody>
              ${D.PROVIDERS.map((p) => `
                <tr>
                  <td>${providerChip(p)}</td>
                  <td style="color:var(--text-tertiary)">${p.model}</td>
                  <td class="mono">$${p.volume24hM}M</td>
                  <td class="mono">${D.formatDuration(p.baseTimeS)}</td>
                  <td class="mono">${p.baseFeeBps} bps</td>
                  <td class="mono">${D.formatPct(p.reliabilityBase, 1)}</td>
                  <td>${p.riskScore >= 88 ? statusPill("healthy") : p.riskScore >= 82 ? `<span class="pill pill-info"><span class="dot"></span>${p.riskScore}/100</span>` : statusPill("degraded")}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`;

    C.animateBars(root);
    C.countUp(qs("#kpi-bvol"), totalVolume, { format: (v) => "$" + v.toFixed(0) + "M" });
    C.countUp(qs("#kpi-routes"), totalRoutes, { format: (v) => Math.round(v) });
    C.countUp(qs("#kpi-fee"), avgCost, { format: (v) => v.toFixed(1) + " bps" });
    C.countUp(qs("#kpi-rel"), avgReliability, { format: (v) => D.formatPct(v, 1) });
    C.donutChart(qs("#bridge-donut"), {
      size: 168, thickness: 22,
      segments: D.PROVIDERS.map((p) => ({ value: p.volume24hM, color: PROVIDER_COLOR[p.id] })),
      centerBig: "$" + totalVolume.toFixed(0) + "M", centerLabel: "total volume"
    });

    const maxTime = Math.max(...D.PROVIDERS.map((p) => p.baseTimeS));
    const minTime = Math.min(...D.PROVIDERS.map((p) => p.baseTimeS));
    const maxFee = Math.max(...D.PROVIDERS.map((p) => p.baseFeeBps));
    const minFee = Math.min(...D.PROVIDERS.map((p) => p.baseFeeBps));
    const maxTvl = Math.max(...D.PROVIDERS.map((p) => p.tvlM));
    C.radarChart(qs("#provider-radar"), {
      size: 300,
      axes: ["Speed", "Cost-efficiency", "Reliability", "Liquidity"],
      series: D.PROVIDERS.map((p) => ({
        name: p.name,
        color: PROVIDER_COLOR[p.id],
        values: [
          1 - (p.baseTimeS - minTime) / Math.max(1, maxTime - minTime) * 0.85,
          1 - (p.baseFeeBps - minFee) / Math.max(1, maxFee - minFee) * 0.85,
          p.reliabilityBase / 100,
          p.tvlM / maxTvl
        ]
      }))
    });
  }

  /* ============================== ANALYTICS ============================== */
  function renderAnalytics(root) {
    const a = D.ANALYTICS;
    const lastSuccess = a.successRate[a.successRate.length - 1];
    const failRate = +(100 - lastSuccess).toFixed(2);

    root.innerHTML = `
      <div class="kpi-grid">
        ${kpiCard("activity", "Executions (24h)", D.formatCompact(a.executionsCount[a.executionsCount.length - 1]), "+4.8%", true, "kpi-execs")}
        ${kpiCard("dollar", "Avg. cost / execution", "$" + a.costAvgUSD[a.costAvgUSD.length - 1].toFixed(2), "-2.1%", true, "kpi-acost")}
        ${kpiCard("clock", "Avg. latency", D.formatDuration(a.latencyAvgS[a.latencyAvgS.length - 1]), "-5.4%", true, "kpi-alat")}
        ${kpiCard("check-circle", "Success rate", D.formatPct(lastSuccess), "+0.2%", true, "kpi-asuc")}
      </div>
      <div class="grid-2 section">
        <div class="card reveal">
          <div class="section-head"><h2>Execution volume trend</h2><div class="sub">Last 14 days</div></div>
          <div class="chart-wrap" id="an-volume"></div>
        </div>
        <div class="card reveal">
          <div class="section-head"><h2>Success vs. failed</h2><div class="sub">Current 24h window</div></div>
          <div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap">
            <div id="an-donut"></div>
            <div class="chart-legend" style="flex-direction:column">
              <div class="legend-item"><span class="legend-swatch" style="background:var(--good)"></span>Success · ${D.formatPct(lastSuccess)}</div>
              <div class="legend-item"><span class="legend-swatch" style="background:var(--critical)"></span>Failed · ${D.formatPct(failRate)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="grid-2 section">
        <div class="card reveal">
          <div class="section-head"><h2>Cost trend</h2><div class="sub">Average cost per execution, USD</div></div>
          <div class="chart-wrap" id="an-cost"></div>
          <div class="stat-row">
            <div class="stat"><div class="s-lbl">Min</div><div class="s-val">$${Math.min(...a.costAvgUSD).toFixed(2)}</div></div>
            <div class="stat"><div class="s-lbl">Avg</div><div class="s-val">$${(a.costAvgUSD.reduce((s, v) => s + v, 0) / a.costAvgUSD.length).toFixed(2)}</div></div>
            <div class="stat"><div class="s-lbl">Max</div><div class="s-val">$${Math.max(...a.costAvgUSD).toFixed(2)}</div></div>
          </div>
        </div>
        <div class="card reveal">
          <div class="section-head"><h2>Latency trend</h2><div class="sub">Average time to finality, seconds</div></div>
          <div class="chart-wrap" id="an-latency"></div>
          <div class="stat-row">
            <div class="stat"><div class="s-lbl">Min</div><div class="s-val">${D.formatDuration(Math.min(...a.latencyAvgS))}</div></div>
            <div class="stat"><div class="s-lbl">Avg</div><div class="s-val">${D.formatDuration(a.latencyAvgS.reduce((s, v) => s + v, 0) / a.latencyAvgS.length)}</div></div>
            <div class="stat flag"><div class="s-lbl">Max</div><div class="s-val">${D.formatDuration(Math.max(...a.latencyAvgS))}</div></div>
          </div>
        </div>
      </div>`;

    C.countUp(qs("#kpi-execs"), a.executionsCount[a.executionsCount.length - 1], { format: (v) => D.formatCompact(v) });
    C.countUp(qs("#kpi-acost"), a.costAvgUSD[a.costAvgUSD.length - 1], { format: (v) => "$" + v.toFixed(2) });
    C.countUp(qs("#kpi-alat"), a.latencyAvgS[a.latencyAvgS.length - 1], { format: (v) => D.formatDuration(v) });
    C.countUp(qs("#kpi-asuc"), lastSuccess, { format: (v) => D.formatPct(v) });
    C.lineAreaChart(qs("#an-volume"), { values: a.volumeM, labels: a.labels, height: 210, color: "var(--accent)", formatY: (v) => "$" + v.toFixed(1) + "M" });
    C.lineAreaChart(qs("#an-cost"), { values: a.costAvgUSD, labels: a.labels, height: 190, color: "var(--info)", formatY: (v) => "$" + v.toFixed(2) });
    C.lineAreaChart(qs("#an-latency"), { values: a.latencyAvgS, labels: a.labels, height: 190, color: "var(--warning)", formatY: (v) => Math.round(v) + "s" });
    C.donutChart(qs("#an-donut"), { size: 168, thickness: 22, segments: [{ value: lastSuccess, color: "var(--good)" }, { value: failRate, color: "var(--critical)" }], centerBig: D.formatPct(lastSuccess, 1), centerLabel: "success" });
  }

  /* ============================== INTELLIGENCE ============================== */
  function renderIntelligence(root) {
    root.innerHTML = `
      <div class="hero-strip section reveal">
        <div class="hgrid"></div>
        <div class="hero-strip-inner">
          <div>
            <div class="auth-eyebrow" style="margin-bottom:10px">${I("brain", { size: 13 })} Route intelligence engine</div>
            <h2>Continuously re-scoring every route as conditions change</h2>
            <p>RouteX re-evaluates cost, latency, liquidity and reliability signals across all providers on every block range — surfacing what changed and why, before you execute.</p>
          </div>
        </div>
      </div>
      <div class="kpi-grid">
        ${kpiCard("check-circle", "Prediction accuracy", "96.8%", "+0.4%", true, "kpi-acc")}
        ${kpiCard("cpu", "Signals monitored", "214", "live", true, "kpi-sig")}
        ${kpiCard("sparkles", "Avg. model confidence", "91.2%", "+1.1%", true, "kpi-conf")}
        ${kpiCard("activity", "Insights generated today", D.INSIGHTS.length * 9, "+6", true, "kpi-ins")}
      </div>
      <div class="card section reveal">
        <div class="section-head"><div><h2>Model confidence by signal</h2><div class="sub">How sure the engine is about each scoring dimension right now</div></div></div>
        <div style="display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px;padding-top:4px">
          <div id="gauge-cost" style="display:flex;flex-direction:column;align-items:center;gap:8px"></div>
          <div id="gauge-latency" style="display:flex;flex-direction:column;align-items:center;gap:8px"></div>
          <div id="gauge-liquidity" style="display:flex;flex-direction:column;align-items:center;gap:8px"></div>
          <div id="gauge-reliability" style="display:flex;flex-direction:column;align-items:center;gap:8px"></div>
        </div>
      </div>
      <div class="card section reveal">
        <div class="section-head"><h2>Live insight stream</h2><div class="sub">What the engine has flagged recently</div></div>
        <div>
          ${D.INSIGHTS.map((ins) => `
            <div class="insight-card">
              <div class="insight-ic ${ins.type}">${I(ins.type === "optimization" ? "trending-up" : ins.type === "anomaly" ? "alert-triangle" : "clock", { size: 17 })}</div>
              <div class="insight-body">
                <div class="insight-top"><h4>${ins.title}</h4><time>${relTime(ins.minsAgo)}</time></div>
                <p>${ins.body}</p>
              </div>
            </div>`).join("")}
        </div>
      </div>`;
    C.countUp(qs("#kpi-acc"), 96.8, { format: (v) => v.toFixed(1) + "%" });
    C.countUp(qs("#kpi-sig"), 214, { format: (v) => Math.round(v) });
    C.countUp(qs("#kpi-conf"), 91.2, { format: (v) => v.toFixed(1) + "%" });
    C.countUp(qs("#kpi-ins"), D.INSIGHTS.length * 9, { format: (v) => Math.round(v) });
    const gauges = [
      { id: "gauge-cost", value: 94, color: "var(--info)", label: "Cost model" },
      { id: "gauge-latency", value: 89, color: "var(--accent)", label: "Latency model" },
      { id: "gauge-liquidity", value: 92, color: "var(--warning)", label: "Liquidity model" },
      { id: "gauge-reliability", value: 97, color: "var(--good)", label: "Reliability model" }
    ];
    gauges.forEach((g) => {
      const holder = document.createElement("div");
      qs("#" + g.id).appendChild(holder);
      C.gaugeChart(holder, { value: g.value, max: 100, size: 128, thickness: 9, color: g.color });
      const lbl = document.createElement("div");
      lbl.style.cssText = "font-size:12.5px;font-weight:600;color:var(--text-secondary)";
      lbl.textContent = g.label;
      qs("#" + g.id).appendChild(lbl);
    });
  }

  /* ============================== SECURITY ============================== */
  function renderSecurity(root) {
    root.innerHTML = `
      <div class="audit-grid section">
        ${D.SECURITY_ROWS.map((row) => `
          <div class="card audit-card reveal">
            <div class="ahead">
              ${providerChip(row.provider)}
              <span class="pill pill-good"><span class="dot"></span>${row.riskScore}/100</span>
            </div>
            <div class="risk-meter"><div class="risk-fill" style="width:${row.riskScore}%"></div></div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:14px">Risk score</div>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:12.5px">
              <div class="flex justify-between"><span style="color:var(--text-tertiary)">Auditors</span><span style="font-weight:600">${row.auditors.join(", ")}</span></div>
              <div class="flex justify-between"><span style="color:var(--text-tertiary)">Last audit</span><span style="font-weight:600">${row.lastAudit}</span></div>
              <div class="flex justify-between"><span style="color:var(--text-tertiary)">Insurance coverage</span><span style="font-weight:600">$${row.insuranceM}M</span></div>
              <div class="flex justify-between"><span style="color:var(--text-tertiary)">Bug bounty cap</span><span style="font-weight:600">$${row.bugBountyM}M</span></div>
            </div>
          </div>`).join("")}
      </div>
      <div class="card reveal">
        <div class="section-head"><h2>Incident log</h2><div class="sub">Last 90 days across all providers</div></div>
        <div class="empty-state">
          ${shieldAllClearIllo()}
          <h4>No active incidents</h4>
          <p>All monitored providers are operating within normal security parameters. RouteX will surface anything here the moment it's detected.</p>
        </div>
      </div>`;
  }

  /* Radar-sweep shield illustration for the "all clear" security empty-state. */
  function shieldAllClearIllo() {
    return `
    <svg class="illo" viewBox="0 0 160 120" fill="none" aria-hidden="true">
      <defs><clipPath id="radar-clip"><circle cx="80" cy="58" r="40"/></clipPath></defs>
      <circle cx="80" cy="58" r="40" stroke="var(--border-strong)" stroke-width="1"/>
      <circle cx="80" cy="58" r="26" stroke="var(--border-strong)" stroke-width="1"/>
      <g clip-path="url(#radar-clip)">
        <path d="M80 58 L80 8 A50 50 0 0 1 108 24 Z" fill="var(--accent-soft)" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 80 58" to="360 80 58" dur="4s" repeatCount="indefinite"/>
        </path>
      </g>
      <path d="M80 30 92 35.5V48c0 11-5.4 17.7-12 21.4C73.4 65.7 68 59 68 48V35.5Z" fill="var(--surface)" stroke="var(--accent-strong)" stroke-width="2"/>
      <path d="M74.5 48.5 78.5 52.5 86 44.5" stroke="var(--good)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  /* ============================== NETWORK ============================== */
  function renderNetwork(root) {
    root.innerHTML = `
      <div class="section">
        <div class="topo-wrap">
          <canvas id="topo-canvas"></canvas>
          <div id="topo-labels" style="position:absolute;inset:0;pointer-events:none"></div>
          <div class="topo-hint">${I("info", { size: 13 })}Drag to rotate · auto-rotates when idle</div>
          <div class="topo-legend">
            <div class="legend-item"><span class="legend-swatch" style="background:#34D399"></span>Healthy</div>
            <div class="legend-item"><span class="legend-swatch" style="background:#FBBF24"></span>Degraded</div>
            <div class="legend-item"><span class="legend-swatch" style="background:#FB7185"></span>Unavailable</div>
          </div>
        </div>
      </div>
      <div class="card section reveal">
        <div class="section-head"><h2>Chain details</h2><div class="sub">Live operational metrics per network</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Network</th><th>Type</th><th>Status</th><th>Block time</th><th>Gas</th><th>Congestion</th><th>Uptime (30d)</th></tr></thead>
            <tbody>
              ${D.NETWORKS.map((n) => `
                <tr>
                  <td>${netChip(n)}</td>
                  <td style="color:var(--text-tertiary)">${n.kind}</td>
                  <td>${statusPill(n.status)}</td>
                  <td class="mono">${n.blockTime}s</td>
                  <td class="mono">${n.gasGwei} gwei</td>
                  <td class="mono">${n.congestion}%</td>
                  <td class="mono">${n.uptime}%</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`;

    const labelLayer = qs("#topo-labels");
    D.NETWORKS.forEach((n) => {
      const span = document.createElement("div");
      span.dataset.net = n.id;
      span.style.cssText = "position:absolute;left:0;top:0;white-space:nowrap;font-size:11px;font-weight:700;display:flex;align-items:center;gap:5px;color:var(--text);background:var(--surface);border:1px solid var(--border);padding:3px 8px;border-radius:7px;transition:opacity .2s;";
      span.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:${n.color}"></span>${n.name}`;
      labelLayer.appendChild(span);
    });

    const edges = buildNetworkEdges();

    state.topoScene = window.RouteXBG.initTopoScene(qs("#topo-canvas"), labelLayer, D.NETWORKS, edges.slice(0, 18));
    state.pageCleanup = () => { if (state.topoScene) { state.topoScene.destroy(); state.topoScene = null; } };
  }

  /* ================================ INIT ================================ */
  function init() {
    setTimeout(() => qs("#boot-loader").classList.add("hidden"), 650);
    if (state.session) {
      renderShell();
      navigate(location.hash.replace("#", "") || "command-center", true);
    } else {
      renderAuth();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
