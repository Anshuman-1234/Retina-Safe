/* ============================================================
   RetinaSafe — main.js
   Interactions, animations, scroll behaviour
   ============================================================ */


'use strict';


// 1. SCROLL-TRIGGERED FADE-UP ANIMATIONS
// ============================================================
(function initFadeUp() {
  const elements = document.querySelectorAll('.fade-up');
  if (!elements.length) return;


  // Respect reduced motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }


  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1,
  };


  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);


  elements.forEach(el => observer.observe(el));
})();




// 2. SMOOTH SCROLLING FOR ANCHOR LINKS
// ============================================================
(function initSmoothScroll() {
  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;


    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;


    const target = document.querySelector(targetId);
    if (!target) return;


    e.preventDefault();


    const navHeight = document.querySelector('.nav-wrapper')?.offsetHeight || 70;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;


    window.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });


    // Move focus to target for accessibility
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
})();




// 3. ACTIVE NAV LINK HIGHLIGHTING
// ============================================================
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;


  const navHeight = document.querySelector('.nav-wrapper')?.offsetHeight || 70;


  function updateActiveLink() {
    let currentId = '';


    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY >= sectionTop - navHeight - 40) {
        currentId = section.id;
      }
    });


    navLinks.forEach(link => {
      link.classList.remove('nav-link-active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('nav-link-active');
      }
    });
  }


  // Throttle scroll handler
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveLink();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });


  updateActiveLink();
})();




// 4. NAV SCROLL SHADOW
// ============================================================
(function initNavShadow() {
  const nav = document.querySelector('.nav-wrapper');
  if (!nav) return;


  function updateNav() {
    if (window.scrollY > 10) {
      nav.style.boxShadow = '0 2px 20px rgba(30, 58, 95, 0.10)';
    } else {
      nav.style.boxShadow = 'none';
    }
  }


  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
})();




// 5. IRIS PARALLAX ON HERO
// ============================================================
(function initIrisParallax() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;


  const irisBody = document.querySelector('.iris-body');
  if (!irisBody) return;


  document.addEventListener('mousemove', (e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 8;
    const y = (e.clientY / innerHeight - 0.5) * 8;
    irisBody.style.transform = `translate(${x}px, ${y}px)`;
  });
})();




// 6. DYNAMIC YEAR IN FOOTER
// ============================================================
(function updateYear() {
  const yearEls = document.querySelectorAll('[data-year]');
  const year = new Date().getFullYear();
  yearEls.forEach(el => { el.textContent = year; });
})();




// 7. ACTIVE NAV LINK STYLE INJECTION
// ============================================================
(function injectNavActiveStyle() {
  const style = document.createElement('style');
  style.textContent = `
    .nav-link-active {
      color: var(--blue-600) !important;
      background-color: var(--blue-50) !important;
    }
  `;
  document.head.appendChild(style);
})();

