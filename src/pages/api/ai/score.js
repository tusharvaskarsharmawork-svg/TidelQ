// ═══════════════════════════════════════════════════════════════════════════
// POST /api/ai/score — v2.0: Multi-layer AI scoring
// ═══════════════════════════════════════════════════════════════════════════
import { getBeachById, getReportsForBeach, updateBeachScore, getReportsLast24h } from '../../../lib/db.js';
import { getBeachSatelliteData } from '../../../lib/copernicus.js';
import { getMarineData } from '../../../lib/marine.js';
import { getAirQualityData } from '../../../lib/airquality.js';
import { estimateCrowdDensity } from '../../../lib/crowd.js';
import { scoreBeach } from '../../../lib/llm.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { beach_id } = req.body || {};
  if (!beach_id) {
    return res.status(400).json({ error: 'beach_id is required' });
  }

  try {
    const beach = await getBeachById(beach_id);
    if (!beach) {
      return res.status(404).json({ error: `Beach '${beach_id}' not found` });
    }

    const [satelliteData, recentReports, marineData, aqiData, rptCount] = await Promise.all([
      getBeachSatelliteData(beach_id),
      getReportsForBeach(beach_id, 10),
      getMarineData(beach.latitude, beach.longitude),
      getAirQualityData(beach.latitude, beach.longitude),
      getReportsLast24h(beach_id),
    ]);

    const crowdData = estimateCrowdDensity(beach_id, rptCount);

    const result = await scoreBeach(
      beach_id, beach.name,
      satelliteData, recentReports,
      marineData, aqiData, crowdData
    );

    await updateBeachScore(beach_id, result.score, result.attribution);

    console.log(`[ai/score] ${beach.name}: ${result.score}/100 (${result.beach_grade})`);

    return res.status(200).json({
      beach_id,
      beach_name: beach.name,
      score: result.score,
      attribution: result.attribution,
      risk_factors: result.risk_factors,
      recommendations: result.recommendations,
      beach_grade: result.beach_grade,
      satellite_snapshot: satelliteData,
      marine_snapshot: marineData?.current,
      air_quality_snapshot: { eqi: aqiData?.eqi, uv: aqiData?.uv_index },
      crowd_snapshot: { index: crowdData?.crowd_index, level: crowdData?.level },
      report_count: recentReports.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[POST /api/ai/score]', err);
    return res.status(500).json({ error: 'Scoring failed: ' + err.message });
  }
}
