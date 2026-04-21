// ═══════════════════════════════════════════════════════════════════════════
// GET /api/analytics — Aggregated analytics for the dashboard
// ═══════════════════════════════════════════════════════════════════════════
import { getAllBeaches, getBeachHistory, getReportsForBeach } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const beaches = await getAllBeaches();
    const scores = beaches.map(b => b.current_score);
    const avg = Math.round(scores.reduce((a, v) => a + v, 0) / scores.length);

    // Best & Worst 5
    const sorted = [...beaches].sort((a, b) => b.current_score - a.current_score);
    const best5 = sorted.slice(0, 5).map(b => ({ id: b.id, name: b.name, score: b.current_score }));
    const worst5 = sorted.slice(-5).reverse().map(b => ({ id: b.id, name: b.name, score: b.current_score }));

    // Score distribution
    const dist = { safe: 0, moderate: 0, danger: 0 };
    scores.forEach(s => {
      if (s >= 80) dist.safe++;
      else if (s >= 50) dist.moderate++;
      else dist.danger++;
    });

    // Report counts per beach (top reporters)
    const reportCounts = await Promise.all(
      beaches.map(async b => {
        const rpts = await getReportsForBeach(b.id, 100);
        return { id: b.id, name: b.name, count: rpts.length };
      })
    );
    const topReported = reportCounts.sort((a, b) => b.count - a.count).slice(0, 5);

    // 7-day history for coastline health
    const historyPromises = beaches.slice(0, 10).map(b => getBeachHistory(b.id));
    const histories = await Promise.all(historyPromises);
    const coastlineHealth = [];
    for (let day = 0; day < 7; day++) {
      let sum = 0, count = 0;
      histories.forEach(h => {
        if (h[day]?.score != null) { sum += h[day].score; count++; }
      });
      coastlineHealth.push(count > 0 ? Math.round(sum / count) : avg);
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({
      total_beaches: beaches.length,
      avg_score: avg,
      coastline_health_index: avg,
      score_distribution: dist,
      best_5: best5,
      worst_5: worst5,
      top_reported: topReported,
      coastline_health_7d: coastlineHealth,
      total_reports: reportCounts.reduce((a, r) => a + r.count, 0),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/analytics]', err);
    return res.status(500).json({ error: 'Analytics failed' });
  }
}
