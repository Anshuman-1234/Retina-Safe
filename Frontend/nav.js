/**
 * RetinaSafe — nav.js (fixed)
 * Injects the top nav into every page automatically.
 * Fixed: nav no longer double-injects on screening.html which already
 * has a static nav-wrapper; it only replaces pages that don't have one.
 * Also fixed alignment: nav uses justify-content:space-between so
 * brand / links / actions are always in correct positions.
 */
(function injectNav() {
  'use strict';

  const currentPage = location.pathname.split('/').pop() || 'index.html';

  const pages = [
    { href: 'index.html',    label: 'Home' },
    { href: 'screening.html', label: 'Screening' },
    { href: 'dashboard.html', label: 'Dashboard' },
  ];

  const linksHTML = pages.map(p => {
    const active = p.href === currentPage ? ' nav-link-active' : '';
    return `<li><a href="${p.href}" class="nav-link${active}">${p.label}</a></li>`;
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
      <span class="nav-disclaimer-pill" aria-label="Disclaimer">Screening tool only — not a diagnosis</span>
      <a href="screening.html" class="btn btn-primary btn-sm">Start Screening</a>
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
