#!/usr/bin/env node
// Static site builder: markdown content -> HTML. No dependencies.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');
const TEMPLATE = path.join(ROOT, 'templates', 'layout.html');
const DIST = path.join(ROOT, 'dist');

// ---------- markdown -> html ----------
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  // code spans first
  s = s.replace(/`([^`]+)`/g, (_, c) => '<code>' + esc(c) + '</code>');
  // images
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    (_, alt, src, title) => `<img src="${src}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy">`);
  // links
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    (_, text, href, title) => `<a href="${href}"${title ? ` title="${esc(title)}"` : ''}>${text}</a>`);
  // bold / italic
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return s;
}

function parseTable(lines, i) {
  const rows = [];
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    i++;
  }
  // skip separator row
  if (rows.length > 1 && rows[1].every(c => /^:?-{2,}:?$/.test(c))) rows.splice(1, 1);
  const head = rows[0];
  const body = rows.slice(1);
  let h = '<div class="table-wrap"><table><thead><tr>' +
    head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
  for (const r of body) {
    h += '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
  }
  return h + '</tbody></table></div>';
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let i = 0;
  let list = null; // {type, items, tight}

  const closeList = () => {
    if (list) {
      const tag = list.type === 'ul' ? 'ul' : 'ol';
      html += `<${tag}>` + list.items.map(li => `<li>${li}</li>`).join('') + `</${tag}>`;
      list = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { closeList(); i++; continue; }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeList(); html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; i++; continue; }

    // horizontal rule
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { closeList(); html += '<hr>'; i++; continue; }

    // blockquote
    if (line.trim().startsWith('>')) {
      closeList();
      const q = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      html += `<blockquote>${mdToHtml(q.join('\n'))}</blockquote>`;
      continue;
    }

    // table
    if (line.trim().startsWith('|')) {
      closeList();
      html += parseTable(lines, i);
      while (i < lines.length && lines[i].trim().startsWith('|')) i++;
      continue;
    }

    // lists
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      const type = ul ? 'ul' : 'ol';
      if (!list || list.type !== type) { closeList(); list = { type, items: [] }; }
      list.items.push(inline((ul || ol)[1]));
      i++;
      continue;
    }

    // paragraph
    closeList();
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|[-*+]\s|\d+\.\s|>|\||-{3,}\s*$)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    html += `<p>${inline(para.join(' '))}</p>`;
  }
  closeList();
  return html;
}

// ---------- frontmatter ----------
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return { meta, body: md.slice(m[0].length) };
}

// ---------- build ----------
const NAV = [
  ['index.html', 'Home'],
  ['hare-resources.html', 'Hare Resources'],
  ['trail-history.html', 'Trail History'],
  ['get-connected.html', 'Get Connected'],
  ['mismanagement.html', 'Mismanagement'],
  ['faq.html', 'FAQs'],
  ['links.html', 'Links'],
  ['contact.html', 'Contact Us'],
];

const layout = fs.readFileSync(TEMPLATE, 'utf8');

const CALENDAR_HTML = `
<div class="calendar-toolbar">
  <a class="btn" href="https://calendar.google.com/calendar/embed?src=55k6rnam11akkav5vljqlsc6lo%40group.calendar.google.com&ctz=America/New_York" target="_blank" rel="noopener">Open in Google Calendar</a>
  <a class="btn secondary" href="hareline-subscription.html">Subscribe on your phone</a>
</div>
<div id="loading">Loading events…</div>
<div id="calendar"></div>
<div class="modal-backdrop" id="event-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal">
    <button class="modal-close" id="modal-close" aria-label="Close">&times;</button>
    <h3 id="modal-title"></h3>
    <dl>
      <dt>Start</dt><dd id="modal-start"></dd>
      <dt>Location</dt><dd id="modal-location"></dd>
      <dt>Details</dt><dd id="modal-details"></dd>
    </dl>
  </div>
</div>`;

const CALENDAR_SCRIPTS = `
<script src="assets/vendor/fullcalendar/index.global.min.js"></script>
<script src="assets/vendor/fullcalendar/google-calendar.global.min.js"></script>
<script src="assets/js/calendar.js"></script>`;

function buildPage(file, meta, body) {
  let content = mdToHtml(body);
  let extra = '';
  if (meta.calendar) {
    content = content.replace('{{calendar}}', CALENDAR_HTML);
    extra = CALENDAR_SCRIPTS;
  }
  const active = meta.nav || file;
  const nav = NAV.map(([href, label]) =>
    `<a href="${href}"${href === active ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('');
  const html = layout
    .replace(/\{\{title\}\}/g, meta.title || 'Nittany Valley Hash House Harriers')
    .replace(/\{\{nav\}\}/g, nav)
    .replace(/\{\{content\}\}/g, content)
    .replace('</body>', extra + '\n</body>');
  fs.writeFileSync(path.join(DIST, file), html);
  console.log('built', file);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const f of fs.readdirSync(CONTENT)) {
  if (!f.endsWith('.md')) continue;
  const { meta, body } = parseFrontmatter(fs.readFileSync(path.join(CONTENT, f), 'utf8'));
  const out = meta.out || f.replace(/\.md$/, '.html');
  buildPage(out, meta, body);
}

// copy assets
fs.cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });

// copy FullCalendar from node_modules (npm-managed)
const fc = path.join(DIST, 'assets', 'vendor', 'fullcalendar');
fs.mkdirSync(fc, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'node_modules', 'fullcalendar', 'index.global.min.js'), path.join(fc, 'index.global.min.js'));
fs.copyFileSync(path.join(ROOT, 'node_modules', '@fullcalendar', 'google-calendar', 'index.global.min.js'), path.join(fc, 'google-calendar.global.min.js'));
console.log('copied assets');
console.log('done');
