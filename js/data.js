/* ==========================================================================
   RouteX — Mock data layer + deterministic route-intelligence engine
   Everything here is simulated for demo purposes but internally consistent:
   same inputs always produce the same evaluated routes.
   ========================================================================== */

(function (global) {
  "use strict";

  /* ---------- seeded PRNG (mulberry32) so "random" data is stable ---------- */
  function hashStr(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }
  function mulberry32(seed) {
    let a = seed;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rngFor(key) {
    const seedFn = hashStr(String(key));
    return mulberry32(seedFn());
  }
  function pick(rng, min, max) { return min + rng() * (max - min); }

  /* ---------------------------- Networks ---------------------------- */
  const NETWORKS = [
    { id: "ethereum",  name: "Ethereum",  symbol: "ETH",  glyph: "E", kind: "L1",  color: "#8aa6ff", blockTime: 12.1, gasToken: "ETH" },
    { id: "arbitrum",  name: "Arbitrum",  symbol: "ARB",  glyph: "A", kind: "L2",  color: "#6bd3ff", blockTime: 0.26, gasToken: "ETH" },
    { id: "optimism",  name: "Optimism",  symbol: "OP",   glyph: "O", kind: "L2",  color: "#ff6b6b", blockTime: 2.0,  gasToken: "ETH" },
    { id: "base",      name: "Base",      symbol: "BASE", glyph: "B", kind: "L2",  color: "#5b8def", blockTime: 2.0,  gasToken: "ETH" },
    { id: "polygon",   name: "Polygon",   symbol: "POL",  glyph: "P", kind: "L1",  color: "#b48bff", blockTime: 2.2,  gasToken: "POL" },
    { id: "avalanche", name: "Avalanche", symbol: "AVAX", glyph: "V", kind: "L1",  color: "#ff8a6b", blockTime: 1.9,  gasToken: "AVAX" },
    { id: "solana",    name: "Solana",    symbol: "SOL",  glyph: "S", kind: "SVM", blockTime: 0.4,  color: "#6eead1", gasToken: "SOL" },
    { id: "bnb",       name: "BNB Chain", symbol: "BNB",  glyph: "N", kind: "L1",  color: "#ffd166", blockTime: 1.5,  gasToken: "BNB" }
  ];

  const STATUS_CYCLE = ["healthy", "healthy", "healthy", "degraded", "healthy", "healthy", "unavailable", "healthy"];
  NETWORKS.forEach((n, i) => {
    const rng = rngFor("health:" + n.id);
    n.status = STATUS_CYCLE[i];
    n.congestion = Math.round(pick(rng, n.status === "degraded" ? 55 : 8, n.status === "degraded" ? 82 : 38));
    n.latencyMs = Math.round(pick(rng, 180, n.status === "degraded" ? 1400 : 650));
    n.gasGwei = +(pick(rng, 0.8, n.id === "ethereum" ? 24 : 4)).toFixed(2);
    n.uptime = n.status === "unavailable" ? +(pick(rng, 92, 97)).toFixed(2) : +(pick(rng, 99.2, 99.99)).toFixed(2);
  });

  /* ----------------------------- Assets ------------------------------ */
  const ASSETS = [
    { id: "usdc", symbol: "USDC", name: "USD Coin",  decimals: 6,  kind: "stable", price: 1.0 },
    { id: "usdt", symbol: "USDT", name: "Tether USD", decimals: 6, kind: "stable", price: 1.0 },
    { id: "eth",  symbol: "ETH",  name: "Ether",      decimals: 18, kind: "native", price: 3180 },
    { id: "wbtc", symbol: "WBTC", name: "Wrapped BTC", decimals: 8, kind: "wrapped", price: 68500 },
    { id: "arb",  symbol: "ARB",  name: "Arbitrum",   decimals: 18, kind: "governance", price: 0.74 },
    { id: "sol",  symbol: "SOL",  name: "Solana",     decimals: 9,  kind: "native", price: 148 }
  ];

  /* ------------------------- Bridge providers ------------------------- */
  const PROVIDERS = [
    {
      id: "cctp", name: "CCTP", fullName: "Circle Cross-Chain Transfer Protocol",
      model: "Native burn & mint", baseFeeBps: 1, baseTimeS: 70, reliabilityBase: 98.9,
      networks: ["ethereum", "arbitrum", "optimism", "base", "avalanche", "polygon"],
      auditors: ["OpenZeppelin", "Trail of Bits"], riskScore: 92, tvlM: 4200, volume24hM: 311,
      blurb: "Circle's native issuance rail — burns USDC on the source chain and mints 1:1 on the destination, no pooled liquidity risk."
    },
    {
      id: "stargate", name: "Stargate", fullName: "Stargate Finance",
      model: "Unified liquidity pools", baseFeeBps: 6, baseTimeS: 45, reliabilityBase: 97.8,
      networks: ["ethereum", "arbitrum", "optimism", "base", "polygon", "avalanche", "bnb"],
      auditors: ["Zellic", "Quantstamp"], riskScore: 86, tvlM: 1860, volume24hM: 212,
      blurb: "LayerZero-powered omnichain liquidity pools with instant guaranteed finality and shared delta-algorithm rebalancing."
    },
    {
      id: "across", name: "Across", fullName: "Across Protocol",
      model: "Optimistic intents + relayers", baseFeeBps: 4, baseTimeS: 18, reliabilityBase: 98.3,
      networks: ["ethereum", "arbitrum", "optimism", "base", "polygon"],
      auditors: ["OpenZeppelin", "Spearbit"], riskScore: 90, tvlM: 980, volume24hM: 164,
      blurb: "Single-sided relayer network secured by UMA's optimistic oracle — fastest median fill time of any audited bridge."
    },
    {
      id: "hop", name: "Hop", fullName: "Hop Protocol",
      model: "AMM bonded transfers", baseFeeBps: 8, baseTimeS: 150, reliabilityBase: 96.4,
      networks: ["ethereum", "arbitrum", "optimism", "polygon", "base"],
      auditors: ["Runtime Verification"], riskScore: 81, tvlM: 310, volume24hM: 38,
      blurb: "Bonder-fronted AMM transfers between rollups and Ethereum — mature, battle-tested since the first rollup wave."
    },
    {
      id: "wormhole", name: "Wormhole", fullName: "Wormhole (Portal)",
      model: "Guardian attestation", baseFeeBps: 5, baseTimeS: 95, reliabilityBase: 97.1,
      networks: ["ethereum", "arbitrum", "optimism", "base", "avalanche", "bnb", "solana"],
      auditors: ["Neodyme", "Kudelski"], riskScore: 84, tvlM: 2250, volume24hM: 178,
      blurb: "19-of-19 guardian multisig attestation network — the only evaluated route with native Solana reach."
    }
  ];

  const POLICIES = [
    { id: "balanced", label: "Balanced", description: "Best overall mix of cost, speed and reliability", weights: { cost: 0.32, time: 0.3, reliability: 0.28, liquidity: 0.1 } },
    { id: "cheapest", label: "Cheapest", description: "Minimize total execution cost", weights: { cost: 0.62, time: 0.12, reliability: 0.18, liquidity: 0.08 } },
    { id: "fastest", label: "Fastest", description: "Minimize time to finality", weights: { cost: 0.14, time: 0.62, reliability: 0.16, liquidity: 0.08 } },
    { id: "reliable", label: "Most Reliable", description: "Maximize execution certainty", weights: { cost: 0.14, time: 0.14, reliability: 0.6, liquidity: 0.12 } }
  ];

  /* --------------------------- helpers --------------------------- */
  function getNetwork(id) { return NETWORKS.find((n) => n.id === id); }
  function getAsset(id) { return ASSETS.find((a) => a.id === id); }
  function getProvider(id) { return PROVIDERS.find((p) => p.id === id); }

  function formatUSD(v) {
    if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
    if (v >= 1e3) return "$" + (v / 1e3).toFixed(v >= 1e4 ? 1 : 2) + "K";
    return "$" + v.toFixed(v < 10 ? 2 : 0);
  }
  function formatCompact(v) {
    if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
    if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
    return String(Math.round(v));
  }
  function formatDuration(seconds) {
    if (seconds < 60) return "~" + Math.round(seconds) + "s";
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m < 60) return "~" + m + "m" + (s ? " " + s + "s" : "");
    const h = Math.floor(m / 60);
    return "~" + h + "h " + (m % 60) + "m";
  }
  function formatPct(v, digits) { return v.toFixed(digits == null ? 1 : digits) + "%"; }
  function short(addr) { return addr.slice(0, 6) + "…" + addr.slice(-4); }
  function fakeTx(seedKey) {
    const rng = rngFor(seedKey);
    let out = "0x";
    const chars = "0123456789abcdef";
    for (let i = 0; i < 40; i++) out += chars[Math.floor(rng() * 16)];
    return out;
  }

  /* Small deterministic trend series for KPI-card sparklines, where no
     dedicated time series already exists for that metric. */
  function miniTrend(seedKey, points, base, amp) {
    const rng = rngFor(seedKey);
    points = points || 16;
    amp = amp == null ? base * 0.18 : amp;
    let v = base;
    const out = [];
    for (let i = 0; i < points; i++) {
      v += (rng() - 0.46) * amp * 0.3;
      v = Math.max(base - amp, Math.min(base + amp, v));
      out.push(v);
    }
    return out;
  }

  /* --------------------- route intelligence engine --------------------- */
  function evaluateRoutes(params) {
    const { source, destination, asset, amount, policy } = params;
    const srcNet = getNetwork(source);
    const dstNet = getNetwork(destination);
    const assetObj = getAsset(asset);
    const policyObj = POLICIES.find((p) => p.id === policy) || POLICIES[0];
    const amt = Number(amount) || 0;
    const usdAmount = amt * assetObj.price;

    const eligible = PROVIDERS.filter(
      (p) => p.networks.includes(source) && p.networks.includes(destination) && source !== destination
    );

    const congestionPenalty = (net) => (net.status === "degraded" ? 1.6 : net.status === "unavailable" ? 3.2 : 1);

    const candidates = eligible.map((provider) => {
      const rng = rngFor(`${provider.id}:${source}:${destination}:${asset}`);
      const variance = pick(rng, 0.85, 1.22);
      const feeBps = provider.baseFeeBps * pick(rng, 0.9, 1.25);
      const flatGasUSD = pick(rng, 0.4, srcNet.id === "ethereum" ? 9.5 : 1.8) * congestionPenalty(srcNet) * 0.5;
      const costUSD = Math.max(0.02, usdAmount * (feeBps / 10000) + flatGasUSD);
      const timeS = provider.baseTimeS * variance * congestionPenalty(srcNet) * (congestionPenalty(dstNet) * 0.5 + 0.5);
      const liquidityHeadroom = Math.min(1, (provider.tvlM * 1e6) / Math.max(usdAmount * 40, 1));
      const reliability = Math.max(
        80,
        Math.min(99.9, provider.reliabilityBase - (congestionPenalty(srcNet) - 1) * 4 - (congestionPenalty(dstNet) - 1) * 3 + pick(rng, -0.4, 0.4))
      );
      const costScore = 1 - Math.min(1, costUSD / (usdAmount * 0.02 + 5));
      const timeScore = 1 - Math.min(1, timeS / 420);
      const reliabilityScore = (reliability - 80) / 19.9;
      const liquidityScore = liquidityHeadroom;
      const weighted =
        costScore * policyObj.weights.cost +
        timeScore * policyObj.weights.time +
        reliabilityScore * policyObj.weights.reliability +
        liquidityScore * policyObj.weights.liquidity;

      return {
        provider,
        hop: "direct",
        viaLabel: `${srcNet.name} → ${dstNet.name}`,
        costUSD, timeS, reliability, liquidityHeadroom,
        score: weighted,
        scoreBreakdown: { costScore, timeScore, reliabilityScore, liquidityScore }
      };
    });

    // synthetic one-hop alternative through a credible intermediate network, for texture
    const intermediateCandidates = NETWORKS.filter(
      (n) => n.id !== source && n.id !== destination && n.status !== "unavailable"
    );
    if (intermediateCandidates.length && eligible.length) {
      const rngPick = rngFor(`hop-mid:${source}:${destination}:${asset}`);
      const mid = intermediateCandidates[Math.floor(rngPick() * intermediateCandidates.length)];
      const hopProvider = eligible[Math.floor(rngPick() * eligible.length)] || PROVIDERS[0];
      const rng = rngFor(`hop:${hopProvider.id}:${source}:${mid.id}:${destination}:${asset}`);
      const feeBps = hopProvider.baseFeeBps * pick(rng, 1.4, 1.9);
      const costUSD = Math.max(0.05, usdAmount * (feeBps / 10000) + pick(rng, 1.2, 4.5));
      const timeS = hopProvider.baseTimeS * pick(rng, 1.9, 2.6) * congestionPenalty(mid);
      const reliability = Math.max(78, hopProvider.reliabilityBase - 5.5 - (congestionPenalty(mid) - 1) * 4);
      const costScore = 1 - Math.min(1, costUSD / (usdAmount * 0.02 + 5));
      const timeScore = 1 - Math.min(1, timeS / 420);
      const reliabilityScore = (reliability - 80) / 19.9;
      const liquidityScore = 0.55;
      const weighted =
        costScore * policyObj.weights.cost +
        timeScore * policyObj.weights.time +
        reliabilityScore * Math.max(0, policyObj.weights.reliability) +
        liquidityScore * policyObj.weights.liquidity;
      candidates.push({
        provider: hopProvider,
        hop: "multi",
        viaLabel: `${srcNet.name} → ${mid.name} → ${dstNet.name}`,
        midNetwork: mid,
        costUSD, timeS, reliability, liquidityHeadroom: 0.55,
        score: weighted,
        scoreBreakdown: { costScore, timeScore, reliabilityScore, liquidityScore }
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    const recommended = candidates[0] || null;
    const alternatives = candidates.slice(1, 4);

    let reason = "";
    if (recommended) {
      const d = recommended.scoreBreakdown;
      const top = Object.entries(d).sort((a, b) => b[1] - a[1])[0][0];
      const reasonMap = {
        costScore: "the lowest total execution cost among audited, sufficiently-liquid providers",
        timeScore: "the fastest expected time to finality for this pair right now",
        reliabilityScore: "the strongest reliability given current network conditions",
        liquidityScore: "the deepest available liquidity relative to this order size"
      };
      reason =
        recommended.hop === "multi"
          ? `No single bridge covers ${srcNet.name} → ${dstNet.name} as well as routing through ${recommended.midNetwork.name}, which offers ${reasonMap[top]}.`
          : `${recommended.provider.name} offers ${reasonMap[top]} — the strongest fit under your ${policyObj.label} routing policy, weighing cost, latency, liquidity and reliability.`;
    }

    return { source: srcNet, destination: dstNet, asset: assetObj, amount: amt, usdAmount, policy: policyObj, recommended, alternatives, reason };
  }

  /* --------------------------- time-series mocks --------------------------- */
  function series(key, n, base, amp, opts) {
    opts = opts || {};
    const rng = rngFor(key);
    let v = base;
    const out = [];
    for (let i = 0; i < n; i++) {
      const drift = (opts.trend || 0);
      v = v + drift + (rng() - 0.5) * amp;
      if (opts.min != null) v = Math.max(opts.min, v);
      if (opts.max != null) v = Math.min(opts.max, v);
      out.push(Math.round(v * 100) / 100);
    }
    return out;
  }

  const DAYS_14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(2026, 10, 8 - (13 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const ANALYTICS = {
    labels: DAYS_14,
    volumeM: series("volume", 14, 38, 9, { trend: 0.9, min: 18 }),
    costAvgUSD: series("cost", 14, 4.8, 1.1, { min: 1.8, max: 9 }),
    latencyAvgS: series("latency", 14, 52, 14, { min: 18, max: 110 }),
    successRate: series("success", 14, 98.4, 0.6, { min: 95, max: 99.9 }),
    executionsCount: series("execcount", 14, 5200, 900, { trend: 70, min: 3000 })
  };
  const FAIL_RATE = +(100 - ANALYTICS.successRate[ANALYTICS.successRate.length - 1]).toFixed(2);

  const COMMAND_CENTER_VOLUME = series("cc-volume", 24, 5, 1.6, { min: 0.6 });

  /* --------------------------- recent executions --------------------------- */
  const STATUS_WEIGHTS = ["Completed", "Completed", "Completed", "Completed", "Processing", "Completed", "Failed"];
  function buildRecentExecutions(count) {
    const rows = [];
    for (let i = 0; i < count; i++) {
      const rng = rngFor("exec:" + i);
      const srcIdx = Math.floor(rng() * NETWORKS.length);
      let dstIdx = Math.floor(rng() * NETWORKS.length);
      if (dstIdx === srcIdx) dstIdx = (dstIdx + 1) % NETWORKS.length;
      const provider = PROVIDERS[Math.floor(rng() * PROVIDERS.length)];
      const asset = ASSETS[Math.floor(rng() * ASSETS.length)];
      const amount = +(pick(rng, 50, 48000)).toFixed(asset.kind === "stable" ? 0 : 3);
      const cost = +(pick(rng, 0.3, 22)).toFixed(2);
      const latency = Math.round(pick(rng, 12, 240));
      const status = STATUS_WEIGHTS[Math.floor(rng() * STATUS_WEIGHTS.length)];
      const minsAgo = Math.round(pick(rng, 1, 640));
      rows.push({
        id: fakeTx("exec-tx:" + i),
        source: NETWORKS[srcIdx], destination: NETWORKS[dstIdx],
        provider, asset, amount, cost, latency, status, minsAgo
      });
    }
    return rows.sort((a, b) => a.minsAgo - b.minsAgo);
  }
  const RECENT_EXECUTIONS = buildRecentExecutions(9);

  /* --------------------------- intelligence feed --------------------------- */
  const INSIGHTS = [
    { type: "optimization", title: "Across overtakes Hop on Arbitrum → Polygon", body: "Median fill time dropped to 16s after a relayer capacity increase. RouteX re-weighted 212 historical route evaluations.", minsAgo: 14, impact: "high" },
    { type: "anomaly", title: "Liquidity thinning on Avalanche ↔ Base", body: "Stargate pool depth on this pair fell 18% in six hours. RouteX is discounting this path until liquidity recovers.", minsAgo: 47, impact: "medium" },
    { type: "forecast", title: "Ethereum gas forecast: elevated through 18:00 UTC", body: "Mempool pressure from a token launch is pushing base fee forecasts up ~30%. Consider routing non-urgent transfers after 18:00 UTC.", minsAgo: 95, impact: "medium" },
    { type: "optimization", title: "CCTP reliability improved to 98.9%", body: "Circle's attestation service latency normalized after yesterday's brief regional slowdown. Reliability weighting restored to baseline.", minsAgo: 211, impact: "low" },
    { type: "anomaly", title: "Unusual retry pattern on Wormhole → Solana", body: "Guardian quorum delays caused 4 retried finalizations in the last hour. No funds at risk; RouteX is monitoring before any re-weighting.", minsAgo: 338, impact: "medium" }
  ];

  const SECURITY_ROWS = PROVIDERS.map((p) => {
    const rng = rngFor("sec:" + p.id);
    return {
      provider: p,
      auditors: p.auditors,
      lastAudit: ["Mar 2026", "Jun 2026", "Aug 2026", "Sep 2026"][Math.floor(rng() * 4)],
      riskScore: p.riskScore,
      insuranceM: Math.round(pick(rng, 5, 60)),
      bugBountyM: Math.round(pick(rng, 0.5, 3))
    };
  });

  global.RouteXData = {
    NETWORKS, ASSETS, PROVIDERS, POLICIES,
    getNetwork, getAsset, getProvider,
    formatUSD, formatCompact, formatDuration, formatPct, short, fakeTx, miniTrend,
    evaluateRoutes,
    ANALYTICS, FAIL_RATE, COMMAND_CENTER_VOLUME,
    RECENT_EXECUTIONS, INSIGHTS, SECURITY_ROWS
  };
})(window);
