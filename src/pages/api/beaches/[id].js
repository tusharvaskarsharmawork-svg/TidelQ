// ═══════════════════════════════════════════════════════════════════════════
// GET /api/beaches/[id] — v2.0: Full beach intelligence with all data layers
// ═══════════════════════════════════════════════════════════════════════════
import { getBeachById, getBeachHistory, getReportsForBeach, getBeachZones, getReportsLast24h } from '../../../lib/db.js';
import { getBeachSatelliteData } from '../../../lib/copernicus.js';
import { getMarineData } from '../../../lib/marine.js';
import { getAirQualityData } from '../../../lib/airquality.js';
import { estimateCrowdDensity } from '../../../lib/crowd.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const beach = await getBeachById(id);
    if (!beach) {
      return res.status(404).json({ error: `Beach '${id}' not found` });
    }

    // Parallel fetch all data layers
    const [history, reports, satelliteData, marineData, aqiData, reportsLast24h] = await Promise.all([
      getBeachHistory(id),
      getReportsForBeach(id, 5),
      getBeachSatelliteData(id),
      getMarineData(beach.latitude, beach.longitude),
      getAirQualityData(beach.latitude, beach.longitude),
      getReportsLast24h(id),
    ]);

    // Crowd estimation (sync, no API)
    const crowdData = estimateCrowdDensity(id, reportsLast24h);

    // Safety zones
    const safetyZones = getBeachZones(id, beach);

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    return res.status(200).json({
      beach,
      history,
      satellite_data: satelliteData,
      marine_data: marineData,
      air_quality: aqiData,
      crowd_estimate: crowdData,
      safety_zones: safetyZones,
      reports,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[GET /api/beaches/${id}]`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
