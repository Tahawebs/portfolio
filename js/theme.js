// Theme handling — persisted in localStorage, respects OS preference on first visit.
(function () {
  const STORAGE_KEY = 'mt-portfolio-theme';

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Apply immediately to avoid flash of wrong theme.
  applyTheme(getPreferredTheme());

  window.addEventListener('DOMContentLoaded', () => {
    const verMeta = document.querySelector('meta[name="app-version"]');
    const verEl = document.getElementById('footer-version');
    if (verMeta && verEl && verMeta.content) verEl.textContent = `v${verMeta.content}`;
  });

  window.addEventListener('DOMContentLoaded', () => {
    const toggleBtns = document.querySelectorAll('[data-theme-toggle]');
    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
      });
    });

    const navToggle = document.querySelector('[data-nav-toggle]');
    const navLinks = document.querySelector('[data-nav-links]');
    if (navToggle && navLinks) {
      const setOpen = (isOpen) => {
        navLinks.classList.toggle('open', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
      };
      navToggle.addEventListener('click', () => setOpen(!navLinks.classList.contains('open')));
      navLinks.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => setOpen(false))
      );
      setOpen(false);
    }

    // "Home" points at index.html, which forces a full reload even when
    // already on the homepage — unlike the other nav links, which smoothly
    // scroll to their in-page anchor. Match that behavior when we're
    // already home.
    const path = location.pathname;
    const onHomePage = path.endsWith('index.html') || path === '/' || path.endsWith('/');
    if (onHomePage && navLinks) {
      const homeLink = navLinks.querySelector('a[href="index.html"], a[href="./index.html"], a[href="/"]');
      if (homeLink) {
        homeLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }

    // reveal-on-scroll
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('in'));
    }

    // animate skill bars when visible
    const bars = document.querySelectorAll('.skill-bar-fill');
    if ('IntersectionObserver' in window && bars.length) {
      const io2 = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.width = entry.target.dataset.value + '%';
              io2.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      bars.forEach((el) => io2.observe(el));
    } else {
      bars.forEach((el) => (el.style.width = el.dataset.value + '%'));
    }
  });
})();
