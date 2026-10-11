// NVHHH calendar — FullCalendar with Google Calendar source.
// Defaults to list view on small screens, month grid on large; switches on resize.
(function () {
  var CAL_ID = '55k6rnam11akkav5vljqlsc6lo@group.calendar.google.com';
  var API_KEY = 'AIzaSyBdALDlIYcT1gVvvx-S4Q15sI0LI8bphho'; 

  var el = document.getElementById('calendar');
  if (!el || typeof FullCalendar === 'undefined') return;

  var isMobile = function () { return window.innerWidth < 768; };

  var calendar = new FullCalendar.Calendar(el, {
    googleCalendarApiKey: API_KEY,
    events: CAL_ID,
    initialView: isMobile() ? 'listWeek' : 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: isMobile() ? 'listWeek' : 'dayGridMonth,listWeek'
    },
    height: 'auto',
    nowIndicator: true,
    eventTimeFormat: { hour: 'numeric', minute: '2-digit' },
    windowResize: function () {
      var mobile = isMobile();
      calendar.changeView(mobile ? 'listWeek' : 'dayGridMonth');
      calendar.setOption('headerToolbar', {
        left: 'prev,next today',
        center: 'title',
        right: mobile ? 'listWeek' : 'dayGridMonth,listWeek'
      });
    },
    eventClick: function (arg) {
      arg.jsEvent.preventDefault();
      openModal(arg.event);
    },
    loading: function (bool) {
      document.getElementById('loading').style.display = bool ? 'block' : 'none';
    }
  });

  calendar.render();

  // ---- modal (replaces the old alert()) ----
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
})();
