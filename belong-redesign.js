'use strict';
// Delegated controls survive the original app's screen restoration.
(() => {
  let paused = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const activeHeader = () => document.querySelector('.screen:not([hidden]) .design-navigation');
  function syncMotion() {
    const home = document.querySelector('.belong-home');
    if (!home) return;
    home.classList.toggle('motion-paused', paused);
    const button = home.querySelector('.motion-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Resume portrait animation' : 'Pause portrait animation');
      button.querySelector('span').textContent = paused ? 'Resume motion' : 'Pause motion';
      button.querySelector('svg').innerHTML = paused ? '<path d="m7 4 9 6-9 6Z" fill="currentColor"/>' : '<path d="M7 5v10M13 5v10" stroke="currentColor" stroke-width="2"/>';
    }
  }
  function closeMenu() {
    const header = activeHeader();
    if (!header) return;
    header.removeAttribute('data-open');
    const toggle = header.querySelector('.home-menu-toggle');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  }
  document.addEventListener('click', event => {
    const toggle = event.target.closest('.home-menu-toggle');
    if (toggle) {
      const header = toggle.closest('.design-navigation');
      const open = header.toggleAttribute('data-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (open && event.detail === 0) header.querySelector('[data-nav]')?.focus();
      return;
    }
    if (event.target.closest('.motion-toggle')) {
      paused = !paused;
      syncMotion();
    }
    const discover = event.target.closest('[data-scroll-courses]');
    if (discover) {
      event.preventDefault();
      // Keep the learning router's hash intact.
      const courses = document.getElementById('courses');
      courses?.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
      const title = document.getElementById('curriculum-title');
      title?.setAttribute('tabindex', '-1');
      title?.focus({ preventScroll: true });
    }
    const backHome = event.target.closest('[data-scroll-home]');
    if (backHome) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      const heading = document.querySelector('.belong-home h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    }
    if (!event.target.closest('.design-navigation') || event.target.closest('[data-nav]')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeHeader()?.hasAttribute('data-open')) {
      closeMenu();
      activeHeader()?.querySelector('.home-menu-toggle')?.focus();
    }
    if (event.key === 'Tab') {
      const header = activeHeader();
      if (!header?.hasAttribute('data-open')) return;
      const nodes = [...header.querySelectorAll('[data-nav], .home-menu-toggle')].filter(n => n.tabIndex >= 0 && n.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  // The existing router writes the current route here after restoring a screen.
  new MutationObserver(syncMotion).observe(document.documentElement, { attributes: true, attributeFilter: ['data-screen'] });
  document.addEventListener('visibilitychange', () => {
    document.querySelector('.belong-home')?.classList.toggle('motion-paused', document.hidden || paused);
  });
  syncMotion();
})();
