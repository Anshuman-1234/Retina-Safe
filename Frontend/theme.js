/**
 * RetinaSafe — theme.js
 * Dark mode + Colorblind mode system
 * Injects a beautiful floating toggle panel into every page
 */
(function RetinaSafeTheme() {
  'use strict';

  // ── Storage keys ──────────────────────────────────────────────────────────
  const DARK_KEY = 'retinasafe_dark';
  const CB_KEY   = 'retinasafe_colorblind';

  // ── Colorblind filter definitions ─────────────────────────────────────────
  const CB_MODES = [
    { id: 'none',         label: 'Off',          icon: '👁',  desc: 'Standard colours' },
    { id: 'protanopia',   label: 'Protanopia',    icon: '🔴',  desc: 'Red-blind' },
    { id: 'deuteranopia', label: 'Deuteranopia',  icon: '🟢',  desc: 'Green-blind' },
    { id: 'tritanopia',   label: 'Tritanopia',    icon: '🔵',  desc: 'Blue-blind' },
    { id: 'achromatopsia',label: 'Greyscale',     icon: '⚫', desc: 'No colour' },
  ];

  // ── Colorblind filter map — using proven SVG feColorMatrix values ──────────
  const CB_MATRICES = {
    none:           null,
    protanopia:     [0.567, 0.433, 0,     0, 0,
                     0.558, 0.442, 0,     0, 0,
                     0,     0.242, 0.758, 0, 0,
                     0,     0,     0,     1, 0],
    deuteranopia:   [0.625, 0.375, 0,   0, 0,
                     0.7,   0.3,   0,   0, 0,
                     0,     0.3,   0.7, 0, 0,
                     0,     0,     0,   1, 0],
    tritanopia:     [0.95,  0.05,  0,     0, 0,
                     0,     0.433, 0.567, 0, 0,
                     0,     0.475, 0.525, 0, 0,
                     0,     0,     0,     1, 0],
    achromatopsia:  [0.299, 0.587, 0.114, 0, 0,
                     0.299, 0.587, 0.114, 0, 0,
                     0.299, 0.587, 0.114, 0, 0,
                     0,     0,     0,     1, 0],
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let isDark = localStorage.getItem(DARK_KEY) === 'true';
  let cbMode = localStorage.getItem(CB_KEY) || 'none';
  let panelOpen = false;

  // ── Ensure a content wrapper exists that we can filter ───────────────────
  // We wrap body children (except the sticky nav) in a div so the colorblind
  // filter never touches the FAB/panel, and crucially never creates a new
  // containing block that would break position:sticky on the nav.
  function ensureContentWrapper() {
  if (document.getElementById('rs-content-wrap')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'rs-content-wrap';
  wrapper.style.cssText = 'min-height:100vh; width:100%; display:block;';

  // The sticky .nav-wrapper MUST stay as a direct body child.
  // Applying a CSS filter to a parent creates a new containing block,
  // which breaks position:sticky on all descendants.
  const navEl = document.querySelector('.nav-wrapper');
  Array.from(document.body.childNodes).forEach(child => {
    if (child !== navEl) wrapper.appendChild(child);
  });
  if (navEl) navEl.after(wrapper);
  else document.body.appendChild(wrapper);

  // Notify other scripts that the DOM has been restructured.
  // main.js fade-up IntersectionObservers lose their targets when nodes
  // are moved, so we dispatch an event to trigger a re-observe.
  document.dispatchEvent(new CustomEvent('rs-dom-wrapped'));
}

  // ── Inject SVG filter into the wrapper ────────────────────────────────────
  function ensureSVGFilter() {
    if (document.getElementById('rs-svg-filters')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'rs-svg-filters';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    svg.innerHTML = '<defs><filter id="rs-cbf" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="linearRGB"><feColorMatrix id="rs-cbf-matrix" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter></defs>';
    const wrap = document.getElementById('rs-content-wrap');
    if (wrap) wrap.insertBefore(svg, wrap.firstChild);
  }

  // ── Apply colorblind filter to content wrapper only ───────────────────────
  function applyColorblindFilter(mode) {
    ensureContentWrapper();
    ensureSVGFilter();

    const matrix = CB_MATRICES[mode];
    const feEl = document.getElementById('rs-cbf-matrix');
    const wrap = document.getElementById('rs-content-wrap');

    if (!matrix || mode === 'none') {
      if (feEl) feEl.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0');
      if (wrap) wrap.style.filter = '';
    } else {
      if (feEl) feEl.setAttribute('values', matrix.join(' '));
      if (wrap) wrap.style.filter = 'url(#rs-cbf)';
    }
  }

  // ── Apply dark mode ────────────────────────────────────────────────────────
  function applyDark(dark) {
    document.documentElement.classList.toggle('dark-mode', dark);
    applyColorblindFilter(cbMode);
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
    });
  }

  // ── Toggle panel open/close ────────────────────────────────────────────────
  function togglePanel() {
    panelOpen = !panelOpen;
    const panel = document.getElementById('rs-theme-panel');
    const fab   = document.getElementById('rs-theme-fab');
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
      /* ── Dark Mode Tokens ──────────────────────────────────── */
      html.dark-mode {
        --page-bg:       #0d1117;
        --white:         #161b22;
        --blue-50:       #0d1f3a;
        --blue-100:      #0f2a4a;
        --blue-200:      #1a3a5c;
        --blue-300:      #234d78;
        --blue-500:      #58a6ff;
        --blue-600:      #79b8ff;
        --blue-700:      #a5c8ff;
        --text-primary:  #e6edf3;
        --text-secondary:#8b949e;
        --text-muted:    #6e7681;
        --text-light:    #484f58;
        --border:        rgba(240,246,252,0.1);
        --border-med:    rgba(240,246,252,0.15);
        --shadow-sm:     0 1px 4px rgba(0,0,0,0.4);
        --shadow-md:     0 4px 20px rgba(0,0,0,0.5);
        --shadow-lg:     0 8px 40px rgba(0,0,0,0.6);
        --warning-bg:    #271c00;
        --warning-border:#5a3e00;
        --warning-text:  #d4a017;
        --warning-strong:#fbbf24;
      }

      html.dark-mode body {
        background-color: var(--page-bg);
        color: var(--text-primary);
      }

      html.dark-mode .nav-wrapper {
        background: rgba(13,17,23,0.92) !important;
        border-bottom-color: rgba(240,246,252,0.1) !important;
      }

      html.dark-mode .nav-name-dark { color: #e6edf3 !important; }

      html.dark-mode .footer {
        background: #0a0e13 !important;
        border-top-color: rgba(240,246,252,0.08) !important;
      }

      html.dark-mode .btn-outline {
        border-color: rgba(240,246,252,0.2) !important;
        color: var(--text-primary) !important;
      }

      html.dark-mode .btn-outline:hover {
        background: rgba(240,246,252,0.08) !important;
      }

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

      html.dark-mode h1, html.dark-mode h2, html.dark-mode h3, html.dark-mode h4 {
        color: var(--text-primary) !important;
      }

      html.dark-mode .risk-card {
        background: #161b22 !important;
      }

      html.dark-mode .game-launch-card {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
        color: var(--text-primary) !important;
      }

      html.dark-mode .game-launch-card:hover {
        background: #1f2937 !important;
        border-color: var(--blue-500) !important;
      }

      html.dark-mode input,
      html.dark-mode select,
      html.dark-mode textarea {
        background: #0d1117 !important;
        color: var(--text-primary) !important;
        border-color: rgba(240,246,252,0.15) !important;
      }

      html.dark-mode .cbar-track { background: rgba(240,246,252,0.08) !important; }
      html.dark-mode .history-item { background: #161b22 !important; border-color: rgba(240,246,252,0.1) !important; }
      html.dark-mode .dash-hero { background: linear-gradient(135deg,#0d1f3a 0%,#0d1117 100%) !important; }

      html.dark-mode .level-low      { color: #34d399 !important; background: rgba(52,211,153,0.15) !important; }
      html.dark-mode .level-moderate { color: #fbbf24 !important; background: rgba(245,158,11,0.15) !important; }
      html.dark-mode .level-high     { color: #f87171 !important; background: rgba(239,68,68,0.15) !important; }

      html.dark-mode .risk-low  .risk-tier-label { color: #34d399 !important; }
      html.dark-mode .risk-mod  .risk-tier-label { color: #fbbf24 !important; }
      html.dark-mode .risk-high .risk-tier-label { color: #f87171 !important; }

      html.dark-mode .badge-low      { background: rgba(52,211,153,0.2) !important; color: #34d399 !important; }
      html.dark-mode .badge-borderline { background: rgba(245,158,11,0.2) !important; color: #fbbf24 !important; }
      html.dark-mode .badge-moderate { background: rgba(245,158,11,0.2) !important; color: #fbbf24 !important; }
      html.dark-mode .badge-high     { background: rgba(239,68,68,0.2) !important; color: #f87171 !important; }
      html.dark-mode .badge-critical { background: rgba(239,68,68,0.3) !important; color: #f87171 !important; }

      html.dark-mode .cbar-name { color: #e6edf3 !important; }
      html.dark-mode .card-title { color: #e6edf3 !important; }
      html.dark-mode .card-sub { color: #8b949e !important; }
      html.dark-mode .dsc-number { color: #e6edf3 !important; }
      html.dark-mode .dsc-label { color: #8b949e !important; }
      html.dark-mode .risk-action { color: #8b949e !important; }
      html.dark-mode .ring-value { color: #e6edf3 !important; }
      html.dark-mode .ring-label { color: #8b949e !important; }
      html.dark-mode .ring-track { stroke: rgba(240,246,252,0.1) !important; }
      html.dark-mode .glc-title { color: #e6edf3 !important; }
      html.dark-mode .glc-tag { color: #8b949e !important; }
      html.dark-mode .glc-num { color: rgba(240,246,252,0.2) !important; }

      /* Transition for smooth theme switching */
      .dash-card, .nav-wrapper, .footer, .game-launch-card,
      .dash-stat-card, .risk-card, .history-item, .cbar-track {
        transition: background-color 0.35s ease, border-color 0.35s ease, color 0.2s ease !important;
      }
      body {
        transition: background-color 0.35s ease, color 0.2s ease !important;
      }

      /* ── FAB Button ────────────────────────────────────────── */
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

      /* ── Panel ─────────────────────────────────────────────── */
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
      html.dark-mode .rs-panel-header {
        border-bottom-color: rgba(240,246,252,0.08);
      }
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
      html.dark-mode .rs-panel-subtitle { color: #8b949e; }

      .rs-panel-section {
        padding: 14px 20px;
        border-bottom: 1px solid rgba(0,0,0,0.05);
      }
      html.dark-mode .rs-panel-section {
        border-bottom-color: rgba(240,246,252,0.06);
      }
      .rs-panel-section:last-child { border-bottom: none; }

      .rs-section-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: #6B8CAE;
        margin-bottom: 10px;
      }
      html.dark-mode .rs-section-label { color: #8b949e; }

      /* ── Dark Toggle Switch ────────────────────────────────── */
      .rs-toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .rs-toggle-info {
        display: flex;
        flex-direction: column;
      }
      .rs-toggle-name {
        font-size: 14px;
        font-weight: 600;
        color: #1E3A5F;
      }
      html.dark-mode .rs-toggle-name { color: #e6edf3; }
      .rs-toggle-desc {
        font-size: 11px;
        color: #6B8CAE;
      }
      html.dark-mode .rs-toggle-desc { color: #8b949e; }

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
      #rs-dark-toggle:focus-visible {
        box-shadow: 0 0 0 3px rgba(59,130,246,0.4);
      }
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

      /* ── Colorblind Pills ──────────────────────────────────── */
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
      html.dark-mode .rs-cb-pill:hover {
        background: #0d1f3a;
      }
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
      .rs-cb-pill-icon {
        font-size: 16px;
        line-height: 1;
        flex-shrink: 0;
      }
      .rs-cb-pill-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .rs-cb-pill-label {
        font-size: 12px;
        font-weight: 700;
        color: #1E3A5F;
        white-space: nowrap;
      }
      html.dark-mode .rs-cb-pill-label { color: #e6edf3; }
      .rs-cb-pill-desc {
        font-size: 10px;
        color: #6B8CAE;
      }
      html.dark-mode .rs-cb-pill-desc { color: #8b949e; }
      .rs-cb-pill.rs-cb-active .rs-cb-pill-label {
        color: #1D4ED8;
      }
      html.dark-mode .rs-cb-pill.rs-cb-active .rs-cb-pill-label {
        color: #79b8ff;
      }
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
      .rs-cb-active .rs-cb-active-check {
        opacity: 1;
        transform: scale(1);
      }

      /* "Off" pill spans full width */
      .rs-cb-pill[data-mode="none"] {
        grid-column: 1 / -1;
      }

      /* ── Panel footer note ─────────────────────────────────── */
      .rs-panel-note {
        font-size: 10.5px;
        color: #6B8CAE;
        text-align: center;
        padding: 10px 20px 14px;
        line-height: 1.5;
      }
      html.dark-mode .rs-panel-note { color: #8b949e; }

      /* ================================================================
         DARK MODE — COMPREHENSIVE CONTRAST FIXES
         Audited against WCAG AA (4.5:1 text / 3:1 UI elements).
         ================================================================ */

      /* ── Token corrections ───────────────────────────────────────
         --blue-200 (#1a3a5c) and --blue-300 (#234d78) are near-black;
         used as borders/text on #161b22 card surfaces = invisible.
         --text-muted (#6e7681) fails 4.5:1 on #161b22 (≈2.8:1).       */
      html.dark-mode {
        --blue-200:      #1e4a7a;
        --blue-300:      #5a96d4;
        --blue-400:      #79b1f5;
        --text-muted:    #8d99a6;
        --text-secondary:#b0bec9;
      }

      /* ── Screening page background ───────────────────────────── */
      html.dark-mode .screening-page { background-color: #0a0e14 !important; }

      /* ── Nav links ───────────────────────────────────────────── */
      html.dark-mode .nav-link { color: #b0bec9 !important; }
      html.dark-mode .nav-link:hover,
      html.dark-mode .nav-link-active {
        color: #90caff !important;
        background: rgba(144,202,255,0.08) !important;
      }

      /* ── Progress stepper ────────────────────────────────────── */
      html.dark-mode .progress-bar-wrapper {
        background: #161b22 !important;
        border-bottom-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .pstep-dot {
        background: #1c2533 !important;
        border-color: rgba(144,202,255,0.3) !important;
      }
      html.dark-mode .progress-step.ps-active .pstep-dot {
        background: linear-gradient(135deg, #2563eb, #4f8ef7) !important;
        border-color: transparent !important;
        box-shadow: 0 8px 24px rgba(37,99,235,0.45) !important;
      }
      html.dark-mode .progress-step.ps-active .pstep-number { color: #fff !important; }
      html.dark-mode .progress-step.ps-active .pstep-label  { color: #90caff !important; }
      html.dark-mode .progress-step.ps-done .pstep-label    { color: #8d99a6 !important; }
      html.dark-mode .progress-connector                     { background: rgba(240,246,252,0.1) !important; }
      html.dark-mode .progress-connector.pc-done             { background: #34d399 !important; }

      /* ── Step text ───────────────────────────────────────────── */
      html.dark-mode .step-title { color: #e6edf3 !important; }
      html.dark-mode .step-desc  { color: #b0bec9 !important; }
      html.dark-mode .eyebrow    { color: #90caff !important; }

      /* ── Forms ───────────────────────────────────────────────── */
      html.dark-mode .form-label  { color: #e6edf3 !important; }
      html.dark-mode .form-legend { color: #e6edf3 !important; }
      html.dark-mode .form-fieldset {
        background: #0d1117 !important;
        border-color: rgba(240,246,252,0.12) !important;
      }
      html.dark-mode .checkbox-text { color: #b0bec9 !important; }

      /* ── Upload area ─────────────────────────────────────────── */
      html.dark-mode .upload-area {
        background: #161b22 !important;
        border-color: rgba(144,202,255,0.3) !important;
      }
      html.dark-mode .upload-area:hover,
      html.dark-mode .upload-area.drag-over {
        border-color: #90caff !important;
        background: #0d1f3a !important;
      }
      html.dark-mode .upload-title   { color: #e6edf3 !important; }
      html.dark-mode .upload-sub     { color: #b0bec9 !important; }
      html.dark-mode .upload-link    { color: #90caff !important; }
      html.dark-mode .upload-formats { color: #8d99a6 !important; }
      html.dark-mode .upload-divider { color: rgba(144,202,255,0.25) !important; }
      html.dark-mode .upload-tips {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .tips-heading   { color: #b0bec9 !important; }
      html.dark-mode .tip-item       { color: #b0bec9 !important; }
      html.dark-mode .tip-check      { color: #90caff !important; }
      html.dark-mode .preview-filename { color: #e6edf3 !important; }
      html.dark-mode .preview-size     { color: #8d99a6 !important; }

      /* ── Warning alert ───────────────────────────────────────── */
      html.dark-mode .warning-alert {
        background: #2a1c00 !important;
        border-color: #7a5800 !important;
      }
      html.dark-mode .warning-alert-content h4 { color: #fde68a !important; }
      html.dark-mode .warning-alert-content p  { color: #fcd34d !important; }

      /* ── Upload-empty validation alert ──────────────────────── */
      html.dark-mode .upload-empty-alert {
        background: rgba(239,68,68,0.12) !important;
        border-color: rgba(248,113,113,0.45) !important;
      }
      html.dark-mode .upload-empty-alert strong { color: #fca5a5 !important; }
      html.dark-mode .upload-empty-alert span   { color: #f87171 !important; }

      /* ── Disclaimer banner ───────────────────────────────────── */
      html.dark-mode .disclaimer-banner {
        background: #2a1c00 !important;
        border-color: #7a5800 !important;
        color: #fcd34d !important;
      }
      html.dark-mode .disclaimer-banner strong { color: #fde68a !important; }

      /* ── Game cards ──────────────────────────────────────────── */
      html.dark-mode .gc-card {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .gc-card:hover {
        border-color: rgba(144,202,255,0.35) !important;
      }
      html.dark-mode .gc-num        { color: rgba(144,202,255,0.38) !important; }
      html.dark-mode .gc-title      { color: #e6edf3 !important; }
      html.dark-mode .gc-desc       { color: #b0bec9 !important; }
      html.dark-mode .gc-detects-tag {
        color: #90caff !important;
        background: rgba(144,202,255,0.1) !important;
        border-color: rgba(144,202,255,0.25) !important;
      }
      html.dark-mode .gc-spec {
        color: #8d99a6 !important;
        background: rgba(240,246,252,0.05) !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .gc-card-footer {
        background: #0d1117 !important;
        border-top-color: rgba(240,246,252,0.08) !important;
      }
      html.dark-mode .gc-card.gc-done .gc-card-footer {
        background: rgba(52,211,153,0.05) !important;
        border-top-color: rgba(52,211,153,0.15) !important;
      }
      html.dark-mode .gc-card.gc-done { border-color: rgba(52,211,153,0.2) !important; }
      html.dark-mode .gc-score-label  { color: #8d99a6 !important; }
      html.dark-mode .gc-score-value  { color: #90caff !important; }
      html.dark-mode .gc-done-badge {
        color: #34d399 !important;
        background: rgba(52,211,153,0.15) !important;
        border-color: rgba(52,211,153,0.3) !important;
      }
      html.dark-mode .gc-pending-badge {
        color: #8d99a6 !important;
        background: rgba(240,246,252,0.06) !important;
        border-color: rgba(240,246,252,0.13) !important;
      }

      /* ── Games progress bar ──────────────────────────────────── */
      html.dark-mode .gpr-bar-wrap { background: rgba(240,246,252,0.08) !important; }
      html.dark-mode .gpr-label    { color: #8d99a6 !important; }

      /* ── Buttons ─────────────────────────────────────────────── */
      html.dark-mode .btn-primary {
        background: linear-gradient(135deg,#1d4ed8,#2563eb) !important;
        color: #fff !important;
      }
      html.dark-mode .btn-primary:hover {
        background: linear-gradient(135deg,#1e40af,#1d4ed8) !important;
      }
      html.dark-mode .btn-outline {
        border-color: rgba(144,202,255,0.35) !important;
        color: #90caff !important;
        background: transparent !important;
      }
      html.dark-mode .btn-outline:hover {
        border-color: #90caff !important;
        background: rgba(144,202,255,0.08) !important;
        color: #b8d8ff !important;
      }

      /* ── Report section ──────────────────────────────────────── */
      html.dark-mode #report-loading {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .report-loading-text        { color: #b0bec9 !important; }
      html.dark-mode .report-loading-text strong { color: #e6edf3 !important; }
      html.dark-mode .report-score-card {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .rsc-label        { color: #8d99a6 !important; }
      html.dark-mode .rsc-score        { color: #90caff !important; }
      html.dark-mode .rsc-action-label { color: #8d99a6 !important; }
      html.dark-mode .rsc-action       { color: #e6edf3 !important; }
      html.dark-mode .report-section-title { color: #e6edf3 !important; }
      html.dark-mode .disease-card {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.08) !important;
      }
      html.dark-mode .dc-name    { color: #e6edf3 !important; }
      html.dark-mode .dc-bottom  { color: #8d99a6 !important; }
      html.dark-mode .dc-bar-wrap { background: rgba(240,246,252,0.06) !important; }
      html.dark-mode .report-disclaimer {
        background: #2a1c00 !important;
        border-color: #7a5800 !important;
      }
      html.dark-mode .report-disclaimer p      { color: #fcd34d !important; }
      html.dark-mode .report-disclaimer strong { color: #fde68a !important; }

      /* ── Risk badges ─────────────────────────────────────────── */
      html.dark-mode .badge-low        { background: rgba(52,211,153,0.18)  !important; color: #34d399 !important; }
      html.dark-mode .badge-borderline { background: rgba(251,191,36,0.18)  !important; color: #fbbf24 !important; }
      html.dark-mode .badge-moderate   { background: rgba(251,191,36,0.18)  !important; color: #fbbf24 !important; }
      html.dark-mode .badge-high       { background: rgba(248,113,113,0.18) !important; color: #f87171 !important; }
      html.dark-mode .badge-critical   { background: rgba(248,113,113,0.25) !important; color: #fca5a5 !important; }
      html.dark-mode .badge-done       { background: rgba(52,211,153,0.18)  !important; color: #34d399 !important; }
      html.dark-mode .badge-pending    { background: rgba(240,246,252,0.06) !important; color: #8d99a6 !important; }

      /* ── Toast ───────────────────────────────────────────────── */
      html.dark-mode .rs-toast {
        background: #1e3a5f !important;
        color: #e6edf3 !important;
        border: 1px solid rgba(144,202,255,0.2) !important;
      }

      /* ── Game modal ──────────────────────────────────────────── */
      html.dark-mode .game-modal-header { background: #0a0e14 !important; }
      html.dark-mode .game-modal-title  { color: #e6edf3 !important; }
      html.dark-mode .game-modal-tag {
        color: #90caff !important;
        background: rgba(144,202,255,0.1) !important;
        border-color: rgba(144,202,255,0.2) !important;
      }
      html.dark-mode .game-modal-body { background: #161b22 !important; }

      /* ── Footer ──────────────────────────────────────────────── */
      html.dark-mode .footer-col-heading { color: #e6edf3 !important; }
      html.dark-mode .footer-link        { color: #8d99a6 !important; }
      html.dark-mode .footer-link:hover  { color: #90caff !important; }
      html.dark-mode .footer-tagline,
      html.dark-mode .footer-disclaimer,
      html.dark-mode .footer-copyright   { color: #5c6672 !important; }

      /* ── Landing page ────────────────────────────────────────── */
      html.dark-mode .hero-section     { background: #0d1117 !important; }
      html.dark-mode .hero-heading     { color: #e6edf3 !important; }
      html.dark-mode .hero-heading em  { color: #90caff !important; }
      html.dark-mode .hero-description { color: #b0bec9 !important; }
      html.dark-mode .hero-trust-item  { color: #8d99a6 !important; }
      html.dark-mode .trust-check      { color: #34d399 !important; }
      html.dark-mode .condition-card {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.08) !important;
      }
      html.dark-mode .condition-name        { color: #e6edf3 !important; }
      html.dark-mode .condition-description { color: #b0bec9 !important; }
      html.dark-mode .condition-tag {
        color: #8d99a6 !important;
        background: rgba(240,246,252,0.05) !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .pipeline-wrapper {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.08) !important;
      }
      html.dark-mode .step-badge {
        background: rgba(144,202,255,0.12) !important;
        color: #90caff !important;
      }
      html.dark-mode .step-description { color: #b0bec9 !important; }
      html.dark-mode .step-tag {
        color: #90caff !important;
        background: rgba(144,202,255,0.08) !important;
        border-color: rgba(144,202,255,0.15) !important;
      }
      html.dark-mode .step-time { color: #8d99a6 !important; }
      html.dark-mode .game-card {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.08) !important;
      }
      html.dark-mode .section-eyebrow  { color: #90caff !important; }
      html.dark-mode .section-heading  { color: #e6edf3 !important; }
      html.dark-mode .section-lead     { color: #b0bec9 !important; }
      html.dark-mode .checklist-panel {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.08) !important;
      }
      html.dark-mode .checklist-item   { color: #b0bec9 !important; }
      html.dark-mode .check            { color: #34d399 !important; }
      html.dark-mode .card-description { color: #b0bec9 !important; }

      /* ================================================================
         DARK MODE — GAME PAGES
         Covers: contrast game, color hue, peripheral tester, amsler grid
         ================================================================ */

      /* ── Shared game body / background ───────────────────────────── */
      html.dark-mode body {
        background-color: #0d1117 !important;
        color: #e6edf3 !important;
      }

      /* ── Contrast Discrimination Challenge ───────────────────────── */
      /* HUD pills: white pill on grey bg becomes invisible in dark mode */
      html.dark-mode .hud-pill {
        background: rgba(22, 27, 34, 0.92) !important;
        border-color: rgba(144,202,255,0.25) !important;
        color: #e6edf3 !important;
      }
      html.dark-mode .hud-pill .label { color: #8d99a6 !important; }
      /* Glass panels (start/results overlays) */
      html.dark-mode .glass-panel {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
        color: #e6edf3 !important;
      }
      html.dark-mode .glass-panel h1 { color: #e6edf3 !important; }
      html.dark-mode .glass-panel p  { color: #b0bec9 !important; }
      html.dark-mode .glass-panel p strong { color: #e6edf3 !important; }
      /* Overlay backdrop */
      html.dark-mode .overlay {
        background-color: rgba(0, 0, 0, 0.65) !important;
      }
      /* Results container */
      html.dark-mode .results-container {
        background: #0d1f3a !important;
        border-color: rgba(144,202,255,0.2) !important;
      }
      html.dark-mode .results-container h2 { color: #e6edf3 !important; }
      html.dark-mode .result-row {
        border-bottom-color: rgba(240,246,252,0.08) !important;
      }
      html.dark-mode .result-label { color: #8d99a6 !important; }
      html.dark-mode .result-value { color: #e6edf3 !important; }
      html.dark-mode .result-score { color: #90caff !important; }
      html.dark-mode .result-footnote { color: #6e7681 !important; }
      /* Medical disclaimer in game */
      html.dark-mode .medical-disclaimer {
        background: #271c00 !important;
        border-color: #7a5800 !important;
        color: #fcd34d !important;
      }
      html.dark-mode .medical-disclaimer strong { color: #fde68a !important; }

      /* ── Color Hue Sorting Game ───────────────────────────────────── */
      html.dark-mode #game-container {
        background: #0d1117 !important;
      }
      html.dark-mode #top-bar {
        background: #161b22 !important;
        border-bottom-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .stat-item {
        background: rgba(240,246,252,0.06) !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .stat-label { color: #8d99a6 !important; }
      html.dark-mode .stat-value { color: #e6edf3 !important; }
      html.dark-mode #timer-bar-container {
        background: rgba(240,246,252,0.08) !important;
      }
      /* Game tile board */
      html.dark-mode #board-container {
        background: #161b22 !important;
      }
      /* Result/modal panels */
      html.dark-mode #result-modal,
      html.dark-mode #start-modal {
        background: rgba(0,0,0,0.75) !important;
      }
      html.dark-mode .modal-card,
      html.dark-mode .result-card {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
        color: #e6edf3 !important;
      }
      html.dark-mode .modal-card h1,
      html.dark-mode .modal-card h2,
      html.dark-mode .result-card h2 { color: #e6edf3 !important; }
      html.dark-mode .modal-card p,
      html.dark-mode .result-card p  { color: #b0bec9 !important; }
      html.dark-mode .result-stat-card {
        background: #0d1117 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .result-stat-card .rsc-label { color: #8d99a6 !important; }
      html.dark-mode .result-stat-card .rsc-value { color: #e6edf3 !important; }
      html.dark-mode .result-score-ring .track { stroke: rgba(240,246,252,0.1) !important; }
      html.dark-mode .result-score-number .value { color: #e6edf3 !important; }
      html.dark-mode .result-score-number .label { color: #8d99a6 !important; }
      /* Score ring overlay bg */
      html.dark-mode .score-ring-bg { background: #161b22 !important; }
      /* Flag/warning in result */
      html.dark-mode .flag-box {
        background: rgba(245,158,11,0.15) !important;
        border-color: rgba(245,158,11,0.3) !important;
        color: #fbbf24 !important;
      }
      /* Gray variables override for hue game */
      html.dark-mode #game-container,
      html.dark-mode #game-container * {
        --gray-100: #161b22;
        --gray-200: rgba(240,246,252,0.1);
        --gray-400: #6e7681;
        --gray-500: #8d99a6;
        --gray-600: #b0bec9;
        --gray-700: #c9d1d9;
        --gray-800: #e6edf3;
        --gray-900: #f0f6fc;
        --white: #161b22;
        --bg: #0d1117;
        --surface: #161b22;
      }

      /* ── Peripheral Reaction Tester ──────────────────────────────── */
      html.dark-mode #game-area {
        background: radial-gradient(ellipse at 50% 0%, #0d1f3a 0%, transparent 60%),
                    linear-gradient(180deg, #0d1117 0%, #0a0e13 100%) !important;
      }
      html.dark-mode #game-area::before {
        opacity: 0.08 !important;
        background-image:
          linear-gradient(rgba(240,246,252,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(240,246,252,0.15) 1px, transparent 1px) !important;
      }
      html.dark-mode #hud {
        background: rgba(22, 27, 34, 0.88) !important;
        border-color: rgba(240,246,252,0.12) !important;
        color: #e6edf3 !important;
      }
      html.dark-mode #hud .hud-divider { background: rgba(240,246,252,0.12) !important; }
      html.dark-mode #hud .hud-label   { color: #8d99a6 !important; }
      html.dark-mode #hud .hud-value   { color: #e6edf3 !important; }
      /* Modals */
      html.dark-mode #intro-modal,
      html.dark-mode #results-modal {
        background: rgba(0, 0, 0, 0.8) !important;
      }
      html.dark-mode .modal-box {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
        box-shadow: 0 25px 60px rgba(0,0,0,0.6) !important;
      }
      html.dark-mode .modal-box h1,
      html.dark-mode .modal-box h2 { color: #e6edf3 !important; }
      html.dark-mode .modal-box p   { color: #b0bec9 !important; }
      html.dark-mode .modal-box li  { color: #b0bec9 !important; }
      html.dark-mode .result-grid-cell {
        background: #0d1117 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .result-grid-cell .zone-name { color: #8d99a6 !important; }
      html.dark-mode .result-grid-cell .zone-score { color: #e6edf3 !important; }
      html.dark-mode .result-summary {
        background: #0d1117 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .result-summary .summary-label { color: #8d99a6 !important; }
      html.dark-mode .result-summary .summary-value { color: #e6edf3 !important; }
      /* Peripheral game variables override */
      html.dark-mode #game-area,
      html.dark-mode #intro-modal,
      html.dark-mode #results-modal {
        --gray-50:  #0a0e13;
        --gray-100: #161b22;
        --gray-200: rgba(240,246,252,0.1);
        --gray-300: rgba(240,246,252,0.15);
        --gray-500: #8d99a6;
        --gray-700: #c9d1d9;
        --gray-900: #e6edf3;
        --white:    #161b22;
      }

      /* ── Dynamic Amsler Grid ──────────────────────────────────────── */
      html.dark-mode .amsler-page,
      html.dark-mode .page-wrapper {
        background: #0d1117 !important;
      }
      html.dark-mode .site-header {
        background: #161b22 !important;
        border-bottom-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .instructions-panel {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
        color: #b0bec9 !important;
      }
      html.dark-mode .instructions-panel h2 { color: #e6edf3 !important; }
      html.dark-mode .score-display {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .score-label  { color: #8d99a6 !important; }
      html.dark-mode .score-value  { color: #90caff !important; }
      html.dark-mode .controls-bar {
        background: #161b22 !important;
        border-color: rgba(240,246,252,0.1) !important;
      }
      html.dark-mode .mode-label { color: #b0bec9 !important; }
      html.dark-mode .mode-label.active { color: #90caff !important; }
      html.dark-mode .site-footer {
        background: #0a0e13 !important;
        border-top-color: rgba(240,246,252,0.08) !important;
        color: #6e7681 !important;
      }

      /* ── Smooth transition for game page backgrounds ──────────────── */
      body, #game-container, #game-area, #hud,
      .glass-panel, .hud-pill, .modal-box, .modal-card,
      .result-card, .stat-item, .results-container {
        transition: background-color 0.3s ease, color 0.2s ease, border-color 0.25s ease !important;
      }

      /* ── Prevent white flash on initial dark mode load ───────────── */
      html.dark-mode-preload body,
      html.dark-mode-preload #game-container,
      html.dark-mode-preload #game-area {
        transition: none !important;
      }
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
        document.querySelectorAll('.rs-cb-pill').forEach(p => {
          p.setAttribute('aria-checked', p.dataset.mode === cbMode);
        });
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
    // Suppress transitions during initial dark-mode application to prevent flash
    document.documentElement.classList.add('dark-mode-preload');
    injectStyles();
    ensureContentWrapper();
    injectUI();
    wireEvents();
    applyDark(isDark);
    applyColorblind(cbMode);

    const knob = document.querySelector('.rs-toggle-knob');
    if (knob) {
      knob.style.transform = isDark ? 'translateX(26px)' : 'translateX(2px)';
    }

    // Re-enable transitions after first paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('dark-mode-preload');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();