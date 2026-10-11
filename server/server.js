const http = require('http'), fs = require('fs'), path = require('path');
const store = require('./store'), { compute } = require('./stats');
const PUB = path.join(__dirname, '..', 'public'), PORT = process.env.PORT || 4000;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

const send = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' });
  res.end(code === 204 ? undefined : JSON.stringify(data));
};
const readBody = (req) => new Promise(resolve => {
  let raw = ''; req.on('data', c => { raw += c; if (raw.length > 1e5) req.destroy(); });
  req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); } });
});

async function api(req, res, url) {
  const m = req.method, [, , resource, id, action] = url.split('/');
  if (m === 'OPTIONS') return send(res, 204);
  if (resource === 'predictions') {
    if (m === 'GET' && !id) return send(res, 200, store.all());
    if (m === 'POST' && !id) {
      const b = await readBody(req), text = String(b.text || '').trim().slice(0, 200), confidence = Math.round(+b.confidence);
      if (!text || !(confidence >= 50 && confidence <= 99)) return send(res, 400, { error: 'Add a prediction and a confidence between 50 and 99.' });
      return send(res, 201, store.add({ text, confidence, category: String(b.category || 'Life').slice(0, 20), due: b.due || null }));
    }
    if (m === 'POST' && action === 'resolve') { const b = await readBody(req), p = store.resolve(id, !!b.outcome); return p ? send(res, 200, p) : send(res, 404, { error: 'Prediction not found.' }); }
    if (m === 'DELETE' && id) { store.remove(id); return send(res, 200, { ok: true }); }
  }
  if (resource === 'stats' && m === 'GET') return send(res, 200, compute(store.all()));
  if (resource === 'seed' && m === 'POST') { if (!store.all().length) store.seed(); return send(res, 200, { ok: true }); }
  send(res, 404, { error: 'Not found.' });
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url.startsWith('/api/')) return api(req, res, url);
  let file = path.join(PUB, url === '/' ? 'index.html' : url);
  if (!file.startsWith(PUB) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUB, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Foresight running at http://localhost:${PORT}`));
