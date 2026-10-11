const $ = (s) => document.querySelector(s);
const api = (path, opts) => fetch('/api/' + path, { headers: { 'Content-Type': 'application/json' }, ...opts }).then(r => r.json());
const esc = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Cursor glow
const glow = $('#glow');
addEventListener('pointermove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });

function countUp(el, to, dec = 0, suffix = '') {
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / 900, 1), v = to * (1 - Math.pow(1 - p, 3));
    el.textContent = v.toFixed(dec) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

function renderStats(s) {
  const cards = [
    ['Brier score', s.brier, 3, '', 'lower is better', true],
    ['Accuracy', s.accuracy, 0, '%', `${s.resolved} resolved`],
    ['Avg confidence', s.avgConf, 0, '%', 'what you claimed'],
    ['Open', s.open, 0, '', 'waiting for an outcome'],
  ];
  $('#stats').innerHTML = cards.map(([l, , , , sub, hot]) => `<div class="card stat ${hot ? 'hot' : ''}"><b>0</b><span>${l} · ${sub}</span></div>`).join('');
  document.querySelectorAll('.stat b').forEach((b, i) => countUp(b, cards[i][1], cards[i][2], cards[i][3]));
  $('#verdict').textContent = s.verdict;
}

function renderChart(s) {
  const W = 420, P = 44, S = W - P * 2, x = v => P + ((v - 50) / 50) * S, y = v => W - P - ((v - 50) / 50) * S;
  if (!s.buckets.length) { $('#chart').innerHTML = '<p class="empty">No resolved predictions yet. Add one below, or load demo data.<br><br><button class="btn" id="seed" style="padding:10px 18px">Load demo data</button></p>'; $('#seed').onclick = async () => { await api('seed', { method: 'POST' }); load(); }; return; }
  const ticks = [50, 60, 70, 80, 90, 100].map(v => `<line class="axis" x1="${x(v)}" y1="${P}" x2="${x(v)}" y2="${W - P}"/><line class="axis" x1="${P}" y1="${y(v)}" x2="${W - P}" y2="${y(v)}"/><text class="tick" x="${x(v)}" y="${W - P + 16}" text-anchor="middle">${v}</text><text class="tick" x="${P - 8}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('');
  const pts = s.buckets.map(b => [x(b.confidence), y(b.hitRate < 50 ? 50 : b.hitRate), b.n, b.hitRate]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  $('#chart').innerHTML = `<svg viewBox="0 0 ${W} ${W}" role="img" aria-label="Calibration chart">${ticks}
    <text class="tick" x="${W / 2}" y="${W - 6}" text-anchor="middle">Your confidence (%)</text>
    <text class="tick" transform="translate(12 ${W / 2}) rotate(-90)" text-anchor="middle">How often you were right (%)</text>
    <line class="perfect" x1="${x(50)}" y1="${y(50)}" x2="${x(100)}" y2="${y(100)}"/>
    ${pts.length > 1 ? `<path class="curve" d="${path}"/>` : ''}
    ${pts.map((p, i) => `<circle class="pt" style="animation-delay:${0.4 + i * 0.2}s" cx="${p[0]}" cy="${p[1]}" r="${6 + p[2] * 1.6}"><title>${p[3].toFixed(0)}% right across ${p[2]} predictions</title></circle>`).join('')}</svg>`;
}

function renderCats(s) {
  $('#cats').innerHTML = s.categories.length ? s.categories.map(c => `<div class="cat"><div><span>${esc(c.name)}</span><small>${c.accuracy.toFixed(0)}% right · claimed ${c.confidence.toFixed(0)}%</small></div><div class="bar"><i data-w="${c.accuracy}"></i><u style="left:${c.confidence}%"></u></div></div>`).join('') : '<p class="empty">Categories appear once you resolve predictions.</p>';
  requestAnimationFrame(() => document.querySelectorAll('.bar i').forEach(i => i.style.width = i.dataset.w + '%'));
}

function renderList(list) {
  $('#list').innerHTML = list.length ? list.map((p, i) => `<div class="item" style="animation-delay:${Math.min(i, 8) * 0.05}s">
    <p>${esc(p.text)}<br><small>${esc(p.category)} · ${p.confidence}% sure</small></p>
    ${p.outcome === null ? `<div class="act"><button data-id="${p.id}" data-o="1">Happened</button><button data-id="${p.id}" data-o="0">Didn't</button></div>` : `<span class="pill ${p.outcome ? 'yes' : 'no'}">${p.outcome ? 'Happened' : "Didn't happen"}</span>`}
    <button class="x" data-del="${p.id}" aria-label="Delete prediction">✕</button></div>`).join('') : '<p class="empty">Nothing logged yet. Make your first prediction above.</p>';
}

async function load() {
  const [s, list] = await Promise.all([api('stats'), api('predictions')]);
  renderStats(s); renderChart(s); renderCats(s); renderList(list);
}

$('#conf').oninput = e => $('#confVal').textContent = e.target.value + '%';
$('#form').onsubmit = async e => {
  e.preventDefault();
  const r = await api('predictions', { method: 'POST', body: JSON.stringify({ text: $('#text').value, confidence: $('#conf').value, category: $('#cat').value }) });
  $('#err').textContent = r.error || '';
  if (!r.error) { $('#text').value = ''; load(); }
};
$('#list').onclick = async e => {
  const t = e.target;
  if (t.dataset.o) await api(`predictions/${t.dataset.id}/resolve`, { method: 'POST', body: JSON.stringify({ outcome: t.dataset.o === '1' }) });
  else if (t.dataset.del) await api(`predictions/${t.dataset.del}`, { method: 'DELETE' });
  else return;
  load();
};
load();
