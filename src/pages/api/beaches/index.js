// ═══════════════════════════════════════════════════════════════════════════
// GET /api/beaches — Returns all beaches with current scores & recent reports
// ═══════════════════════════════════════════════════════════════════════════
import { getAllBeaches, getReportsForBeach, getTotalReportCount } from '../../../lib/db.js';

const TRENDS = {
  baga: 'stable',
  calangute: 'declining',
  anjuna: 'improving',
  palolem: 'improving',
  vagator: 'declining',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const beaches = await getAllBeaches();

    const enriched = await Promise.all(
      beaches.map(async (beach) => {
        const recentReports = await getReportsForBeach(beach.id, 3);
        return {
          ...beach,
          trend: TRENDS[beach.id] || 'stable',
          recent_reports: recentReports,
        };
      })
    );

    const totalReports = await getTotalReportCount();

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    return res.status(200).json({
      beaches: enriched,
      total_reports: totalReports,
      timestamp: new Date().toISOString(),
      mode: process.env.SUPABASE_URL ? 'live' : 'demo',
    });
  } catch (err) {
    console.error('[GET /api/beaches]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
