/**
 * RetinaSafe — theme.js
 * Dark mode + Colorblind mode system
 * Injects a beautiful floating toggle panel into every page
 *
 * v2 — Vision-game compatible:
 *   • Colorblind filter is scoped to a thin wrapper that EXCLUDES:
 *       - All .modal-backdrop elements (start/results modals)
 *       - #hud, #progress-bar, #flash-feedback, #fixation-target,
 *         .peripheral-dot, and any element with [data-no-filter]
 *   • Dark-mode tokens extended to cover game UI, scoreboard cards,
 *     contrast-discriminator result grids, and modal bodies.
 *   • Filter wrapper rebuilt on every applyColorblindFilter() call so
 *     dynamically-injected game elements (peripheral dots) are never
 *     accidentally captured inside the filtered layer.
 */
(function RetinaSafeTheme() {
  'use strict';

  // ── Storage keys ──────────────────────────────────────────────────────────
  const DARK_KEY = 'retinasafe_dark';
  const CB_KEY = 'retinasafe_colorblind';

  // ── Colorblind filter definitions ─────────────────────────────────────────
  const CB_MODES = [
    { id: 'none', label: 'Off', icon: '👁', desc: 'Standard colours' },
    { id: 'protanopia', label: 'Protanopia', icon: '🔴', desc: 'Red-blind' },
    { id: 'deuteranopia', label: 'Deuteranopia', icon: '🟢', desc: 'Green-blind' },
    { id: 'tritanopia', label: 'Tritanopia', icon: '🔵', desc: 'Blue-blind' },
    { id: 'achromatopsia', label: 'Greyscale', icon: '⚫', desc: 'No colour' },
  ];

  const CB_MATRICES = {
    none: null,
    protanopia: [0.567, 0.433, 0, 0, 0,
      0.558, 0.442, 0, 0, 0,
      0, 0.242, 0.758, 0, 0,
      0, 0, 0, 1, 0],
    deuteranopia: [0.625, 0.375, 0, 0, 0,
      0.7, 0.3, 0, 0, 0,
      0, 0.3, 0.7, 0, 0,
      0, 0, 0, 1, 0],
    tritanopia: [0.95, 0.05, 0, 0, 0,
      0, 0.433, 0.567, 0, 0,
      0, 0.475, 0.525, 0, 0,
      0, 0, 0, 1, 0],
    achromatopsia: [0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0, 0, 0, 1, 0],
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let isDark = localStorage.getItem(DARK_KEY) === 'true';
  let cbMode = localStorage.getItem(CB_KEY) || 'none';
  let panelOpen = false;

  // ── Selectors that must NEVER receive the colorblind filter ───────────────
  // These are either interactive game elements, modals, or our own UI.
  const FILTER_EXCLUDE_SELECTORS = [
    '.modal-backdrop',
    '#hud',
    '#progress-bar',
    '#flash-feedback',
    '#fixation-target',
    '.peripheral-dot',
    '#rs-theme-fab',
    '#rs-theme-panel',
    '[data-no-filter]',
  ];

  // ── Inject the SVG filter definition into <head> ──────────────────────────
  function ensureSVGFilter() {
    if (document.getElementById('rs-svg-filters')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'rs-svg-filters';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    svg.innerHTML = `<defs>
      <filter id="rs-cbf" x="0%" y="0%" width="100%" height="100%"
              color-interpolation-filters="linearRGB">
        <feColorMatrix id="rs-cbf-matrix" type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
      </filter>
    </defs>`;
    document.body.appendChild(svg);
  }

  // ── Apply or remove the colorblind filter ─────────────────────────────────
  // Strategy: instead of a persistent wrapper div (which captures dynamically
  // injected game elements), we apply `filter: url(#rs-cbf)` directly to
  // <html> and then use CSS `filter: none !important` on excluded elements.
  // This avoids stacking-context traps and works with late-injected DOM nodes.
  function applyColorblindFilter(mode) {
    ensureSVGFilter();

    const matrix = CB_MATRICES[mode];
    const feEl = document.getElementById('rs-cbf-matrix');
    const styleId = 'rs-cbf-exclusions';

    if (!matrix || mode === 'none') {
      // Remove filter from root
      document.documentElement.style.filter = '';
      if (feEl) feEl.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0');
      const old = document.getElementById(styleId);
      if (old) old.remove();
    } else {
      // Update matrix values
      if (feEl) feEl.setAttribute('values', matrix.join(' '));

      // Apply filter to the root element
      document.documentElement.style.filter = 'url(#rs-cbf)';

      // Inject (or update) a style block that undoes the filter on excluded elements.
      // Because the filter creates a new stacking context on <html>, child elements
      // that set filter:none will correctly escape the parent filter.
      let excStyle = document.getElementById(styleId);
      if (!excStyle) {
        excStyle = document.createElement('style');
        excStyle.id = styleId;
        document.head.appendChild(excStyle);
      }
      const rules = FILTER_EXCLUDE_SELECTORS.map(sel =>
        `${sel} { filter: none !important; isolation: isolate; }`
      ).join('\n');
      excStyle.textContent = rules;
    }
  }

  // ── Apply dark mode ────────────────────────────────────────────────────────
  function applyDark(dark) {
    document.documentElement.classList.toggle('dark-mode', dark);
    const btn = document.getElementById('rs-dark-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', dark);
      btn.querySelector('.rs-toggle-knob').style.transform = dark ? 'translateX(26px)' : 'translateX(2px)';
      btn.querySelector('.rs-toggle-icon').textContent = dark ? '🌙' : '☀️';
    }
  }

  // ── Apply colorblind mode ──────────────────────────────────────────────────
  function applyColorblind(mode) {
    applyColorblindFilter(mode);
    document.querySelectorAll('.rs-cb-pill').forEach(pill => {
      pill.classList.toggle('rs-cb-active', pill.dataset.mode === mode);
      pill.setAttribute('aria-checked', pill.dataset.mode === mode);
    });
  }

  // ── Toggle panel open/close ────────────────────────────────────────────────
  function togglePanel() {
    panelOpen = !panelOpen;
    const panel = document.getElementById('rs-theme-panel');
    const fab = document.getElementById('rs-theme-fab');
    if (panel) {
      panel.classList.toggle('rs-panel-open', panelOpen);
      panel.setAttribute('aria-hidden', !panelOpen);
    }
    if (fab) {
      fab.setAttribute('aria-expanded', panelOpen);
      fab.querySelector('.rs-fab-icon').style.transform = panelOpen ? 'rotate(45deg)' : 'rotate(0deg)';
    }
  }

  // ── Inject CSS ─────────────────────────────────────────────────────────────
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'rs-theme-styles';
    style.textContent = `
      /* ══════════════════════════════════════════════════════════
         DARK MODE TOKENS
         ══════════════════════════════════════════════════════════ */
      html.dark-mode {
        --page-bg:       #0d1117;
        --white:         #161b22;
        --blue-50:       #0d1f3a;
        --blue-100:      #0f2a4a;
        --blue-200:      #1a3a5c;
        --blue-300:      #4a7fa5;
        --blue-500:      #58a6ff;
        --blue-600:      #79b8ff;
        --blue-700:      #a5c8ff;
        --text-primary:  #e6edf3;
        --text-secondary:#adbac7;
        --text-muted:    #8b949e;
        --text-light:    #768390;
        --border:        rgba(240,246,252,0.15);
        --border-med:    rgba(240,246,252,0.22);
        --shadow-sm:     0 1px 4px rgba(0,0,0,0.4);
        --shadow-md:     0 4px 20px rgba(0,0,0,0.5);
        --shadow-lg:     0 8px 40px rgba(0,0,0,0.6);
        --warning-bg:    #271c00;
        --warning-border:#7a5500;
        --warning-text:  #f0b429;
        --warning-strong:#fbbf24;

        /* Game-specific tokens */
        --gray-50:  #161b22;
        --gray-100: #1c2128;
        --gray-200: rgba(240,246,252,0.12);
        --gray-500: #8b949e;
        --gray-700: #adbac7;
        --gray-900: #e6edf3;
      }

      html.dark-mode body {
        background-color: var(--page-bg);
        color: var(--text-primary);
      }

      /* ── Navigation ──────────────────────────────────────────── */
      html.dark-mode .nav-wrapper {
        background: rgba(13,17,23,0.92) !important;
        border-bottom-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .nav-name-dark { color: #e6edf3 !important; }

      /* ── Footer ──────────────────────────────────────────────── */
      html.dark-mode .footer {
        background: #0a0e13 !important;
        border-top-color: rgba(240,246,252,0.08) !important;
      }

      /* ── Buttons ─────────────────────────────────────────────── */
      html.dark-mode .btn-outline {
        border-color: rgba(240,246,252,0.2) !important;
        color: var(--text-primary) !important;
      }
      html.dark-mode .btn-outline:hover {
        background: rgba(240,246,252,0.08) !important;
      }
      html.dark-mode .btn-ghost-white {
        background-color: rgba(255,255,255,0.12) !important;
        color: #e6edf3 !important;
        border-color: rgba(255,255,255,0.35) !important;
      }
      html.dark-mode .btn-ghost-white:hover {
        background-color: rgba(255,255,255,0.22) !important;
        color: #ffffff !important;
        border-color: rgba(255,255,255,0.6) !important;
      }

      /* ── Dashboard cards ─────────────────────────────────────── */
      html.dark-mode .dash-card,
      html.dark-mode .screening-card,
      html.dark-mode .dash-stat-card {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .disclaimer-banner {
        background: #271c00 !important;
        border-color: #5a3e00 !important;
        color: #d4a017 !important;
      }
      html.dark-mode h1, html.dark-mode h2,
      html.dark-mode h3, html.dark-mode h4 {
        color: var(--text-primary) !important;
      }
      html.dark-mode .risk-card      { background: #161b22 !important; }
      html.dark-mode .game-launch-card {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
        color: var(--text-primary) !important;
      }
      html.dark-mode .game-launch-card:hover {
        background: #1f2937 !important;
        border-color: var(--blue-500) !important;
      }

      /* ── Inputs ──────────────────────────────────────────────── */
      html.dark-mode input,
      html.dark-mode select,
      html.dark-mode textarea {
        background: #0d1117 !important;
        color: var(--text-primary) !important;
        border-color: rgba(240,246,252,0.15) !important;
      }

      /* ── Misc UI ─────────────────────────────────────────────── */
      html.dark-mode .cbar-track   { background: rgba(240,246,252,0.08) !important; }
      html.dark-mode .history-item { background: #161b22 !important; border-color: rgba(240,246,252,0.1) !important; }
      html.dark-mode .dash-hero    { background: linear-gradient(135deg,#0d1f3a 0%,#0d1117 100%) !important; }

      /* ── Risk / Badge levels ─────────────────────────────────── */
      html.dark-mode .level-low      { color: #34d399 !important; background: rgba(52,211,153,0.15) !important; }
      html.dark-mode .level-moderate { color: #fbbf24 !important; background: rgba(245,158,11,0.15) !important; }
      html.dark-mode .level-high     { color: #f87171 !important; background: rgba(239,68,68,0.15) !important; }
      html.dark-mode .risk-low  .risk-tier-label { color: #34d399 !important; }
      html.dark-mode .risk-mod  .risk-tier-label { color: #fbbf24 !important; }
      html.dark-mode .risk-high .risk-tier-label { color: #f87171 !important; }
      html.dark-mode .badge-low        { background: rgba(52,211,153,0.2)  !important; color: #34d399 !important; }
      html.dark-mode .badge-borderline { background: rgba(245,158,11,0.2)  !important; color: #fbbf24 !important; }
      html.dark-mode .badge-moderate   { background: rgba(245,158,11,0.2)  !important; color: #fbbf24 !important; }
      html.dark-mode .badge-high       { background: rgba(239,68,68,0.2)   !important; color: #f87171 !important; }
      html.dark-mode .badge-critical   { background: rgba(239,68,68,0.3)   !important; color: #f87171 !important; }

      /* ── Typography helpers ──────────────────────────────────── */
      html.dark-mode .cbar-name   { color: #e6edf3 !important; }
      html.dark-mode .card-title  { color: #e6edf3 !important; }
      html.dark-mode .card-sub    { color: #8b949e !important; }
      html.dark-mode .dsc-number  { color: #e6edf3 !important; }
      html.dark-mode .dsc-label   { color: #8b949e !important; }
      html.dark-mode .risk-action { color: #8b949e !important; }
      html.dark-mode .ring-value  { color: #e6edf3 !important; }
      html.dark-mode .ring-label  { color: #8b949e !important; }
      html.dark-mode .ring-track  { stroke: rgba(240,246,252,0.2) !important; }
      html.dark-mode .glc-title   { color: #e6edf3 !important; }
      html.dark-mode .glc-tag     { color: #8b949e !important; }
      html.dark-mode .glc-num     { color: rgba(240,246,252,0.45) !important; }

      /* ── Screening progress bar ──────────────────────────────── */
      html.dark-mode .pstep-dot {
        background: rgba(255,255,255,0.1) !important;
        border-color: rgba(88,166,255,0.45) !important;
      }
      html.dark-mode .pstep-number { color: #79b8ff !important; }
      html.dark-mode .progress-step.ps-active .pstep-dot {
        background: linear-gradient(135deg,#2563eb,#3b82f6) !important;
        border-color: transparent !important;
      }
      html.dark-mode .progress-step.ps-active .pstep-number { color: #ffffff !important; }
      html.dark-mode .progress-step.ps-active .pstep-label  { color: #79b8ff !important; }
      html.dark-mode .pstep-label { color: #adbac7 !important; }
      html.dark-mode .progress-bar-wrapper {
        background-color: #161b22 !important;
        border-bottom-color: rgba(240,246,252,0.1) !important;
      }

      /* ══════════════════════════════════════════════════════════
         VISION GAME — MODAL & GAME-UI DARK MODE
         Ensures start/results modals, HUD, and scoreboards are
         always readable regardless of theme or CB filter.
         ══════════════════════════════════════════════════════════ */

      /* Modal backdrops — kept fully visible, never filtered */
      html.dark-mode .modal-backdrop { background: rgba(10,14,20,0.72) !important; }

      /* Modal box */
      html.dark-mode .modal {
        background: #161b22 !important;
        color: #e6edf3 !important;
        border: 1px solid rgba(240,246,252,0.12) !important;
      }
      html.dark-mode .modal-header h1,
      html.dark-mode .modal-header .subtitle { color: #e6edf3 !important; }
      html.dark-mode .modal-header .subtitle { color: #adbac7 !important; }

      /* Disclaimer box inside modals */
      html.dark-mode .disclaimer-box {
        background: #0d1f3a !important;
        border-color: rgba(88,166,255,0.3) !important;
      }
      html.dark-mode .disclaimer-label { color: #79b8ff !important; }
      html.dark-mode .disclaimer-text  { color: #adbac7 !important; }

      /* Instructions list */
      html.dark-mode .instructions h3  { color: #e6edf3 !important; }
      html.dark-mode .instructions li  { color: #adbac7 !important; }
      html.dark-mode .instructions li strong { color: #e6edf3 !important; }

      /* Results grid cards (Peripheral + Contrast Discriminator) */
      html.dark-mode .result-card {
        background: #0d1117 !important;
        border-color: rgba(240,246,252,0.12) !important;
      }
      html.dark-mode .result-card .rc-label { color: #8b949e !important; }
      html.dark-mode .result-card .rc-value { color: #e6edf3 !important; }

      /* Scoreboard / results zone panel */
      html.dark-mode .result-zones {
        background: #0d1117 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .result-zones h4 { color: #8b949e !important; }

      /* Flag boxes */
      html.dark-mode .flag-box.flag-warn {
        background: #271c00 !important;
        border-color: #7a5500 !important;
        color: #fbbf24 !important;
      }
      html.dark-mode .flag-box.flag-critical {
        background: #1f0a0a !important;
        border-color: #7f1d1d !important;
        color: #f87171 !important;
      }
      html.dark-mode .flag-box.flag-ok {
        background: #0a1f12 !important;
        border-color: #14532d !important;
        color: #34d399 !important;
      }

      /* HUD pill (floating during gameplay) */
      html.dark-mode #hud {
        background: rgba(13,17,23,0.88) !important;
        border-color: rgba(240,246,252,0.12) !important;
        color: #adbac7 !important;
      }
      html.dark-mode #hud .hud-val { color: #e6edf3 !important; }

      /* Progress bar pill */
      html.dark-mode #progress-bar .pb-inner {
        background: rgba(13,17,23,0.88) !important;
        border-color: rgba(240,246,252,0.12) !important;
      }
      html.dark-mode .pb-text { color: #adbac7 !important; }
      html.dark-mode .pb-text span { color: #79b8ff !important; }
      html.dark-mode .pb-track { background: rgba(240,246,252,0.1) !important; }

      /* Game area background in dark mode */
      html.dark-mode #game-area {
        background:
          radial-gradient(ellipse at 50% 0%, #0d1f3a 0%, transparent 60%),
          linear-gradient(180deg, #0d1117 0%, #0a0e13 100%) !important;
      }
      html.dark-mode #game-area::before {
        background-image:
          linear-gradient(rgba(240,246,252,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(240,246,252,0.04) 1px, transparent 1px) !important;
      }

      /* Secondary / outline game buttons */
      html.dark-mode .btn-secondary {
        background: #1c2128 !important;
        color: #adbac7 !important;
        border-color: rgba(240,246,252,0.15) !important;
      }
      html.dark-mode .btn-secondary:hover {
        background: #262d37 !important;
        color: #e6edf3 !important;
      }

      /* Contrast Discriminator scoreboard specifics */
      html.dark-mode .cd-score-table,
      html.dark-mode .score-table {
        background: #0d1117 !important;
        border-color: rgba(240,246,252,0.1) !important;
        color: #e6edf3 !important;
      }
      html.dark-mode .cd-score-table th,
      html.dark-mode .score-table th {
        background: #161b22 !important;
        color: #adbac7 !important;
        border-color: rgba(240,246,252,0.08) !important;
      }
      html.dark-mode .cd-score-table td,
      html.dark-mode .score-table td {
        color: #e6edf3 !important;
        border-color: rgba(240,246,252,0.06) !important;
      }

      /* ══════════════════════════════════════════════════════════
         SMOOTH TRANSITIONS (page elements only — game canvas excluded)
         ══════════════════════════════════════════════════════════ */
      .dash-card, .nav-wrapper, .footer, .game-launch-card,
      .dash-stat-card, .risk-card, .history-item, .cbar-track,
      .modal, .result-card, .flag-box, .result-zones {
        transition: background-color 0.35s ease, border-color 0.35s ease, color 0.2s ease !important;
      }
      body {
        transition: background-color 0.35s ease, color 0.2s ease !important;
      }

      /* ══════════════════════════════════════════════════════════
         FAB BUTTON
         ══════════════════════════════════════════════════════════ */
      #rs-theme-fab {
        position: fixed;
        bottom: 28px;
        right: 28px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1D4ED8, #3B82F6);
        box-shadow: 0 4px 24px rgba(37,99,235,0.5), 0 0 0 3px rgba(255,255,255,0.15);
        transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
        outline: none;
        /* Always escape the root CB filter */
        filter: none !important;
        isolation: isolate;
      }
      #rs-theme-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 32px rgba(37,99,235,0.65), 0 0 0 3px rgba(255,255,255,0.2);
      }
      #rs-theme-fab:focus-visible {
        box-shadow: 0 0 0 4px #93C5FD;
      }
      .rs-fab-icon {
        font-size: 22px;
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        line-height: 1;
        user-select: none;
      }

      /* ── Panel ─────────────────────────────────────────────────── */
      #rs-theme-panel {
        position: fixed;
        bottom: 96px;
        right: 28px;
        width: 300px;
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
        z-index: 8999;
        padding: 0;
        overflow: hidden;
        transform: translateY(16px) scale(0.94);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
        /* Always escape the root CB filter */
        filter: none !important;
        isolation: isolate;
      }
      #rs-theme-panel.rs-panel-open {
        transform: translateY(0) scale(1);
        opacity: 1;
        pointer-events: all;
      }
      html.dark-mode #rs-theme-panel {
        background: #161b22;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,246,252,0.1);
      }

      .rs-panel-header {
        padding: 16px 20px 12px;
        border-bottom: 1px solid rgba(0,0,0,0.07);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      html.dark-mode .rs-panel-header { border-bottom-color: rgba(240,246,252,0.08); }

      .rs-panel-title {
        font-family: 'Lora', Georgia, serif;
        font-size: 15px;
        font-weight: 700;
        color: #1E3A5F;
        margin: 0;
      }
      html.dark-mode .rs-panel-title { color: #e6edf3; }

      .rs-panel-subtitle {
        font-size: 11px;
        color: #6B8CAE;
        margin: 0;
      }
      html.dark-mode .rs-panel-subtitle { color: #adbac7; }

      .rs-panel-section {
        padding: 14px 20px;
        border-bottom: 1px solid rgba(0,0,0,0.05);
      }
      html.dark-mode .rs-panel-section { border-bottom-color: rgba(240,246,252,0.06); }
      .rs-panel-section:last-child { border-bottom: none; }

      .rs-section-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: #6B8CAE;
        margin-bottom: 10px;
      }
      html.dark-mode .rs-section-label { color: #adbac7; }

      /* ── Dark Toggle Switch ──────────────────────────────────── */
      .rs-toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .rs-toggle-info { display: flex; flex-direction: column; }
      .rs-toggle-name { font-size: 14px; font-weight: 600; color: #1E3A5F; }
      html.dark-mode .rs-toggle-name { color: #e6edf3; }
      .rs-toggle-desc { font-size: 11px; color: #6B8CAE; }
      html.dark-mode .rs-toggle-desc { color: #adbac7; }

      #rs-dark-toggle {
        position: relative;
        width: 54px;
        height: 28px;
        border-radius: 14px;
        border: none;
        cursor: pointer;
        background: #D1D5DB;
        transition: background 0.3s ease;
        flex-shrink: 0;
        padding: 0;
        outline: none;
      }
      #rs-dark-toggle[aria-pressed="true"] {
        background: linear-gradient(135deg, #1D4ED8, #6366f1);
      }
      #rs-dark-toggle:focus-visible { box-shadow: 0 0 0 3px rgba(59,130,246,0.4); }
      .rs-toggle-knob {
        position: absolute;
        top: 2px;
        left: 0;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 1;
      }

      /* ── Colorblind Pills ────────────────────────────────────── */
      .rs-cb-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .rs-cb-pill {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1.5px solid rgba(0,0,0,0.08);
        background: #F9FAFB;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        outline: none;
        font-family: inherit;
        text-align: left;
      }
      html.dark-mode .rs-cb-pill {
        background: #0d1117;
        border-color: rgba(240,246,252,0.1);
      }
      .rs-cb-pill:hover {
        border-color: #3B82F6;
        background: #EFF6FF;
        transform: translateY(-1px);
      }
      html.dark-mode .rs-cb-pill:hover { background: #0d1f3a; }
      .rs-cb-pill.rs-cb-active {
        border-color: #2563EB;
        background: #EFF6FF;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.15), inset 0 0 0 1px rgba(37,99,235,0.2);
        transform: scale(1.02);
      }
      html.dark-mode .rs-cb-pill.rs-cb-active {
        background: #0d1f3a;
        border-color: #58a6ff;
        box-shadow: 0 0 0 3px rgba(88,166,255,0.2), inset 0 0 0 1px rgba(88,166,255,0.2);
      }
      .rs-cb-pill-icon  { font-size: 16px; line-height: 1; flex-shrink: 0; }
      .rs-cb-pill-text  { display: flex; flex-direction: column; min-width: 0; }
      .rs-cb-pill-label { font-size: 12px; font-weight: 700; color: #1E3A5F; white-space: nowrap; }
      html.dark-mode .rs-cb-pill-label { color: #e6edf3; }
      .rs-cb-pill-desc  { font-size: 10px; color: #6B8CAE; }
      html.dark-mode .rs-cb-pill-desc { color: #adbac7; }
      .rs-cb-pill.rs-cb-active .rs-cb-pill-label { color: #1D4ED8; }
      html.dark-mode .rs-cb-pill.rs-cb-active .rs-cb-pill-label { color: #79b8ff; }

      .rs-cb-active-check {
        margin-left: auto;
        color: #2563EB;
        font-size: 14px;
        font-weight: 800;
        flex-shrink: 0;
        opacity: 0;
        transform: scale(0);
        transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
      }
      html.dark-mode .rs-cb-active-check { color: #58a6ff; }
      .rs-cb-active .rs-cb-active-check { opacity: 1; transform: scale(1); }

      /* "Off" pill spans full width */
      .rs-cb-pill[data-mode="none"] { grid-column: 1 / -1; }

      .rs-panel-note {
        font-size: 10.5px;
        color: #6B8CAE;
        text-align: center;
        padding: 10px 20px 14px;
        line-height: 1.5;
      }
      html.dark-mode .rs-panel-note { color: #adbac7; }
    `;
    document.head.appendChild(style);
  }

  // ── Inject the FAB + Panel HTML ────────────────────────────────────────────
  function injectUI() {
    const cbPillsHTML = CB_MODES.map(m => `
      <button class="rs-cb-pill${cbMode === m.id ? ' rs-cb-active' : ''}"
              data-mode="${m.id}"
              role="radio"
              aria-checked="${cbMode === m.id}"
              aria-label="${m.label} — ${m.desc}">
        <span class="rs-cb-pill-icon">${m.icon}</span>
        <span class="rs-cb-pill-text">
          <span class="rs-cb-pill-label">${m.label}</span>
          <span class="rs-cb-pill-desc">${m.desc}</span>
        </span>
        <span class="rs-cb-active-check" aria-hidden="true">✓</span>
      </button>
    `).join('');

    const panelHTML = `
      <div id="rs-theme-panel" role="dialog" aria-label="Display preferences" aria-hidden="true">
        <div class="rs-panel-header">
          <div>
            <p class="rs-panel-title">Display Settings</p>
            <p class="rs-panel-subtitle">Adjust for your visual comfort</p>
          </div>
        </div>

        <div class="rs-panel-section">
          <p class="rs-section-label">Brightness</p>
          <div class="rs-toggle-row">
            <div class="rs-toggle-info">
              <span class="rs-toggle-name">Dark Mode</span>
              <span class="rs-toggle-desc">Reduce screen brightness</span>
            </div>
            <button id="rs-dark-toggle"
                    role="switch"
                    aria-pressed="${isDark}"
                    aria-label="Toggle dark mode">
              <span class="rs-toggle-knob">
                <span class="rs-toggle-icon">${isDark ? '🌙' : '☀️'}</span>
              </span>
            </button>
          </div>
        </div>

        <div class="rs-panel-section">
          <p class="rs-section-label">Colour Vision</p>
          <div class="rs-cb-grid" role="radiogroup" aria-label="Colour blind mode">
            ${cbPillsHTML}
          </div>
        </div>

        <p class="rs-panel-note">Settings are remembered across sessions</p>
      </div>

      <button id="rs-theme-fab"
              aria-label="Open display settings"
              aria-expanded="false"
              title="Display settings">
        <span class="rs-fab-icon">⚙</span>
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', panelHTML);
  }

  // ── Wire events ────────────────────────────────────────────────────────────
  function wireEvents() {
    document.getElementById('rs-theme-fab').addEventListener('click', e => {
      e.stopPropagation();
      togglePanel();
    });

    document.getElementById('rs-dark-toggle').addEventListener('click', () => {
      isDark = !isDark;
      localStorage.setItem(DARK_KEY, isDark);
      applyDark(isDark);
    });

    document.querySelectorAll('.rs-cb-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        cbMode = pill.dataset.mode;
        localStorage.setItem(CB_KEY, cbMode);
        applyColorblind(cbMode);
      });
    });

    document.addEventListener('click', e => {
      if (panelOpen && !document.getElementById('rs-theme-panel').contains(e.target)) {
        togglePanel();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panelOpen) togglePanel();
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();

    // Only inject the FAB and panel if we are the top-level window.
    // This prevents duplicate icons when pages (like games) are in iframes.
    if (window === window.top) {
      injectUI();
      wireEvents();
    }

    applyDark(isDark);
    applyColorblind(cbMode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();