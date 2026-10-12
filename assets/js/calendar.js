// NVHHH calendar: "next 10 trails" list (mobile + desktop).
// Exposes NVHHH_CALENDAR_INIT so the client-side router can re-render
// after swapping in the calendar page.
(function () {
  var CAL_ID = '55k6rnam11akkav5vljqlsc6lo@group.calendar.google.com';
  var API_KEY = 'AIzaSyBdALDlIYcT1gVvvx-S4Q15sI0LI8bphho';
  var keyHandler = null;

  function init() {
    var el = document.getElementById('calendar');
    var backdrop = document.getElementById('event-modal');
    if (!el || !backdrop) return;

    var loading = document.getElementById('loading');
    var title = document.getElementById('modal-title');
    var start = document.getElementById('modal-start');
    var location = document.getElementById('modal-location');
    var details = document.getElementById('modal-details');

    function openModal(ev) {
      title.textContent = ev.summary || 'Untitled';
      start.textContent = ev.start ? new Date(ev.start.dateTime || ev.start.date).toLocaleString() : 'TBD';
      location.textContent = ev.location || 'TBD';
      details.textContent = ev.description || 'TBD';
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeModal(); });
    var closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = function (e) { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', keyHandler);

    loading.style.display = 'block';
    var url = 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(CAL_ID) +
      '/events?key=' + API_KEY +
      '&singleEvents=true&orderBy=startTime&timeMin=' + new Date().toISOString() +
      '&maxResults=10';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        loading.style.display = 'none';
        var items = (data && data.items) || [];
        var now = Date.now();
        var week = now + 7 * 24 * 60 * 60 * 1000;
        var hasSoon = items.some(function (ev) {
          var t = new Date(ev.start.dateTime || ev.start.date).getTime();
          return t >= now && t <= week;
        });
        var html = '<ul class="trail-list">';
        if (!hasSoon) {
          html += '<li class="trail-empty"><img src="assets/images/meme.jpg" alt="" class="trail-meme">' +
            '<div class="trail-cols"><div class="trail-col">There are no trails on the calendar for the next 7 days!?</div>' +
            '<div class="trail-col">Then sign up to hare one!!</div></div></li>';
        }
        items.forEach(function (ev, idx) {
          var d = new Date(ev.start.dateTime || ev.start.date);
          var when = d.toLocaleString([], {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
          });
          var loc = ev.location ? '<span class="trail-loc">' + ev.location + '</span>' : '';
          html += '<li data-idx="' + idx + '"><div class="trail-when">' + when + '</div>' +
            '<div class="trail-title">' + (ev.summary || 'Untitled') + '</div>' + loc + '</li>';
        });
        html += '</ul>';
        el.innerHTML = html;
        el.querySelectorAll('li[data-idx]').forEach(function (li) {
          li.addEventListener('click', function () {
            openModal(items[+li.getAttribute('data-idx')]);
          });
        });
      })
      .catch(function () {
        loading.style.display = 'none';
        el.innerHTML = '<p class="muted">Could not load trails.</p>';
      });
  }

  window.NVHHH_CALENDAR_INIT = init;
  init();
})();
