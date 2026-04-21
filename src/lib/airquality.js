// ═══════════════════════════════════════════════════════════════════════════
// src/lib/airquality.js — Air Quality + UV Index from Open-Meteo
// FREE API — no key required
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch air quality and UV data for a beach location.
 * Returns Environment Quality Index (EQI) 0-100.
 */
export async function getAirQualityData(lat, lng) {
  try {
    const params = [
      `latitude=${lat}`,
      `longitude=${lng}`,
      `current=pm2_5,pm10,uv_index,european_aqi,us_aqi,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth`,
    ].join('&');

    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
    if (!res.ok) throw new Error(`AQI API ${res.status}`);
    const data = await res.json();

    const c = data.current || {};

    const snapshot = {
      pm2_5:                  c.pm2_5 ?? null,
      pm10:                   c.pm10 ?? null,
      uv_index:               c.uv_index ?? null,
      european_aqi:           c.european_aqi ?? null,
      us_aqi:                 c.us_aqi ?? null,
      carbon_monoxide:        c.carbon_monoxide ?? null,
      nitrogen_dioxide:       c.nitrogen_dioxide ?? null,
      sulphur_dioxide:        c.sulphur_dioxide ?? null,
      ozone:                  c.ozone ?? null,
      aerosol_optical_depth:  c.aerosol_optical_depth ?? null,
    };

    // Compute Environmental Quality Index
    const eqi = computeEQI(snapshot);

    return {
      ...snapshot,
      eqi,
      uv_category: getUVCategory(snapshot.uv_index),
      source: 'Open-Meteo Air Quality API',
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[airquality] API failed:', err.message);
    return getMockAQIData();
  }
}

/**
 * Environmental Quality Index (EQI) — 0 (terrible) to 100 (pristine).
 * Combines AQI, PM2.5, UV, and aerosol depth.
 */
function computeEQI(data) {
  let score = 100;

  // PM2.5 impact (WHO: <5 ideal, >35 unhealthy)
  if (data.pm2_5 != null) {
    if (data.pm2_5 > 35) score -= 25;
    else if (data.pm2_5 > 15) score -= 12;
    else if (data.pm2_5 > 5) score -= 4;
  }

  // PM10 impact (WHO: <15 ideal, >45 unhealthy)
  if (data.pm10 != null) {
    if (data.pm10 > 45) score -= 15;
    else if (data.pm10 > 25) score -= 8;
    else if (data.pm10 > 15) score -= 3;
  }

  // European AQI (1=good, 5=very poor)
  if (data.european_aqi != null) {
    if (data.european_aqi >= 100) score -= 20;      // very poor
    else if (data.european_aqi >= 75) score -= 12;   // poor
    else if (data.european_aqi >= 50) score -= 6;    // moderate
  }

  // UV extreme penalty
  if (data.uv_index != null && data.uv_index > 10) {
    score -= 8;
  }

  // Aerosol optical depth (>0.4 = hazy/polluted)
  if (data.aerosol_optical_depth != null && data.aerosol_optical_depth > 0.4) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * UV Index category with protection recommendations.
 */
export function getUVCategory(uvIndex) {
  if (uvIndex == null) return { level: 'Unknown', color: '#64748b', advice: 'UV data unavailable' };
  if (uvIndex <= 2)  return { level: 'Low',       color: '#4ade80', advice: 'Minimal protection needed' };
  if (uvIndex <= 5)  return { level: 'Moderate',  color: '#facc15', advice: 'Wear sunscreen SPF 30+' };
  if (uvIndex <= 7)  return { level: 'High',      color: '#fb923c', advice: 'SPF 50+, hat, shade during midday' };
  if (uvIndex <= 10) return { level: 'Very High', color: '#f87171', advice: 'Avoid 10am-4pm, full protection required' };
  return              { level: 'Extreme',    color: '#a855f7', advice: 'Stay indoors if possible, extreme burn risk' };
}

/**
 * Calculate environment risk component for safety scoring.
 */
export function calculateEnvironmentRisk(aqiData) {
  if (!aqiData) return { risk: 0, factors: [] };

  let risk = 0;
  const factors = [];

  if (aqiData.eqi != null && aqiData.eqi < 40) {
    risk += 12;
    factors.push(`Poor air quality (EQI ${aqiData.eqi})`);
  } else if (aqiData.eqi != null && aqiData.eqi < 60) {
    risk += 5;
    factors.push(`Moderate air quality (EQI ${aqiData.eqi})`);
  }

  if (aqiData.uv_index != null && aqiData.uv_index > 9) {
    risk += 8;
    factors.push(`Extreme UV Index ${aqiData.uv_index}`);
  } else if (aqiData.uv_index != null && aqiData.uv_index > 7) {
    risk += 4;
    factors.push(`Very high UV Index ${aqiData.uv_index}`);
  }

  if (aqiData.pm2_5 != null && aqiData.pm2_5 > 25) {
    risk += 6;
    factors.push(`High PM2.5 (${aqiData.pm2_5} µg/m³)`);
  }

  return { risk: Math.min(100, risk), factors };
}

// ── Mock fallback ──
function getMockAQIData() {
  const uv = parseFloat((3 + Math.random() * 5).toFixed(1));
  return {
    pm2_5: parseFloat((5 + Math.random() * 10).toFixed(1)),
    pm10: parseFloat((12 + Math.random() * 15).toFixed(1)),
    uv_index: uv,
    european_aqi: Math.floor(20 + Math.random() * 30),
    us_aqi: Math.floor(25 + Math.random() * 35),
    carbon_monoxide: parseFloat((180 + Math.random() * 80).toFixed(0)),
    nitrogen_dioxide: parseFloat((5 + Math.random() * 10).toFixed(1)),
    sulphur_dioxide: parseFloat((2 + Math.random() * 5).toFixed(1)),
    ozone: parseFloat((50 + Math.random() * 30).toFixed(0)),
    aerosol_optical_depth: parseFloat((0.1 + Math.random() * 0.2).toFixed(3)),
    eqi: Math.floor(70 + Math.random() * 20),
    uv_category: getUVCategory(uv),
    source: 'Mock (AQI API unavailable)',
    fetched_at: new Date().toISOString(),
  };
}
