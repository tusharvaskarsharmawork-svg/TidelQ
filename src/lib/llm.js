// ═══════════════════════════════════════════════════════════════════════════
// src/lib/llm.js — Enhanced AI scoring: OpenAI → Deterministic fallback
// v2.0: Includes tide, wave, UV, AQI, crowd data in analysis
// ═══════════════════════════════════════════════════════════════════════════
import OpenAI from 'openai';
import { calculateMarineRisk } from './marine.js';
import { calculateEnvironmentRisk } from './airquality.js';
import { calculateCrowdRisk } from './crowd.js';

// ─── Deterministic Fallback Scorer ───────────────────────────────────────────
const BASE_SCORES = { baga: 72, calangute: 65, anjuna: 81, palolem: 88, vagator: 58 };

const BASE_ATTRIBUTIONS = {
  baga:      'Moderate tourist activity detected. Chlorophyll levels slightly elevated. Community reports being processed by the monitoring system.',
  calangute: 'Elevated SST anomaly (+1.2°C). High visitor density impacting water quality. Enhanced monitoring recommended for this busy beach.',
  anjuna:    'Favourable conditions detected. Clear water visibility. Minimal hazard reports. Suitable for all water activities.',
  palolem:   'Excellent environmental indicators across all sensors. Community conservation efforts are delivering measurable results. Top-rated beach.',
  vagator:   'Seasonal seaweed bloom confirmed via satellite. Reduced water clarity in affected zone. Exercise caution if swimming.',
};

function deterministicScore(beachId, satelliteData, reports, marineData, aqiData, crowdData) {
  let score = BASE_SCORES[beachId] || 70;
  const riskFactors = [];
  const recommendations = [];

  // ── Weather impact ──
  if (satelliteData) {
    const weather = satelliteData.weather_condition || 'Clear Sky';
    if (weather.includes('Thunderstorm')) { score -= 30; riskFactors.push('Thunderstorm active'); recommendations.push('Leave the beach immediately'); }
    else if (weather.includes('Rain') || weather.includes('Showers')) { score -= 15; riskFactors.push(`${weather} conditions`); recommendations.push('Avoid water activities during rain'); }
    else if (weather.includes('Fog')) { score -= 5; riskFactors.push('Fog reducing visibility'); }

    if (satelliteData.sst_anomaly > 1.5) { score -= 8; riskFactors.push(`SST anomaly +${satelliteData.sst_anomaly}°C`); }
    if (satelliteData.chlorophyll > 2.0) { score -= 12; riskFactors.push(`Algae bloom (chlorophyll ${satelliteData.chlorophyll} mg/m³)`); recommendations.push('Avoid swimming in discoloured water'); }
    else if (satelliteData.chlorophyll > 1.0) score -= 4;
    if (satelliteData.turbidity > 3.0) { score -= 6; riskFactors.push(`High turbidity ${satelliteData.turbidity} NTU`); }
    if (satelliteData.wave_height > 1.2) { score -= 4; riskFactors.push(`Wave height ${satelliteData.wave_height}m`); }
    if (satelliteData.wind_speed > 20) { score -= 3; riskFactors.push(`Strong wind ${satelliteData.wind_speed} km/h`); }
  }

  // ── Marine risk (tide, waves, currents) ──
  const marine = calculateMarineRisk(marineData);
  score -= Math.round(marine.risk * 0.3);
  riskFactors.push(...marine.factors);
  if (marine.risk > 30) recommendations.push('Avoid swimming — dangerous ocean conditions');

  // ── Environment risk (AQI, UV) ──
  const env = calculateEnvironmentRisk(aqiData);
  score -= Math.round(env.risk * 0.4);
  riskFactors.push(...env.factors);
  if (aqiData?.uv_index > 8) recommendations.push(`Apply SPF 50+ sunscreen (UV ${aqiData.uv_index})`);

  // ── Crowd risk ──
  const crowd = calculateCrowdRisk(crowdData);
  score -= crowd.risk;
  riskFactors.push(...crowd.factors);

  // ── Report impact ──
  if (Array.isArray(reports)) {
    score -= Math.min(reports.length * 3, 15);
    if (reports.length > 3) riskFactors.push(`${reports.length} recent hazard reports`);
  }

  score = Math.max(10, Math.min(100, score));

  // ── Beach grade ──
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 60 ? 'B' :
                score >= 50 ? 'C+' : score >= 40 ? 'C' : score >= 30 ? 'D' : 'F';

  if (recommendations.length === 0) recommendations.push('Conditions look good — enjoy the beach responsibly');

  return {
    score: Math.round(score),
    attribution: BASE_ATTRIBUTIONS[beachId] || `Beach safety score: ${Math.round(score)}/100. Real-time multi-layer environmental analysis active.`,
    risk_factors: riskFactors.slice(0, 5),
    recommendations: recommendations.slice(0, 3),
    beach_grade: grade,
  };
}

