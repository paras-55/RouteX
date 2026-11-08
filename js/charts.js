/* ==========================================================================
   RouteX — zero-dependency SVG chart + number-counter helpers
   ========================================================================== */
(function (global) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* Catmull-Rom -> smooth cubic bezier path through points */
  function smoothPath(points) {
    if (points.length < 2) return "";
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  /**
   * lineAreaChart(container, {labels, values, height, color, formatY, formatX, fillId, unit})
   */
  function lineAreaChart(container, opts) {
    container.innerHTML = "";
    const W = 560, H = opts.height || 220;
    const padL = 6, padR = 6, padT = 16, padB = 26;
    const values = opts.values;
    const n = values.length;
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const x = (i) => padL + (i / (n - 1)) * (W - padL - padR);
    const y = (v) => padT + (1 - (v - min) / range) * (H - padT - padB);

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", class: "chart-svg" });
    svg.style.height = H + "px";

    const defs = el("defs");
    const gradId = "grad-" + Math.random().toString(36).slice(2, 9);
    const grad = el("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(el("stop", { offset: "0%", "stop-color": opts.color || "var(--accent)", "stop-opacity": "0.38" }));
    grad.appendChild(el("stop", { offset: "100%", "stop-color": opts.color || "var(--accent)", "stop-opacity": "0" }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    // grid
    const gridG = el("g", { class: "chart-grid" });
    for (let i = 0; i <= 3; i++) {
      const gy = padT + (i / 3) * (H - padT - padB);
      gridG.appendChild(el("line", { x1: padL, x2: W - padR, y1: gy, y2: gy }));
    }
    svg.appendChild(gridG);

    const pts = values.map((v, i) => [x(i), y(v)]);
    const linePath = smoothPath(pts);
    const areaPath = `${linePath} L ${x(n - 1)},${H - padB} L ${x(0)},${H - padB} Z`;

    const area = el("path", { d: areaPath, fill: `url(#${gradId})`, stroke: "none" });
    svg.appendChild(area);

    const line = el("path", { d: linePath, class: "line-path", stroke: opts.color || "var(--accent)" });
    const len = 2000;
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    svg.appendChild(line);
    requestAnimationFrame(() => {
      line.style.transition = "stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)";
      line.style.strokeDashoffset = "0";
    });

    const dotColor = opts.color || "var(--accent)";
    const endDot = el("circle", { cx: pts[n - 1][0], cy: pts[n - 1][1], r: 4, class: "chart-dot", stroke: dotColor });
    svg.appendChild(endDot);

    const hoverLine = el("line", { x1: 0, x2: 0, y1: padT, y2: H - padB, stroke: "var(--border-strong)", "stroke-width": 1, opacity: 0 });
    svg.appendChild(hoverLine);
    const hoverDot = el("circle", { r: 4.5, class: "chart-dot", stroke: dotColor, opacity: 0 });
    svg.appendChild(hoverDot);

    const capture = el("rect", { x: 0, y: 0, width: W, height: H, fill: "transparent" });
    svg.appendChild(capture);

    container.appendChild(svg);
    const tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    container.appendChild(tooltip);

    capture.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * W;
      let idx = Math.round(((relX - padL) / (W - padL - padR)) * (n - 1));
      idx = Math.max(0, Math.min(n - 1, idx));
      const px = x(idx), py = y(values[idx]);
      hoverLine.setAttribute("x1", px); hoverLine.setAttribute("x2", px); hoverLine.setAttribute("opacity", 1);
      hoverDot.setAttribute("cx", px); hoverDot.setAttribute("cy", py); hoverDot.setAttribute("opacity", 1);
      const label = opts.labels ? opts.labels[idx] : idx;
      const valStr = opts.formatY ? opts.formatY(values[idx]) : values[idx];
      tooltip.textContent = `${label} · ${valStr}`;
      tooltip.style.left = (px / W) * 100 + "%";
      tooltip.style.top = (py / H) * 100 + "%";
      tooltip.style.opacity = 1;
    });
    capture.addEventListener("mouseleave", () => {
      hoverLine.setAttribute("opacity", 0);
      hoverDot.setAttribute("opacity", 0);
      tooltip.style.opacity = 0;
    });
  }

  /**
   * donutChart(container, {segments:[{label,value,color}], size, thickness, centerBig, centerLabel})
   */
  function donutChart(container, opts) {
    container.innerHTML = "";
    const size = opts.size || 180;
    const thickness = opts.thickness || 20;
    const r = (size - thickness) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;
    const total = opts.segments.reduce((s, seg) => s + seg.value, 0) || 1;

    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    wrap.style.width = size + "px";
    wrap.style.height = size + "px";

    const svg = el("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size, style: "transform:rotate(-90deg)" });
    const track = el("circle", { cx: c, cy: c, r, fill: "none", stroke: "var(--surface-2)", "stroke-width": thickness });
    svg.appendChild(track);

    let offsetAcc = 0;
    opts.segments.forEach((seg) => {
      const frac = seg.value / total;
      const dash = frac * circumference;
      const circle = el("circle", {
        cx: c, cy: c, r, fill: "none", stroke: seg.color, "stroke-width": thickness,
        "stroke-dasharray": `0 ${circumference}`, "stroke-dashoffset": -offsetAcc, "stroke-linecap": "round"
      });
      svg.appendChild(circle);
      requestAnimationFrame(() => {
        circle.style.transition = "stroke-dasharray 1.1s cubic-bezier(.16,1,.3,1)";
        circle.setAttribute("stroke-dasharray", `${Math.max(0, dash - 2)} ${circumference}`);
      });
      offsetAcc += dash;
    });

    wrap.appendChild(svg);
    if (opts.centerBig != null) {
      const center = document.createElement("div");
      center.className = "donut-center";
      center.innerHTML = `<div class="big">${opts.centerBig}</div><div class="lbl">${opts.centerLabel || ""}</div>`;
      wrap.appendChild(center);
    }
    container.appendChild(wrap);
  }

  /**
   * sparkline(container, {values, color, height}) — compact trend line for
   * KPI cards. No axes, no interaction; just shows shape + direction.
   */
  function sparkline(container, opts) {
    container.innerHTML = "";
    const values = opts.values || [];
    if (values.length < 2) return;
    const W = 140, H = opts.height ? 28 : 28;
    const pad = 3;
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const x = (i) => pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = (v) => pad + (1 - (v - min) / range) * (H - pad * 2);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none" });
    svg.style.width = "100%"; svg.style.height = "100%"; svg.style.display = "block";
    const pts = values.map((v, i) => [x(i), y(v)]);
    const color = opts.color || "var(--accent)";
    const up = values[values.length - 1] >= values[0];
    const path = el("path", {
      d: smoothPath(pts), fill: "none", stroke: up ? "var(--good)" : "var(--critical)",
      "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round"
    });
    const len = 400;
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    svg.appendChild(path);
    const dot = el("circle", { cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: 2.2, fill: up ? "var(--good)" : "var(--critical)" });
    dot.style.opacity = 0;
    svg.appendChild(dot);
    container.appendChild(svg);
    requestAnimationFrame(() => {
      path.style.transition = "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)";
      path.style.strokeDashoffset = "0";
      dot.style.transition = "opacity .3s ease .8s";
      dot.style.opacity = 1;
    });
    void color; // reserved for future per-series coloring
  }

  /**
   * gaugeChart(container, {value, max, size, color, big, label})
   * Full-circle instrument-style gauge with a glowing arc (see .gauge-arc).
   */
  function gaugeChart(container, opts) {
    container.innerHTML = "";
    const size = opts.size || 140;
    const thickness = opts.thickness || 10;
    const r = (size - thickness) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(1, (opts.value || 0) / (opts.max || 100)));

    const wrap = document.createElement("div");
    wrap.className = "gauge-wrap";
    wrap.style.width = size + "px";
    wrap.style.height = size + "px";

    const svg = el("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size, style: "transform:rotate(-90deg)" });
    svg.appendChild(el("circle", { cx: c, cy: c, r, fill: "none", stroke: "var(--surface-2)", "stroke-width": thickness }));
    const gaugeColor = opts.color || "var(--accent)";
    const arc = el("circle", {
      cx: c, cy: c, r, fill: "none", stroke: gaugeColor, "stroke-width": thickness,
      "stroke-linecap": "round", "stroke-dasharray": `0 ${circumference}`, class: "gauge-arc"
    });
    // Glow matches this gauge's own color rather than a fixed theme hue, so
    // red/green/amber/info gauges each read correctly at a glance.
    arc.style.filter = `drop-shadow(0 0 6px ${gaugeColor})`;
    svg.appendChild(arc);
    wrap.appendChild(svg);

    const val = document.createElement("div");
    val.className = "gauge-val";
    val.innerHTML = `<div class="big">${opts.big != null ? opts.big : Math.round(pct * 100) + "%"}</div><div class="lbl">${opts.label || ""}</div>`;
    wrap.appendChild(val);
    container.appendChild(wrap);

    requestAnimationFrame(() => {
      arc.style.transition = "stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)";
      arc.setAttribute("stroke-dasharray", `${pct * circumference} ${circumference}`);
    });
  }

  /**
   * radarChart(container, {axes:[labels], series:[{name,color,values}], size})
   * values are 0..1 normalized per axis.
   */
  function radarChart(container, opts) {
    container.innerHTML = "";
    // Extra side/vertical padding reserved purely for axis-label text, so
    // labels at the left/right/top/bottom extremes don't clip the viewBox.
    const padX = 52, padY = 26;
    const size = opts.size || 260;
    const W = size + padX * 2, H = size + padY * 2;
    const cx = W / 2, cy = H / 2;
    const rings = 4;
    const maxR = size / 2 - 20;
    const axes = opts.axes || [];
    const n = axes.length;
    const angle = (i) => -Math.PI / 2 + (i / n) * Math.PI * 2;
    const pt = (i, frac) => [cx + Math.cos(angle(i)) * maxR * frac, cy + Math.sin(angle(i)) * maxR * frac];

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H });

    for (let ring = 1; ring <= rings; ring++) {
      const frac = ring / rings;
      const pts = axes.map((_, i) => pt(i, frac).join(",")).join(" ");
      svg.appendChild(el("polygon", { points: pts, class: "radar-grid" }));
    }
    axes.forEach((label, i) => {
      const [ax, ay] = pt(i, 1);
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: ax, y2: ay, class: "radar-axis-line" }));
      const cosA = Math.cos(angle(i));
      const [lx, ly] = pt(i, 1.14);
      const anchor = cosA > 0.35 ? "start" : cosA < -0.35 ? "end" : "middle";
      const t = el("text", { x: lx, y: ly, class: "radar-axis-label", "dominant-baseline": "middle", "text-anchor": anchor });
      t.textContent = label;
      svg.appendChild(t);
    });

    (opts.series || []).forEach((s) => {
      const pts = s.values.map((v, i) => pt(i, Math.max(0.04, Math.min(1, v))).join(",")).join(" ");
      const poly = el("polygon", { points: pts, class: "radar-poly", stroke: s.color, fill: s.color });
      poly.style.opacity = 0;
      poly.style.transformOrigin = `${cx}px ${cy}px`;
      poly.style.transform = "scale(.85)";
      svg.appendChild(poly);
      requestAnimationFrame(() => {
        poly.style.transition = "opacity .7s ease, transform .7s cubic-bezier(.16,1,.3,1)";
        poly.style.opacity = 1;
        poly.style.transform = "scale(1)";
      });
      s.values.forEach((v, i) => {
        const [dx, dy] = pt(i, Math.max(0.04, Math.min(1, v)));
        svg.appendChild(el("circle", { cx: dx, cy: dy, r: 2.6, fill: s.color }));
      });
    });

    container.appendChild(svg);

    if (opts.series && opts.series.length > 1) {
      const legend = document.createElement("div");
      legend.className = "chart-legend";
      legend.innerHTML = opts.series.map((s) =>
        `<span class="legend-item"><span class="legend-swatch" style="background:${s.color}"></span>${escapeHtmlLocal(s.name)}</span>`
      ).join("");
      container.appendChild(legend);
    }
  }
  function escapeHtmlLocal(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function animateBars(container) {
    requestAnimationFrame(() => {
      container.querySelectorAll(".bar-fill[data-w]").forEach((b) => {
        requestAnimationFrame(() => (b.style.width = b.dataset.w + "%"));
      });
    });
  }

  function countUp(el_, target, opts) {
    opts = opts || {};
    const duration = opts.duration || 1100;
    const format = opts.format || ((v) => Math.round(v).toLocaleString());
    const start = performance.now();
    const from = 0;
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      const v = from + (target - from) * ease(p);
      el_.textContent = format(v);
      if (p < 1) requestAnimationFrame(frame);
      else el_.textContent = format(target);
    }
    requestAnimationFrame(frame);
  }

  global.RouteXCharts = { lineAreaChart, donutChart, animateBars, countUp, sparkline, gaugeChart, radarChart };
})(window);
