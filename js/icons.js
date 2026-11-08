/* ==========================================================================
   RouteX — hand-authored stroke icon set (no external icon CDN dependency)
   All paths live in a 24x24 box, stroke="currentColor", round joins.
   ========================================================================== */
(function (global) {
  "use strict";

  const PATHS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    route: '<circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="6" r="2.4"/><path d="M7.2 17 Q13 13 10.5 9 Q8.5 5.5 12 4"/><path d="M12 4 L16.8 6.2"/>',
    bridge: '<path d="M3 17 L3 11 Q3 7 7 7 L17 7 Q21 7 21 11 L21 17"/><path d="M3 17 v3 M8 17 v3 M13 17 v3 M18 17 v3 M21 17 v3"/>',
    bars: '<path d="M4 20 V12"/><path d="M10 20 V7"/><path d="M16 20 V14"/><path d="M22 20 V4" transform="translate(-2 0)"/>',
    brain: '<path d="M9 4.5a3 3 0 0 0-3 3 2.6 2.6 0 0 0-1.5 4.6A3 3 0 0 0 6 17.8 3 3 0 0 0 9 20.5 2.7 2.7 0 0 0 11.3 18V7a2.5 2.5 0 0 0-2.3-2.5Z"/><path d="M15 4.5a3 3 0 0 1 3 3 2.6 2.6 0 0 1 1.5 4.6A3 3 0 0 1 18 17.8a3 3 0 0 1-3 2.7A2.7 2.7 0 0 1 12.7 18V7A2.5 2.5 0 0 1 15 4.5Z"/>',
    shield: '<path d="M12 3.2 19 6v5.6c0 4.6-3.1 7.6-7 8.9-3.9-1.3-7-4.3-7-8.9V6Z"/>',
    'shield-check': '<path d="M12 3.2 19 6v5.6c0 4.6-3.1 7.6-7 8.9-3.9-1.3-7-4.3-7-8.9V6Z"/><path d="M9.2 12.1 11.3 14.2 15 10"/>',
    globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4c2.6 2.3 4 5.2 4 8.6s-1.4 6.3-4 8.6c-2.6-2.3-4-5.2-4-8.6s1.4-6.3 4-8.6Z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/>',
    moon: '<path d="M20.2 14.4A8.7 8.7 0 1 1 9.6 3.8a7 7 0 0 0 10.6 10.6Z"/>',
    'chevron-down': '<path d="M5.5 8.5 12 15l6.5-6.5"/>',
    'chevron-right': '<path d="M8.5 5.5 15 12l-6.5 6.5"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="M19.5 19.5l-4.3-4.3"/>',
    bell: '<path d="M6 10.5a6 6 0 0 1 12 0c0 4.2 1.4 5.6 1.4 5.6H4.6S6 14.7 6 10.5Z"/><path d="M10.2 19.5a1.9 1.9 0 0 0 3.6 0"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2.1 2.1 0 1 1-3 3l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20a2.1 2.1 0 1 1-4.2 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2.1 2.1 0 1 1-3-3l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2.1 2.1 0 1 1 0-4.2h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2.1 2.1 0 1 1 3-3l.1.1a1.7 1.7 0 0 0 1.9.3H9.5a1.7 1.7 0 0 0 1-1.5V3a2.1 2.1 0 1 1 4.2 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2.1 2.1 0 1 1 3 3l-.1.1a1.7 1.7 0 0 0-.3 1.9V9.5a1.7 1.7 0 0 0 1.5 1H21a2.1 2.1 0 1 1 0 4.2h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    check: '<path d="M5 12.5 9.5 17 19 7"/>',
    'check-circle': '<circle cx="12" cy="12" r="8.6"/><path d="M8.2 12.3 10.8 15 15.8 9.3"/>',
    'alert-triangle': '<path d="M12 4.2 21 19.6H3Z"/><path d="M12 10.2v4.2M12 16.9v.1"/>',
    'x-circle': '<circle cx="12" cy="12" r="8.6"/><path d="M9 9l6 6M15 9l-6 6"/>',
    'arrow-up-right': '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
    'arrow-down-right': '<path d="M7 7 17 17"/><path d="M17 9V17H9"/>',
    'arrow-right': '<path d="M4.5 12h15"/><path d="M13 5.5 19.5 12 13 18.5"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="1.8"/><path d="M15.5 8.5V6a1.8 1.8 0 0 0-1.8-1.8H5.8A1.8 1.8 0 0 0 4 6v7.9a1.8 1.8 0 0 0 1.8 1.8H8.5"/>',
    'external-link': '<path d="M9 6H6.5A2.5 2.5 0 0 0 4 8.5v9A2.5 2.5 0 0 0 6.5 20h9a2.5 2.5 0 0 0 2.5-2.5V15"/><path d="M14 4h6v6"/><path d="M10 14 19.8 4.2"/>',
    zap: '<path d="M12.8 2.5 5 13.6h5.6L10.8 21.5 19 10h-5.6Z"/>',
    dollar: '<path d="M12 2.8v18.4"/><path d="M16.6 6.7c-.8-1-2.4-1.7-4.4-1.7-2.7 0-4.9 1.3-4.9 3.6s2.2 3 4.9 3.4c2.8.5 4.9 1.3 4.9 3.6s-2.2 3.6-4.9 3.6c-2 0-3.7-.7-4.5-1.8"/>',
    scale: '<path d="M12 3v17.5"/><path d="M7 20.5h10"/><path d="M12 5.5 5 8.3l3.5 7a3.5 3.5 0 0 0 7 0l3.5-7Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    wallet: '<rect x="2.8" y="6.2" width="18.4" height="13" rx="2.3"/><path d="M2.8 10.2h18.4"/><circle cx="16.4" cy="14.6" r="1.1" fill="currentColor" stroke="none"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M4 7l8 6 8-6"/>',
    user: '<circle cx="12" cy="8.3" r="3.6"/><path d="M4.6 20.2a7.4 7.4 0 0 1 14.8 0"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.3V12l3.3 2"/>',
    activity: '<path d="M3 12h4l2.2-7 4 14 2.2-7H21"/>',
    'trending-up': '<path d="M3 16.5 9.5 10l4 4L21 6"/><path d="M21 11V6h-5"/>',
    layers: '<path d="M12 3.3 21 8l-9 4.7L3 8Z"/><path d="M3 13.3 12 18l9-4.7"/><path d="M3 16.5 12 21.2l9-4.7"/>',
    cpu: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.8"/><rect x="10" y="10" width="4" height="4"/><path d="M9 3.5v3M15 3.5v3M9 17.5v3M15 17.5v3M3.5 9h3M3.5 15h3M17.5 9h3M17.5 15h3"/>',
    sparkles: '<path d="M11 2.5 12.6 8 18 9.6 12.6 11.2 11 16.7 9.4 11.2 4 9.6 9.4 8Z"/><path d="M18.3 15.5 19 18l2.5.7L19 19.4l-.7 2.6-.7-2.6-2.5-.7 2.5-.7Z"/>',
    network: '<circle cx="5.2" cy="6" r="2.1"/><circle cx="18.8" cy="6" r="2.1"/><circle cx="12" cy="18.2" r="2.1"/><circle cx="12" cy="11" r="1.8"/><path d="M6.7 7.2 10.6 10M17.3 7.2 13.4 10M12 12.8v3.5"/>',
    play: '<path d="M7.5 5.2v13.6l11-6.8Z"/>',
    filter: '<path d="M3.5 5h17L14 12.8v5.7l-4 2v-7.7Z"/>',
    'arrow-left': '<path d="M19.5 12h-15"/><path d="M11 18.5 4.5 12 11 5.5"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.3M12 8.1v.1"/>',
    link: '<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.2 13 4.2a3.7 3.7 0 0 1 5.2 5.2l-2 2"/><path d="M13 17.8l-2 2a3.7 3.7 0 0 1-5.2-5.2l2-2"/>',
    maximize: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>'
  };

  function icon(name, opts) {
    opts = opts || {};
    const size = opts.size || 18;
    const sw = opts.strokeWidth || 1.75;
    const cls = opts.className ? ` ${opts.className}` : "";
    const body = PATHS[name] || PATHS.info;
    return `<svg class="icon${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  /* ---------------------------------------------------------------------
     Provider emblems — a distinct hand-drawn glyph per bridge provider,
     standing in for a logo/photo (which the CSP + offline build can't
     load). Each is a small geometric mark that nods at how the provider
     actually works, not just a letter badge.
     ------------------------------------------------------------------- */
  const PROVIDER_MARKS = {
    // CCTP: native mint/burn — concentric target rings
    cctp: '<circle cx="12" cy="12" r="7.4"/><circle cx="12" cy="12" r="3.6"/><circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none"/>',
    // Stargate: a streaking star / warp burst
    stargate: '<path d="M12 3 13.6 9.2 19.8 12 13.6 14.8 12 21 10.4 14.8 4.2 12 10.4 9.2Z"/>',
    // Across: a single clean bridge-arch span
    across: '<path d="M3.5 17.5v-3.2A8.5 7 0 0 1 12 6.8a8.5 7 0 0 1 8.5 7.5v3.2"/><path d="M3.5 17.5h17M6.5 17.5v-4M17.5 17.5v-4"/>',
    // Hop: stepping-stone dots ascending across
    hop: '<circle cx="4.2" cy="17.5" r="1.6"/><circle cx="10.4" cy="12.3" r="1.6"/><circle cx="16.6" cy="7.6" r="1.6"/><circle cx="21" cy="4.4" r="1.2"/><path d="M5.8 16.3 8.8 13.5M12 11 14.9 8.6" stroke-dasharray="1.5 2.4"/>',
    // Wormhole: a spiral vortex
    wormhole: '<path d="M12 12c0-2 1.6-3.4 3.4-3.4 2.4 0 4.1 2 4.1 4.4 0 3.1-2.5 5.3-5.4 5.3-3.6 0-6.4-2.9-6.4-6.5C7.7 7.5 11.1 4 15.3 4"/>'
  };
  function providerMark(id, opts) {
    opts = opts || {};
    const size = opts.size || 16;
    const sw = opts.strokeWidth || 1.8;
    const body = PROVIDER_MARKS[id] || PATHS.bridge;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  global.RouteXIcons = { icon, PATHS, providerMark, PROVIDER_MARKS };
})(window);
