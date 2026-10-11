// Pure scoring logic: Brier score, calibration buckets, overconfidence gap.
const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

exports.compute = (list) => {
  const done = list.filter(p => p.outcome !== null);
  const hits = done.filter(p => p.outcome).length;
  const brier = avg(done.map(p => (p.confidence / 100 - (p.outcome ? 1 : 0)) ** 2));
  const avgConf = avg(done.map(p => p.confidence));
  const accuracy = done.length ? (hits / done.length) * 100 : 0;
  const gap = avgConf - accuracy;

  const buckets = [50, 60, 70, 80, 90].map(lo => {
    const items = done.filter(p => p.confidence >= lo && p.confidence < lo + 10 + (lo === 90 ? 1 : 0));
    return { range: `${lo}–${lo === 90 ? 99 : lo + 9}`, n: items.length, confidence: avg(items.map(p => p.confidence)), hitRate: items.length ? (items.filter(p => p.outcome).length / items.length) * 100 : null };
  }).filter(b => b.n);

  const cats = {};
  done.forEach(p => { (cats[p.category] ||= []).push(p); });
  const categories = Object.entries(cats).map(([name, items]) => ({ name, n: items.length, accuracy: (items.filter(p => p.outcome).length / items.length) * 100, confidence: avg(items.map(p => p.confidence)) }))
    .sort((a, b) => (b.confidence - b.accuracy) - (a.confidence - a.accuracy));

  let verdict = 'Resolve a few predictions to see how calibrated you are.';
  if (done.length >= 5) verdict = Math.abs(gap) <= 5 ? 'Well calibrated. Your confidence matches reality.'
    : gap > 0 ? `Overconfident by ${gap.toFixed(0)} points. You expect to be right more often than you are.`
    : `Underconfident by ${Math.abs(gap).toFixed(0)} points. You are right more often than you expect.`;

  return { total: list.length, resolved: done.length, open: list.length - done.length, brier, accuracy, avgConf, gap, buckets, categories, verdict };
};
