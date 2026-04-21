// ═══════════════════════════════════════════════════════════════════════════
// src/lib/crowd.js — Crowd & Tourism Density Estimation Engine
// No external API — algorithm based on time, season, beach popularity, reports
// ═══════════════════════════════════════════════════════════════════════════

// Beach popularity tiers (based on real Goa tourism data)
const POPULARITY = {
  baga:       'extreme',
  calangute:  'extreme',
  candolim:   'high',
  anjuna:     'high',
  vagator:    'high',
  palolem:    'high',
  colva:      'high',
  arambol:    'moderate',
  morjim:     'moderate',
  sinquerim:  'moderate',
  miramar:    'moderate',
  benaulim:   'moderate',
  agonda:     'moderate',
  cavelossim: 'moderate',
  majorda:    'moderate',
};

const POPULARITY_WEIGHT = {
  extreme: 0.85,
  high:    0.65,
  moderate: 0.40,
  low:     0.20,
};

/**
 * Estimate crowd density for a beach.
 * Returns a 0-100 crowd index + level label + best-visit recommendation.
 */
export function estimateCrowdDensity(beachId, reportsLast24h = 0) {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth(); // 0-indexed

  // ── Time-of-day factor (0-1) ──
  let timeFactor;
  if (hour >= 10 && hour <= 16) timeFactor = 1.0;      // Peak beach hours
  else if (hour >= 7 && hour <= 9) timeFactor = 0.5;    // Morning
  else if (hour >= 17 && hour <= 19) timeFactor = 0.6;  // Sunset crowd
  else timeFactor = 0.1;                                 // Night

  // ── Season factor (0-1) — Goa peaks Nov-Feb ──
  let seasonFactor;
  if (month >= 10 || month <= 1) seasonFactor = 1.0;     // Nov-Feb: peak
  else if (month >= 2 && month <= 3) seasonFactor = 0.7; // Mar-Apr: winding down
  else if (month >= 9 && month <= 10) seasonFactor = 0.5; // Oct: pre-season
  else seasonFactor = 0.25;                                // May-Sep: monsoon

  // ── Day of week factor ──
  const day = now.getDay();
  const weekendFactor = (day === 0 || day === 6) ? 1.2 : 1.0;

  // ── Beach popularity base ──
  const popTier = POPULARITY[beachId] || 'low';
  const popWeight = POPULARITY_WEIGHT[popTier];

  // ── Report density factor ──
  const reportFactor = Math.min(1, reportsLast24h / 10) * 0.3;

  // ── Final crowd index (0-100) ──
  const rawScore = (popWeight * 0.4 + timeFactor * 0.25 + seasonFactor * 0.2 + reportFactor * 0.1 + (weekendFactor - 1) * 0.05) * 100;
  const crowdIndex = Math.max(0, Math.min(100, Math.round(rawScore)));

  // ── Level categorization ──
  const level = getCrowdLevel(crowdIndex);

  // ── Best time recommendation ──
  const bestTime = getBestTimeRecommendation(popTier, month);

  return {
    crowd_index: crowdIndex,
    level: level.label,
    level_emoji: level.emoji,
    color: level.color,
    popularity_tier: popTier,
    best_time: bestTime,
    factors: {
      time_of_day: timeFactor,
      season: seasonFactor,
      weekend: weekendFactor > 1,
      popularity: popWeight,
    },
  };
}

function getCrowdLevel(index) {
  if (index <= 15) return { label: 'Empty',    emoji: '🏖️', color: '#4ade80' };
  if (index <= 30) return { label: 'Sparse',   emoji: '🧘', color: '#a3e635' };
  if (index <= 50) return { label: 'Moderate', emoji: '👥', color: '#facc15' };
  if (index <= 70) return { label: 'Crowded',  emoji: '🏊', color: '#fb923c' };
  return               { label: 'Packed',   emoji: '🚫', color: '#f87171' };
}

function getBestTimeRecommendation(popTier, month) {
  if (popTier === 'extreme') {
    if (month >= 10 || month <= 1) return 'Visit before 8am or after 4pm to avoid peak crowds';
    return 'Early morning (6-8am) offers the best experience';
  }
  if (popTier === 'high') {
    return 'Best visited during weekday mornings (7-10am)';
  }
  if (popTier === 'moderate') {
    return 'Generally comfortable. Mornings recommended for quieter experience';
  }
  return 'Secluded beach — great any time of day';
}

/**
 * Crowd risk penalty for safety scoring.
 */
export function calculateCrowdRisk(crowdData) {
  if (!crowdData) return { risk: 0, factors: [] };
  const factors = [];
  let risk = 0;

  if (crowdData.crowd_index > 70) {
    risk += 5;
    factors.push('Extremely crowded — limited rescue access');
  } else if (crowdData.crowd_index > 50) {
    risk += 2;
    factors.push('Moderate crowd density');
  }

  return { risk, factors };
}
