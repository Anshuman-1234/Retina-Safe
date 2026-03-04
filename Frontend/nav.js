/**
 * RetinaSafe — nav.js (fixed)
 * Injects the top nav into every page automatically.
 * Fixed: nav no longer double-injects on screening.html which already
 * has a static nav-wrapper; it only replaces pages that don't have one.
 * Also fixed alignment: nav uses justify-content:space-between so
 * brand / links / actions are always in correct positions.
 */
// Health Check for Backend Status
async function checkBackendHealth() {
  const pill = document.getElementById('backend-status-pill');
  if (!pill) return;

  try {
    // Use the API Bridge health check
    const data = await window.RetinaSafeAPI.healthCheck();
    if (data.status === 'healthy' || data.status === 'ok') {
      pill.textContent = 'AI Backend: Online';
      pill.style.background = '#ecfdf5';
      pill.style.color = '#059669';
    } else {
      throw new Error();
    }
  } catch (e) {
    pill.textContent = 'AI Backend: Offline';
    pill.style.background = '#fef2f2';
    pill.style.color = '#dc2626';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Check health on load and every 10 seconds
  if (window.RetinaSafeAPI) {
    checkBackendHealth();
    setInterval(checkBackendHealth, 10000);
  }
});
(function injectNav() {
  'use strict';

  const currentPage = location.pathname.split('/').pop() || 'index.html';

  const pages = [
    { href: 'index.html', label: 'Home' },
    { href: 'screening.html', label: 'Screening' },
    { href: 'dashboard.html', label: 'Dashboard' },
  ];

  const linksHTML = pages.map(p => {
    const active = p.href === currentPage ? ' nav-link-active' : '';
    const i18nKey = p.label.toLowerCase() === 'home' ? 'nav_home' : (p.label.toLowerCase() === 'screening' ? 'nav_screening' : 'nav_dashboard');
    return `<li><a href="${p.href}" class="nav-link${active}" data-i18n="${i18nKey}">${p.label}</a></li>`;
  }).join('');

  const navHTML = `
<header class="nav-wrapper" role="banner">
  <nav class="nav container" aria-label="Main navigation">
    <a href="index.html" class="nav-brand" aria-label="RetinaSafe Home">
      <div class="nav-iris" aria-hidden="true">
        <div class="nav-iris-inner"></div>
        <div class="nav-iris-pupil"></div>
      </div>
      <span class="nav-name">
        <span class="nav-name-dark">Retina</span><span class="nav-name-blue">Safe</span>
      </span>
    </a>
    <ul class="nav-links" role="list">${linksHTML}</ul>
    <div class="nav-actions">
      <div class="lang-selector">
        <select id="lang-select" class="lang-select" aria-label="Select Language">
          <option value="en" selected>English</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="or">ଓଡ଼ିଆ (Odia)</option>
        </select>
      </div>
      <span class="nav-disclaimer-pill" aria-label="Disclaimer" data-i18n="nav_disclaimer">Screening tool only — not a diagnosis</span>
      <a href="screening.html" class="btn btn-primary btn-sm" data-i18n="btn_start_screening">Start Screening</a>
    </div>
  </nav>
</header>`;

  // On screening.html there is already a static nav — skip injection entirely
  // so the progress stepper layout is not disrupted.
  const isScreening = currentPage === 'screening.html';
  if (isScreening) return;

  const existingNav = document.querySelector('.nav-wrapper');
  if (existingNav) {
    existingNav.outerHTML = navHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }

  // Active link style
  if (!document.getElementById('nav-active-style')) {
    const style = document.createElement('style');
    style.id = 'nav-active-style';
    style.textContent = `
      .nav-link-active {
        color: var(--blue-600) !important;
        background-color: var(--blue-50) !important;
      }
    `;
    document.head.appendChild(style);
  }
})();
