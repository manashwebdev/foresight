const fs = require('fs'), path = require('path'), crypto = require('crypto');
const FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');
let db = [];
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
const save = () => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); };

exports.all = () => [...db].sort((a, b) => b.createdAt - a.createdAt);
exports.add = (p) => { const r = { id: crypto.randomUUID(), ...p, outcome: null, createdAt: Date.now(), resolvedAt: null }; db.push(r); save(); return r; };
exports.resolve = (id, outcome) => { const p = db.find(x => x.id === id); if (!p) return null; p.outcome = outcome; p.resolvedAt = Date.now(); save(); return p; };
exports.remove = (id) => { db = db.filter(x => x.id !== id); save(); };

// Demo data with deliberate overconfidence so the chart tells a story on first run.
exports.seed = () => {
  const rows = [
    ['I will ship the auth module by Friday', 90, 'Work', 0], ['The deploy goes through first try', 95, 'Work', 0],
    ['Standup finishes in 15 minutes', 85, 'Work', 1], ['The bug is in the API layer, not the UI', 80, 'Work', 0],
    ['I finish the book this month', 75, 'Life', 0], ['I hit the gym 5 days this week', 90, 'Fitness', 0],
    ['I add 5 kg to my bench this month', 70, 'Fitness', 1], ['My reel crosses 10k views', 60, 'Content', 1],
    ['The new post beats my average', 65, 'Content', 0], ['I wake up before 6 all week', 80, 'Life', 0],
    ['Interview call comes this week', 55, 'Work', 1], ['The PR gets approved without changes', 85, 'Work', 0],
    ['Our squad wins the scrim', 70, 'Gaming', 1], ['I reach Heroic this season', 60, 'Gaming', 0],
    ['I complete the course assignment tonight', 95, 'Life', 1], ['The estimate of 3 days holds', 90, 'Work', 0],
    ['I stick to my meal plan all week', 80, 'Fitness', 1], ['The client replies by Monday', 75, 'Work', 1],
    ['The build passes on the first push', 90, 'Work', 1], ['I post a reel every day this week', 85, 'Content', 0],
  ];
  const now = Date.now();
  rows.forEach(([text, confidence, category, o], i) => db.push({ id: crypto.randomUUID(), text, confidence, category, due: null, outcome: !!o, createdAt: now - (rows.length - i) * 864e5, resolvedAt: now - (rows.length - i) * 432e5 }));
  save();
};
