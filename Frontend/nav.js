/**
 * RetinaSafe — Shared Navigation
 * Injects the top nav into every page automatically.
 */
(function injectNav() {
  const currentPage = location.pathname.split('/').pop() || 'index.html';

  const pages = [
    { href: 'index.html',                          label: 'Home' },
    { href: 'screening.html',                      label: 'Screening' },
    { href: 'dashboard.html',                      label: 'Dashboard' },
    { href: 'contrast_discrimination_challenge.html', label: 'Contrast Test' },
    { href: 'dynamic_amsler_grid.html',            label: 'Amsler Grid' },
    { href: 'peripheral_reaction_tester.html',     label: 'Peripheral Test' },
    { href: 'color_hue_sorting.html',              label: 'Hue Sorting' },
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

  // Inject before first child of body, but after any existing nav-wrapper
  const existingNav = document.querySelector('.nav-wrapper');
  if (existingNav) {
    existingNav.outerHTML = navHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }

  // Inject active nav link style if not already present
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