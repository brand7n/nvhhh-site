// swup page transitions (fade between pages).
// Static pages remain the source of truth; swup intercepts internal links,
// fetches the target page, swaps #main, and animates the transition.
(function () {
  if (!window.Swup || !window.SwupFadeTheme) return;
  var swup = new Swup({
    containers: ['#main'],
    plugins: [new SwupFadeTheme({ mainElement: '#main' })]
  });
  swup.hooks.on('page:view', function () {
    // active nav link
    var file = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      var active = a.getAttribute('href') === file;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    // re-render calendar if the new page has one
    if (window.NVHHH_CALENDAR_INIT) window.NVHHH_CALENDAR_INIT();
  });
})();
