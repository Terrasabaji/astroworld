/**
 * Astro World — shared branding for embedded HTML modules.
 * Injects logo bar, favicon, title prefix, and developer credit.
 */
(function () {
  var APP = 'Astro World';
  var TAG = 'Complete Vedic & KP Astrology Suite';
  var DEV = 'Dr. Anil Sabaji';
  var EMAIL = 'anilsabaji@gmail.com';
  var ICON = (function () {
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/astro-world-brand\.js.*$/, 'astro-world-brand-icon.svg');
    return '/modules/astro-world-brand-icon.svg';
  })();

  if (!document.querySelector('link[rel="icon"]')) {
    var link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = ICON;
    document.head.appendChild(link);
  }

  if (!document.querySelector('link[href*="astro-world-brand.css"]')) {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = ICON.replace('astro-world-brand-icon.svg', 'astro-world-brand.css');
    document.head.appendChild(css);
  }

  if (document.title.indexOf(APP) !== 0) {
    document.title = APP + ' · ' + document.title;
  }

  if (!document.getElementById('aw-brand-bar')) {
    var bar = document.createElement('div');
    bar.id = 'aw-brand-bar';
    bar.className = 'aw-brand-bar';
    bar.innerHTML =
      '<img src="' + ICON + '" alt="" width="32" height="32" />' +
      '<span class="aw-brand-name">' + APP + '</span>' +
      '<span class="aw-brand-tag">' + TAG + '</span>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function ensureCredit() {
    if (document.querySelector('.aw-developer-credit, .dev-credit, .footer-credit, .app-footer, .credit')) return;
    var el = document.createElement('p');
    el.className = 'aw-developer-credit';
    el.innerHTML = APP + ' · Developed by <strong>' + DEV + '</strong> · <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>';
    document.body.appendChild(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCredit);
  } else {
    ensureCredit();
  }

  window.ASTRO_WORLD_BRAND = { APP: APP, DEV: DEV, EMAIL: EMAIL, ICON: ICON };
})();
