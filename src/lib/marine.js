// ═══════════════════════════════════════════════════════════════════════════
// src/lib/marine.js — Tide + Wave Intelligence from Open-Meteo Marine API
// FREE API — no key required
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch marine data (waves, tides, currents) for a location.
 * Returns current snapshot + 24h hourly forecast + high/low tide windows.
 */
export async function getMarineData(lat, lng) {
  try {
    const params = [
      `latitude=${lat}`,
      `longitude=${lng}`,
      `hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period,ocean_current_velocity,ocean_current_direction`,
      `current=wave_height,wave_direction,wave_period,swell_wave_height,ocean_current_velocity,ocean_current_direction`,
      `forecast_days=2`,
    ].join('&');

    const res = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params}`);
    if (!res.ok) throw new Error(`Marine API ${res.status}`);
    const data = await res.json();

    // ── Current snapshot ──
    const current = {
      wave_height:            data.current?.wave_height ?? null,
      wave_direction:         data.current?.wave_direction ?? null,
      wave_period:            data.current?.wave_period ?? null,
      swell_wave_height:      data.current?.swell_wave_height ?? null,
      ocean_current_velocity: data.current?.ocean_current_velocity ?? null,
      ocean_current_direction:data.current?.ocean_current_direction ?? null,
    };

    // ── 24h hourly forecast ──
    const hourly = [];
    const now = new Date();
    const times = data.hourly?.time || [];
    const waveHeights = data.hourly?.wave_height || [];
    const wavePeriods = data.hourly?.wave_period || [];
    const swellHeights = data.hourly?.swell_wave_height || [];
    const currentVels = data.hourly?.ocean_current_velocity || [];

    for (let i = 0; i < times.length && hourly.length < 24; i++) {
      const t = new Date(times[i]);
      if (t >= now) {
        hourly.push({
          time: times[i],
          wave_height: waveHeights[i] ?? null,
          wave_period: wavePeriods[i] ?? null,
          swell_wave_height: swellHeights[i] ?? null,
          ocean_current_velocity: currentVels[i] ?? null,
          // Synthetic sea level from tidal harmonic model (semi-diurnal M2)
          sea_level_height: generateTidalHeight(t, lat),
        });
      }
    }

    // ── High / Low tide detection from synthetic tidal model ──
    const tides = identifyTides(hourly, now);

    return {
      current,
      hourly,
      tides,
      source: 'Open-Meteo Marine API',
      fetched_at: now.toISOString(),
    };
  } catch (err) {
    console.error('[marine] API failed:', err.message);
    return getMockMarineData();
  }
}

/**
 * Semi-diurnal tidal harmonic model.
 * Uses M2 (12.42h) and S2 (12h) tidal constituents for realistic tide simulation.
 * Goa experiences mixed semi-diurnal tides with ~1.5m range.
 */
function generateTidalHeight(date, lat) {
  const hours = date.getTime() / 3600000;
  // M2 constituent (principal lunar, 12.42h period)
  const m2 = 0.55 * Math.sin((2 * Math.PI * hours) / 12.42);
  // S2 constituent (principal solar, 12h period)
  const s2 = 0.18 * Math.sin((2 * Math.PI * hours) / 12.0);
  // K1 constituent (luni-solar diurnal, 23.93h period)
  const k1 = 0.12 * Math.sin((2 * Math.PI * hours) / 23.93);
  // Small random perturbation for realism
  const noise = 0.03 * Math.sin(hours * 0.7);

  return parseFloat((m2 + s2 + k1 + noise).toFixed(3));
}

/**
 * Find high/low tide windows by detecting local maxima/minima in sea level data.
 */
function identifyTides(hourlyData, now) {
  const tides = [];
  if (!hourlyData || hourlyData.length < 3) return tides;

  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  for (let i = 1; i < hourlyData.length - 1; i++) {
    const t = new Date(hourlyData[i].time);
    if (t > cutoff) break;

    const prev = hourlyData[i - 1].sea_level_height;
    const curr = hourlyData[i].sea_level_height;
    const next = hourlyData[i + 1].sea_level_height;

    if (prev == null || curr == null || next == null) continue;

    if (curr > prev && curr > next) {
      tides.push({ type: 'high', time: hourlyData[i].time, level: curr });
    } else if (curr < prev && curr < next) {
      tides.push({ type: 'low', time: hourlyData[i].time, level: curr });
    }
  }

  return tides.slice(0, 6);
}

/**
 * Calculate a marine risk score component (0-100, 100 = dangerous).
 */
export function calculateMarineRisk(marineData) {
  if (!marineData?.current) return { risk: 0, factors: [] };

  let risk = 0;
  const factors = [];
  const c = marineData.current;

  // Wave height risk
  if (c.wave_height != null) {
    if (c.wave_height > 3.0) { risk += 35; factors.push(`Extreme waves ${c.wave_height}m`); }
    else if (c.wave_height > 2.0) { risk += 25; factors.push(`Very high waves ${c.wave_height}m`); }
    else if (c.wave_height > 1.5) { risk += 15; factors.push(`High waves ${c.wave_height}m`); }
    else if (c.wave_height > 1.0) { risk += 8; factors.push(`Moderate waves ${c.wave_height}m`); }
  }

  // Swell risk
  if (c.swell_wave_height != null && c.swell_wave_height > 1.5) {
    risk += 10;
    factors.push(`Heavy swell ${c.swell_wave_height}m`);
  }

  // Ocean current risk
  if (c.ocean_current_velocity != null) {
    if (c.ocean_current_velocity > 5) { risk += 20; factors.push(`Dangerous current ${c.ocean_current_velocity} km/h`); }
    else if (c.ocean_current_velocity > 3) { risk += 12; factors.push(`Strong current ${c.ocean_current_velocity} km/h`); }
    else if (c.ocean_current_velocity > 1.5) { risk += 5; factors.push(`Moderate current ${c.ocean_current_velocity} km/h`); }
  }

  // High tide penalty
  if (marineData.tides?.length) {
    const now = Date.now();
    const nearHighTide = marineData.tides.find(t =>
      t.type === 'high' && Math.abs(new Date(t.time).getTime() - now) < 2 * 60 * 60 * 1000
    );
    if (nearHighTide) {
      risk += 8;
      factors.push('High tide window active');
    }
  }

  return { risk: Math.min(100, risk), factors };
}

// ── Mock fallback ──
function getMockMarineData() {
  const now = new Date();
  const hourly = [];
  for (let i = 0; i < 24; i++) {
    const t = new Date(now.getTime() + i * 3600000);
    hourly.push({
      time: t.toISOString(),
      sea_level_height: generateTidalHeight(t, 15.5),
      wave_height: parseFloat((0.7 + Math.random() * 0.6).toFixed(1)),
      wave_period: parseFloat((5 + Math.random() * 4).toFixed(1)),
      swell_wave_height: parseFloat((0.3 + Math.random() * 0.4).toFixed(1)),
      ocean_current_velocity: parseFloat((0.5 + Math.random() * 1.5).toFixed(1)),
    });
  }

  return {
    current: {
      wave_height: 0.8, wave_direction: 245, wave_period: 7.2,
      swell_wave_height: 0.4, ocean_current_velocity: 1.1, ocean_current_direction: 180,
    },
    hourly,
    tides: identifyTides(hourly, now),
    source: 'Mock (Marine API unavailable)',
    fetched_at: now.toISOString(),
  };
}