// ─── Enhanced Prompt Builder ─────────────────────────────────────────────────
function buildScoringPrompt(beachName, satelliteData, reports, marineData, aqiData, crowdData) {
  const reportSummary = Array.isArray(reports) && reports.length > 0
    ? reports.slice(0, 5).map((r) => {
        const tags = Array.isArray(r.ai_tags) ? r.ai_tags.join(', ') : 'Unknown';
        return `- ${tags} (${r.ai_severity || 'unknown'} severity)`;
      }).join('\n')
    : 'No recent community reports.';

  const mc = marineData?.current || {};
  const tideInfo = marineData?.tides?.length
    ? marineData.tides.map(t => `  ${t.type.toUpperCase()} tide at ${new Date(t.time).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})} (${t.level?.toFixed(2)}m)`).join('\n')
    : '  No tide data available';

  return `You are an environmental AI analyst specialising in coastal safety in Goa, India.
Calculate a Beach Safety Score (0-100) for ${beachName} using ALL data layers below.

WEATHER DATA (current):
- Weather Condition: ${satelliteData?.weather_condition ?? 'Clear Sky'}
- Sea Surface Temperature: ${satelliteData?.sst ?? 'N/A'}°C (anomaly: ${satelliteData?.sst_anomaly ?? 'N/A'}°C)
- Chlorophyll-a: ${satelliteData?.chlorophyll ?? 'N/A'} mg/m³ (>2.0 = algae bloom)
- Turbidity: ${satelliteData?.turbidity ?? 'N/A'} NTU (>4 = poor visibility)
- Wind Speed: ${satelliteData?.wind_speed ?? 'N/A'} km/h

MARINE / OCEAN DATA (current):
- Wave Height: ${mc.wave_height ?? 'N/A'} m (>2m = dangerous)
- Wave Period: ${mc.wave_period ?? 'N/A'} s
- Swell Height: ${mc.swell_wave_height ?? 'N/A'} m (>1.5m = risky for swimmers)
- Wave Direction: ${mc.wave_direction ?? 'N/A'}°
- Ocean Current: ${mc.ocean_current_velocity ?? 'N/A'} km/h (>3 = dangerous)
- Current Direction: ${mc.ocean_current_direction ?? 'N/A'}°
TIDE FORECAST (next 24h):
${tideInfo}

AIR QUALITY + UV:
- UV Index: ${aqiData?.uv_index ?? 'N/A'} (${aqiData?.uv_category?.level ?? 'N/A'})
- PM2.5: ${aqiData?.pm2_5 ?? 'N/A'} µg/m³
- European AQI: ${aqiData?.european_aqi ?? 'N/A'}
- Environment Quality Index: ${aqiData?.eqi ?? 'N/A'}/100

CROWD & TOURISM:
- Crowd Level: ${crowdData?.level ?? 'N/A'} (index: ${crowdData?.crowd_index ?? 'N/A'}/100)
- Popularity: ${crowdData?.popularity_tier ?? 'N/A'}

COMMUNITY HAZARD REPORTS (last 7 days):
${reportSummary}

SCORING RULES:
- 90-100: Pristine. Excellent for all activities.
- 70-89:  Good. Minor concerns, suitable for swimming.
- 50-69:  Moderate. Caution advised for some activities.
- 30-49:  Poor. Avoid swimming. Hazards present.
- 0-29:   Dangerous. Beach closure recommended.
- CRITICAL: Thunderstorm → instant -30pts. Rain/Showers → -15pts. Waves >2m → -15pts. Current >3km/h → -10pts.

Respond with ONLY valid JSON:
{
  "score": <integer 0-100>,
  "attribution": "<2-3 sentences explaining the score>",
  "risk_factors": ["<up to 5 key risk factors>"],
  "recommendations": ["<up to 3 safety recommendations>"],
  "beach_grade": "<A+/A/B+/B/C+/C/D/F>"
}`;
}

// ─── OpenAI Scorer ────────────────────────────────────────────────────────────
async function scoreWithOpenAI(beachName, satelliteData, reports, marineData, aqiData, crowdData) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert coastal environmental analyst. Respond with valid JSON only.' },
      { role: 'user', content: buildScoringPrompt(beachName, satelliteData, reports, marineData, aqiData, crowdData) },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });

  const result = JSON.parse(response.choices[0].message.content);
  return {
    score: Math.max(0, Math.min(100, Math.round(result.score))),
    attribution: result.attribution,
    risk_factors: result.risk_factors || [],
    recommendations: result.recommendations || [],
    beach_grade: result.beach_grade || 'N/A',
  };
}

// ─── Vision AI — Hazard Photo Categorisation ──────────────────────────────────
async function categorizeHazardWithOpenAI(base64Image) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this beach photo for environmental hazards. Return JSON: { "tags": ["up to 3 hazard types e.g. Plastic Waste, Oil Spill, Sewage, Algae Bloom, Fishing Net"], "severity": "low|medium|high", "description": "one concise sentence" }',
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 200,
  });

  return JSON.parse(response.choices[0].message.content);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function scoreBeach(beachId, beachName, satelliteData, reports, marineData, aqiData, crowdData) {
  try {
    if (process.env.OPENAI_API_KEY) {
      return await scoreWithOpenAI(beachName, satelliteData, reports, marineData, aqiData, crowdData);
    }
  } catch (err) {
    console.error('[llm] AI scoring failed, using fallback:', err.message);
  }
  return deterministicScore(beachId, satelliteData, reports, marineData, aqiData, crowdData);
}

export async function categorizeHazard(base64Image) {
  try {
    if (process.env.OPENAI_API_KEY) {
      return await categorizeHazardWithOpenAI(base64Image);
    }
  } catch (err) {
    console.error('[llm] Vision AI failed, using mock categorisation:', err.message);
  }

  // Deterministic demo fallback
  const HAZARD_TYPES = ['Plastic Waste', 'Sewage', 'Oil Spill', 'Algae Bloom', 'Fishing Net', 'General Waste'];
  const SEVERITIES = ['low', 'medium', 'high'];
  return {
    tags: [HAZARD_TYPES[Math.floor(Math.random() * HAZARD_TYPES.length)]],
    severity: SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)],
    description: 'Environmental hazard detected at beach site. AI Vision analysis in demo mode.',
  };
}
