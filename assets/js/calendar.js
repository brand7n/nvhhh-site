// NVHHH calendar.
// Mobile: custom "next 10 trails" list (fetched via Google Calendar API).
// Desktop: FullCalendar month grid.
(function () {
  var CAL_ID = '55k6rnam11akkav5vljqlsc6lo@group.calendar.google.com';
  var API_KEY = 'AIzaSyBdALDlIYcT1gVvvx-S4Q15sI0LI8bphho';

  var el = document.getElementById('calendar');
  if (!el) return;

  var isMobile = function () { return window.innerWidth < 768; };
  var calendar = null;

  function renderNextTen() {
    var loading = document.getElementById('loading');
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
        if (!items.length) {
          el.innerHTML = '<p class="muted">No upcoming trails scheduled.</p>';
          return;
        }
        var html = '<ul class="trail-list">';
        items.forEach(function (ev) {
          var start = new Date(ev.start.dateTime || ev.start.date);
          var when = start.toLocaleString([], {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
          });
          var loc = ev.location ? '<span class="trail-loc">' + ev.location + '</span>' : '';
          html += '<li><div class="trail-when">' + when + '</div>' +
            '<div class="trail-title">' + (ev.summary || 'Untitled') + '</div>' + loc + '</li>';
        });
        html += '</ul>';
        el.innerHTML = html;
      })
      .catch(function () {
        loading.style.display = 'none';
        el.innerHTML = '<p class="muted">Could not load trails.</p>';
      });
  }

  function init() {
    if (isMobile()) {
      if (calendar) { calendar.destroy(); calendar = null; }
      renderNextTen();
    } else {
      if (typeof FullCalendar === 'undefined') return;
      if (!calendar) {
        calendar = new FullCalendar.Calendar(el, {
          googleCalendarApiKey: API_KEY,
          events: CAL_ID,
          initialView: 'dayGridMonth',
          headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' },
          height: 'auto',
          nowIndicator: true,
          eventTimeFormat: { hour: 'numeric', minute: '2-digit' },
          eventClick: function (arg) {
            arg.jsEvent.preventDefault();
            openModal(arg.event);
          },
          loading: function (bool) {
            document.getElementById('loading').style.display = bool ? 'block' : 'none';
          }
        });
        calendar.render();
      }
    }
  }

  // ---- modal (desktop) ----
  var backdrop = document.getElementById('event-modal');
  var title = document.getElementById('modal-title');
  var start = document.getElementById('modal-start');
  var location = document.getElementById('modal-location');
  var details = document.getElementById('modal-details');

  function openModal(event) {
    title.textContent = event.title || 'Untitled';
    start.textContent = event.start ? new Date(event.start).toLocaleString() : 'TBD';
    location.textContent = event.extendedProps.location || 'TBD';
    details.textContent = event.extendedProps.description || 'TBD';
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  init();
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  });
})();
