// ═══════════════════════════════════════════════════════════════════════════
// POST /api/reports/submit — v2.0: JSON report + auto-score with all layers
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';
import { saveReport } from '../../../lib/db.js';
import { categorizeHazard } from '../../../lib/llm.js';
import { scoreBeach } from '../../../lib/llm.js';
import { getBeachSatelliteData } from '../../../lib/copernicus.js';
import { getMarineData } from '../../../lib/marine.js';
import { getAirQualityData } from '../../../lib/airquality.js';
import { estimateCrowdDensity } from '../../../lib/crowd.js';
import { getBeachById, getReportsForBeach, updateBeachScore, getAllBeaches, getReportsLast24h } from '../../../lib/db.js';

// Haversine Distance Calculator (km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export const config = { api: { bodyParser: { sizeLimit: '15mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    beach_id,
    description = '',
    severity = 'medium',
    latitude = 0,
    longitude = 0,
    image_base64 = null,
    image_mime   = 'image/jpeg',
  } = req.body || {};

  if (!beach_id) {
    return res.status(400).json({ error: 'beach_id is required' });
  }

  // ── Get user from JWT (optional) ──────────────────────────────────────────
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const sbClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data: { user } } = await sbClient.auth.getUser(token);
      if (user) userId = user.id;
    } catch (_) { /* anonymous — fine */ }
  }

  // ── Vision AI Categorisation ──────────────────────────────────────────────
  let aiResult = null;
  let imageUrl = null;

  if (image_base64) {
    try {
      aiResult = await categorizeHazard(image_base64);
    } catch (err) {
      console.warn('[submit] Vision AI failed:', err.message);
    }

    // Upload to Supabase Storage
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        const ext = image_mime === 'image/png' ? 'png' : 'jpg';
        const storagePath = `reports/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const imageBuffer = Buffer.from(image_base64, 'base64');
        const { error: uploadErr } = await sb.storage
          .from('report-images')
          .upload(storagePath, imageBuffer, { contentType: image_mime, upsert: false });
        if (!uploadErr) {
          imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/report-images/${storagePath}`;
        }
      } catch (err) {
        console.warn('[submit] Storage upload failed:', err.message);
      }
    }
  }

  // ── Save Report ───────────────────────────────────────────────────────────
  try {
    const report = await saveReport({
      beach_id,
      user_id:     userId,
      latitude:    parseFloat(latitude) || 0,
      longitude:   parseFloat(longitude) || 0,
      description,
      image_url:   imageUrl,
      ai_tags:     aiResult?.tags     || [],
      ai_severity: aiResult?.severity || severity,
    });

    // ── Trigger score recalculation (fire-and-forget) ───────────────────
    (async () => {
      try {
        const beach = await getBeachById(beach_id);
        if (beach) {
          const [satellite, reports, marine, aqi, rptCount] = await Promise.all([
            getBeachSatelliteData(beach_id),
            getReportsForBeach(beach_id, 10),
            getMarineData(beach.latitude, beach.longitude),
            getAirQualityData(beach.latitude, beach.longitude),
            getReportsLast24h(beach_id),
          ]);
          const crowd = estimateCrowdDensity(beach_id, rptCount);
          const { score, attribution } = await scoreBeach(beach_id, beach.name, satellite, reports, marine, aqi, crowd);
          await updateBeachScore(beach_id, score, attribution);
          console.log(`[submit] Score updated: ${beach.name} → ${score}/100`);

          // ── Geofenced Nearby Beach Alerts ──
          const allBeaches = await getAllBeaches();
          const nearby = allBeaches
            .filter(b => b.id !== beach_id)
            .map(b => ({ ...b, distance: getDistance(beach.latitude, beach.longitude, b.latitude, b.longitude) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 2);

          for (const nearBeach of nearby) {
            await saveReport({
              beach_id: nearBeach.id,
              user_id: userId,
              latitude: nearBeach.latitude,
              longitude: nearBeach.longitude,
              description: `🚨 SYSTEM ALERT: A hazard incident was reported ${nearBeach.distance.toFixed(1)}km away at ${beach.name}. Ocean currents may be bringing hazardous conditions towards this zone. Proceed with caution!`,
              ai_tags: ['Nearby Warning', 'Spillover Alert', ...(aiResult?.tags || [])],
              ai_severity: 'high', // Force 'high' severity to ensure neighboring score drops significantly into danger zone
            });

            const [nSat, nReps, nMarine, nAqi, nRptCount] = await Promise.all([
              getBeachSatelliteData(nearBeach.id),
              getReportsForBeach(nearBeach.id, 10),
              getMarineData(nearBeach.latitude, nearBeach.longitude),
              getAirQualityData(nearBeach.latitude, nearBeach.longitude),
              getReportsLast24h(nearBeach.id),
            ]);
            const nCrowd = estimateCrowdDensity(nearBeach.id, nRptCount);
            const nextScore = await scoreBeach(nearBeach.id, nearBeach.name, nSat, nReps, nMarine, nAqi, nCrowd);
            await updateBeachScore(nearBeach.id, nextScore.score, `Spill-over Warning from ${beach.name}. ` + nextScore.attribution);
            console.log(`[submit-geofence] Nearby beach ${nearBeach.name} score updated!`);
          }
        }
      } catch (err) {
        console.error('[submit] Score recalculation failed:', err.message);
      }
    })();

    return res.status(201).json({
      success: true,
      report,
      ai_categorisation: aiResult,
    });
  } catch (err) {
    console.error('[POST /api/reports/submit]', err);
    return res.status(500).json({ error: 'Failed to save report: ' + err.message });
  }
}
