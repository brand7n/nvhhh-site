#!/usr/bin/env node
// Static site builder: markdown content -> HTML.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');
const TEMPLATE = path.join(ROOT, 'templates', 'layout.html');
const DIST = path.join(ROOT, 'dist');

// ---------- markdown -> html ----------
// Wrap tables in a scrollable container for mobile.
const renderer = {
  table(token) {
    const head = token.header.map(c => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
    const body = token.rows.map(r => '<tr>' + r.map(c => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('') + '</tr>').join('');
    return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  },
  image({ href, title, text }) {
    return `<img src="${href}" alt="${text}"${title ? ` title="${title}"` : ''} loading="lazy">`;
  }
};
marked.use({ renderer });

function mdToHtml(md) {
  return marked.parse(md);
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

function buildPage(file, meta, body) {
  let content = mdToHtml(body);
  if (meta.calendar) {
    content = content.replace('{{calendar}}', CALENDAR_HTML);
  }
  const active = meta.nav || file;
  const nav = NAV.map(([href, label]) =>
    `<a href="${href}"${href === active ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('');
  const html = layout
    .replace(/\{\{title\}\}/g, meta.title || 'Nittany Valley Hash House Harriers')
    .replace(/\{\{nav\}\}/g, nav)
    .replace(/\{\{content\}\}/g, content);
  fs.writeFileSync(path.join(DIST, file), html);
  console.log('built', file);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const pages = fs.readdirSync(CONTENT)
  .filter(f => f.endsWith('.md'))
  .map(f => {
    const { meta, body } = parseFrontmatter(fs.readFileSync(path.join(CONTENT, f), 'utf8'));
    return { file: meta.out || f.replace(/\.md$/, '.html'), meta, body };
  });
pages.forEach(p => buildPage(p.file, p.meta, p.body));

// copy assets
fs.cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });

// copy swup (npm-managed) UMD builds
const swup = path.join(DIST, 'assets', 'vendor', 'swup');
fs.mkdirSync(swup, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'node_modules', 'swup', 'dist', 'Swup.umd.js'), path.join(swup, 'swup.umd.js'));
fs.copyFileSync(path.join(ROOT, 'node_modules', '@swup', 'fade-theme', 'dist', 'index.umd.js'), path.join(swup, 'fade-theme.umd.js'));
console.log('copied assets');
console.log('done');
