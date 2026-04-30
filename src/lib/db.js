// ═══════════════════════════════════════════════════════════════════════════
// src/lib/db.js — Database layer with Supabase + in-memory fallback
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

// ─── In-Memory Mock Data ──────────────────────────────────────────────────────
const BEACHES_MOCK = [
  { id: 'querim', name: 'Querim Beach', latitude: 15.7335, longitude: 73.6888, current_score: 91, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'arambol', name: 'Arambol Beach', latitude: 15.6847, longitude: 73.7029, current_score: 87, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'mandrem', name: 'Mandrem Beach', latitude: 15.6560, longitude: 73.7144, current_score: 84, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'ashwem', name: 'Ashwem Beach', latitude: 15.6322, longitude: 73.7196, current_score: 88, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'morjim', name: 'Morjim Beach', latitude: 15.6171, longitude: 73.7332, current_score: 75, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'vagator', name: 'Vagator Beach', latitude: 15.5994, longitude: 73.7447, current_score: 61, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'ozran', name: 'Ozran Beach', latitude: 15.5936, longitude: 73.7386, current_score: 68, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'anjuna', name: 'Anjuna Beach', latitude: 15.5738, longitude: 73.7403, current_score: 73, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'baga', name: 'Baga Beach', latitude: 15.5562, longitude: 73.7525, current_score: 64, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'calangute', name: 'Calangute Beach', latitude: 15.5440, longitude: 73.7553, current_score: 55, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'candolim', name: 'Candolim Beach', latitude: 15.5187, longitude: 73.7634, current_score: 59, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'sinquerim', name: 'Sinquerim Beach', latitude: 15.4988, longitude: 73.7674, current_score: 66, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'miramar', name: 'Miramar Beach', latitude: 15.4800, longitude: 73.8080, current_score: 71, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'caranzalem', name: 'Caranzalem Beach', latitude: 15.4638, longitude: 73.8052, current_score: 76, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'dona-paula', name: 'Dona Paula', latitude: 15.4526, longitude: 73.8043, current_score: 81, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'bambolim', name: 'Bambolim Beach', latitude: 15.4518, longitude: 73.8504, current_score: 83, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'siridao', name: 'Siridao Beach', latitude: 15.4211, longitude: 73.8647, current_score: 85, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'bogmalo', name: 'Bogmalo Beach', latitude: 15.3697, longitude: 73.8340, current_score: 82, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'velsao', name: 'Velsao Beach', latitude: 15.3475, longitude: 73.8508, current_score: 77, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'cansaulim', name: 'Cansaulim Beach', latitude: 15.3340, longitude: 73.8682, current_score: 73, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'arossim', name: 'Arossim Beach', latitude: 15.3262, longitude: 73.8824, current_score: 79, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'utorda', name: 'Utorda Beach', latitude: 15.3129, longitude: 73.8966, current_score: 86, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'majorda', name: 'Majorda Beach', latitude: 15.3015, longitude: 73.9064, current_score: 89, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'betalbatim', name: 'Betalbatim Beach', latitude: 15.2858, longitude: 73.9144, current_score: 88, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'colva', name: 'Colva Beach', latitude: 15.2766, longitude: 73.9168, current_score: 79, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'sernabatim', name: 'Sernabatim Beach', latitude: 15.2635, longitude: 73.9213, current_score: 81, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'benaulim', name: 'Benaulim Beach', latitude: 15.2519, longitude: 73.9272, current_score: 85, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'varca', name: 'Varca Beach', latitude: 15.2227, longitude: 73.9317, current_score: 93, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'cavelossim', name: 'Cavelossim Beach', latitude: 15.1711, longitude: 73.9400, current_score: 95, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'mobor', name: 'Mobor Beach', latitude: 15.1517, longitude: 73.9482, current_score: 94, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'betul', name: 'Betul Beach', latitude: 15.1432, longitude: 73.9634, current_score: 90, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'canaguinim', name: 'Canaguinim Beach', latitude: 15.1213, longitude: 73.9850, current_score: 88, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'cabo-de-rama', name: 'Cabo de Rama', latitude: 15.0886, longitude: 73.9195, current_score: 85, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'agonda', name: 'Agonda Beach', latitude: 15.0416, longitude: 73.9880, current_score: 83, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'butterfly', name: 'Butterfly Beach', latitude: 15.0216, longitude: 73.9928, current_score: 96, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'palolem', name: 'Palolem Beach', latitude: 15.0095, longitude: 74.0232, current_score: 88, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'patnem', name: 'Patnem Beach', latitude: 15.0019, longitude: 74.0322, current_score: 91, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'rajbagh', name: 'Rajbagh Beach', latitude: 14.9922, longitude: 74.0411, current_score: 92, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'talpona', name: 'Talpona Beach', latitude: 14.9780, longitude: 74.0475, current_score: 87, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'galgibaga', name: 'Galgibaga Beach', latitude: 14.9602, longitude: 74.0519, current_score: 94, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() },
  { id: 'polem', name: 'Polem Beach', latitude: 14.9122, longitude: 74.0620, current_score: 88, ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.', last_updated: new Date().toISOString() }
];

const SCORE_HISTORY_MOCK = {
  baga:      [68, 71, 74, 70, 72, 69, 72],
  calangute: [78, 75, 71, 68, 66, 64, 65],
  anjuna:    [74, 76, 78, 79, 80, 80, 81],
  palolem:   [83, 84, 85, 86, 87, 87, 88],
  vagator:   [70, 67, 63, 60, 59, 58, 58],
};

// Use a global singleton for mock reports so they persist across API calls
// in the same process (avoids data loss on Next.js module re-use)
if (!global.__TIDELQ_REPORTS__) global.__TIDELQ_REPORTS__ = [];
const REPORTS_MOCK = global.__TIDELQ_REPORTS__;

if (!global.__TIDELQ_ISSUES__) {
  global.__TIDELQ_ISSUES__ = [
    { id: '11111111-1111-1111-1111-111111111111', title: 'Severe plastic pollution after tide', description: 'Massive amounts of plastic waste washed onto the shore near the northern rocks.', beach_id: 'anjuna', category: 'Pollution', created_by: 'anon', created_at: new Date(Date.now() - 3600000).toISOString(), status: 'Open' },
    { id: '22222222-2222-2222-2222-222222222222', title: 'Broken lifeguard chair', description: 'The main wooden chair is unstable and dangerous.', beach_id: 'baga', category: 'Infrastructure', created_by: 'anon', created_at: new Date(Date.now() - 86400000).toISOString(), status: 'In Progress' }
  ];
}
const ISSUES_MOCK = global.__TIDELQ_ISSUES__;

if (!global.__TIDELQ_VOTES__) {
  global.__TIDELQ_VOTES__ = [
    { id: 'v1', user_id: 'user1', issue_id: '11111111-1111-1111-1111-111111111111' },
    { id: 'v2', user_id: 'user2', issue_id: '11111111-1111-1111-1111-111111111111' },
    { id: 'v3', user_id: 'user3', issue_id: '22222222-2222-2222-2222-222222222222' }
  ];
}
const VOTES_MOCK = global.__TIDELQ_VOTES__;

// ─── Supabase Singleton ───────────────────────────────────────────────────────
let _sb = null;

function sb() {
  if (!_sb && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    _sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return _sb;
}

// ─── Query Functions ──────────────────────────────────────────────────────────

export async function getAllBeaches() {
  const client = sb();
  if (!client) return [...BEACHES_MOCK];
  const { data, error } = await client.from('beaches').select('*').order('name');
  if (error) { console.error('[db] getAllBeaches:', error.message); return [...BEACHES_MOCK]; }
  return data;
}

export async function getBeachById(id) {
  const client = sb();
  if (!client) return BEACHES_MOCK.find((b) => b.id === id) || null;
  const { data, error } = await client.from('beaches').select('*').eq('id', id).single();
  if (error) { console.error('[db] getBeachById:', error.message); return BEACHES_MOCK.find((b) => b.id === id) || null; }
  return data;
}

export async function getBeachHistory(beachId) {
  const client = sb();
  const fallback = (SCORE_HISTORY_MOCK[beachId] || []).map((score, i, arr) => ({
    score,
    recorded_at: new Date(Date.now() - (arr.length - 1 - i) * 24 * 60 * 60 * 1000).toISOString(),
  }));
  if (!client) return fallback;
  const { data, error } = await client
    .from('beach_scores')
    .select('score, recorded_at')
    .eq('beach_id', beachId)
    .order('recorded_at', { ascending: true })
    .limit(7);
  if (error) { console.error('[db] getBeachHistory:', error.message); return fallback; }
  return data.length > 0 ? data : fallback;
}

export async function getReportsForBeach(beachId, limit = 5) {
  const client = sb();
  if (!client) return REPORTS_MOCK.filter((r) => r.beach_id === beachId).slice(-limit);
  const { data, error } = await client
    .from('reports')
    .select('*')
    .eq('beach_id', beachId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('[db] getReportsForBeach:', error.message); return []; }
  return data;
}

export async function saveReport(report) {
  const client = sb();
  if (!client) {
    const newReport = { id: Date.now(), ...report, created_at: new Date().toISOString() };
    REPORTS_MOCK.push(newReport);
    return newReport;
  }
  const { data, error } = await client.from('reports').insert([report]).select().single();
  if (error) { console.error('[db] saveReport:', error.message); throw error; }
  return data;
}

// ─── Safety Zones Data ────────────────────────────────────────────────────────
const SAFETY_ZONES = {
  baga: {
    lifeguard: [
      { lat: 15.5575, lng: 73.7515, label: 'Main Lifeguard Tower' },
      { lat: 15.5548, lng: 73.7530, label: 'South Lifeguard Post' },
    ],
    danger: [
      { lat: 15.5590, lng: 73.7490, radius: 120, label: 'Rocky outcrop — strong undertow' },
      { lat: 15.5530, lng: 73.7545, radius: 80, label: 'Jet ski zone — no swimming' },
    ],
    entry: [
      { lat: 15.5565, lng: 73.7520, label: 'Safest entry — calm shallows' },
      { lat: 15.5555, lng: 73.7525, label: 'Secondary entry — near lifeguard' },
    ],
  },
  calangute: {
    lifeguard: [
      { lat: 15.5450, lng: 73.7548, label: 'Central Lifeguard Tower' },
      { lat: 15.5420, lng: 73.7562, label: 'South Lifeguard Post' },
    ],
    danger: [
      { lat: 15.5465, lng: 73.7535, radius: 100, label: 'Strong rip current zone' },
      { lat: 15.5410, lng: 73.7570, radius: 90, label: 'Boat anchoring area' },
    ],
    entry: [
      { lat: 15.5445, lng: 73.7550, label: 'Main beach entry — gradual slope' },
    ],
  },
  anjuna: {
    lifeguard: [
      { lat: 15.5745, lng: 73.7395, label: 'Beach Shack Lifeguard' },
    ],
    danger: [
      { lat: 15.5760, lng: 73.7380, radius: 150, label: 'Volcanic rock formations — very dangerous' },
      { lat: 15.5720, lng: 73.7415, radius: 80, label: 'Deep drop-off zone' },
    ],
    entry: [
      { lat: 15.5740, lng: 73.7400, label: 'Sandy entry between rocks' },
    ],
  },
  palolem: {
    lifeguard: [
      { lat: 15.0100, lng: 74.0225, label: 'North Lifeguard Tower' },
      { lat: 15.0080, lng: 74.0245, label: 'Central Lifeguard Post' },
    ],
    danger: [
      { lat: 15.0120, lng: 74.0200, radius: 100, label: 'Rocky headland — strong currents' },
    ],
    entry: [
      { lat: 15.0095, lng: 74.0230, label: 'Best entry — sheltered bay center' },
      { lat: 15.0085, lng: 74.0240, label: 'Gentle slope — family friendly' },
    ],
  },
  vagator: {
    lifeguard: [
      { lat: 15.5990, lng: 73.7440, label: 'Cliff-top Lifeguard Station' },
    ],
    danger: [
      { lat: 15.6005, lng: 73.7425, radius: 130, label: 'Basalt cliff base — falling rocks' },
      { lat: 15.5975, lng: 73.7460, radius: 100, label: 'Strong lateral current' },
    ],
    entry: [
      { lat: 15.5985, lng: 73.7445, label: 'Steps access — safest entry' },
    ],
  },
  arambol: {
    lifeguard: [{ lat: 15.6852, lng: 73.7022, label: 'Main Lifeguard Post' }],
    danger: [{ lat: 15.6870, lng: 73.7010, radius: 110, label: 'Rocky headland north' }],
    entry: [{ lat: 15.6845, lng: 73.7025, label: 'Central beach entry' }],
  },
  morjim: {
    lifeguard: [{ lat: 15.6175, lng: 73.7325, label: 'Turtle Nesting Patrol' }],
    danger: [{ lat: 15.6190, lng: 73.7310, radius: 200, label: 'Turtle nesting zone — restricted' }],
    entry: [{ lat: 15.6165, lng: 73.7335, label: 'South entry — open sand' }],
  },
  colva: {
    lifeguard: [
      { lat: 15.2770, lng: 73.9162, label: 'Main Lifeguard Tower' },
      { lat: 15.2750, lng: 73.9175, label: 'South Post' },
    ],
    danger: [{ lat: 15.2785, lng: 73.9155, radius: 90, label: 'Fishing net zone' }],
    entry: [{ lat: 15.2765, lng: 73.9168, label: 'Central sandy entry' }],
  },
  agonda: {
    lifeguard: [{ lat: 15.0420, lng: 73.9875, label: 'Beach Guard Station' }],
    danger: [{ lat: 15.0440, lng: 73.9860, radius: 120, label: 'Northern rock shelf' }],
    entry: [{ lat: 15.0415, lng: 73.9880, label: 'Mid-beach gentle entry' }],
  },
  candolim: {
    lifeguard: [{ lat: 15.5190, lng: 73.7628, label: 'Central Lifeguard' }],
    danger: [{ lat: 15.5210, lng: 73.7615, radius: 100, label: 'Fort Aguada rocks' }],
    entry: [{ lat: 15.5185, lng: 73.7632, label: 'Main entry — wide beach' }],
  },
  sinquerim: {
    lifeguard: [{ lat: 15.4992, lng: 73.7668, label: 'Resort Lifeguard' }],
    danger: [{ lat: 15.5005, lng: 73.7655, radius: 110, label: 'Fort Aguada reef' }],
    entry: [{ lat: 15.4985, lng: 73.7672, label: 'Sandy cove entry' }],
  },
  miramar: {
    lifeguard: [{ lat: 15.4805, lng: 73.8075, label: 'Promenade Lifeguard' }],
    danger: [{ lat: 15.4815, lng: 73.8065, radius: 80, label: 'River mouth current' }],
    entry: [{ lat: 15.4798, lng: 73.8082, label: 'Promenade beach access' }],
  },
  benaulim: {
    lifeguard: [{ lat: 15.2524, lng: 73.9268, label: 'Beach Shack Guard' }],
    danger: [{ lat: 15.2540, lng: 73.9258, radius: 70, label: 'Submerged rocks' }],
    entry: [{ lat: 15.2518, lng: 73.9272, label: 'Wide sandy entry' }],
  },
  cavelossim: {
    lifeguard: [{ lat: 15.1718, lng: 73.9395, label: 'Resort Guard Post' }],
    danger: [{ lat: 15.1730, lng: 73.9385, radius: 90, label: 'Creek mouth undertow' }],
    entry: [{ lat: 15.1710, lng: 73.9402, label: 'Resort beach access' }],
  },
};

// Generate default zones for beaches without specific data
function getDefaultZones(beach) {
  return {
    lifeguard: [{ lat: beach.latitude + 0.0005, lng: beach.longitude - 0.0005, label: 'Lifeguard Post' }],
    danger: [{ lat: beach.latitude + 0.001, lng: beach.longitude - 0.001, radius: 80, label: 'Rocky area' }],
    entry: [{ lat: beach.latitude - 0.0003, lng: beach.longitude + 0.0002, label: 'Beach entry point' }],
  };
}

export function getBeachZones(beachId, beach) {
  return SAFETY_ZONES[beachId] || (beach ? getDefaultZones(beach) : null);
}

export async function getTotalReportCount() {
  const client = sb();
  if (!client) return REPORTS_MOCK.length;
  const { count, error } = await client
    .from('reports')
    .select('*', { count: 'exact', head: true });
  if (error) { console.error('[db] getTotalReportCount:', error.message); return 0; }
  return count || 0;
}

export async function getReportsLast24h(beachId) {
  const client = sb();
  if (!client) {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return REPORTS_MOCK.filter(r => r.beach_id === beachId && new Date(r.created_at).getTime() > since).length;
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await client
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('beach_id', beachId)
    .gte('created_at', since);
  if (error) { console.error('[db] getReportsLast24h:', error.message); return 0; }
  return count || 0;
}

export async function updateBeachScore(beachId, score, attribution) {
  const client = sb();
  const now = new Date().toISOString();
  if (!client) {
    const beach = BEACHES_MOCK.find((b) => b.id === beachId);
    if (beach) {
      beach.current_score = score;
      beach.ai_attribution = attribution;
      beach.last_updated = now;
      const hist = SCORE_HISTORY_MOCK[beachId];
      if (hist) { hist.push(score); SCORE_HISTORY_MOCK[beachId] = hist.slice(-7); }
    }
    return;
  }
  await client.from('beaches').update({ current_score: score, ai_attribution: attribution, last_updated: now }).eq('id', beachId);
  await client.from('beach_scores').insert([{ beach_id: beachId, score, recorded_at: now }]);
}

// ─── Public Voting System for Issues ──────────────────────────────────────────

export async function getIssues() {
  const client = sb();

  const mockFallback = () => {
    return ISSUES_MOCK.map(issue => {
      const upvotes = VOTES_MOCK.filter(v => v.issue_id === issue.id && v.vote_type === 1).length;
      const downvotes = VOTES_MOCK.filter(v => v.issue_id === issue.id && v.vote_type === -1).length;
      return { ...issue, vote_count: upvotes - downvotes };
    }).sort((a, b) => b.vote_count - a.vote_count);
  };

  if (!client) {
    return mockFallback();
  }

  const { data, error } = await client
    .from('community_issues')
    .select(`
      *,
      creator:profiles(display_name),
      community_issue_votes (id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[db] Supabase getIssues failed (missing table?):', error.message);
    return mockFallback(); // Fallback to memory
  }

  return data.map(issue => {
    let vote_count = 0;
    if (issue.community_issue_votes && Array.isArray(issue.community_issue_votes)) {
      vote_count = issue.community_issue_votes.length;
    }
    const creator_name = issue.creator?.display_name || 'Anonymous';
    return { ...issue, vote_count, creator_name };
  }).sort((a, b) => b.vote_count - a.vote_count);
}

export async function createIssue(data) {
  const client = sb();

  const mockFallback = () => {
    const newIssue = {
      id: 'issue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      ...data,
      created_at: new Date().toISOString(),
      status: 'Open'
    };
    ISSUES_MOCK.push(newIssue);
    return newIssue;
  };

  if (!client) {
    return mockFallback();
  }

  const { data: result, error } = await client.from('community_issues').insert([data]).select().single();
  if (error) {
    console.warn('[db] Supabase createIssue failed (missing table?):', error.message);
    return mockFallback(); // Fallback to memory
  }
  return result;
}

export async function voteIssue(user_id, issue_id, vote_type) {
  const client = sb();

  const mockFallback = () => {
    const existingIndex = VOTES_MOCK.findIndex(v => v.user_id === user_id && v.issue_id === issue_id);
    if (existingIndex >= 0) {
      if (VOTES_MOCK[existingIndex].vote_type === vote_type) {
        // Toggle off if same vote
        VOTES_MOCK.splice(existingIndex, 1);
        return { message: 'Vote removed' };
      } else {
        VOTES_MOCK[existingIndex].vote_type = vote_type;
      }
    } else {
      VOTES_MOCK.push({ id: 'vote_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), user_id, issue_id, vote_type });
    }
    return { message: 'Vote cast' };
  };

  if (!client) {
    return mockFallback();
  }

  // With Supabase, check if vote exists
  const { data: existing, error: selectErr } = await client
    .from('community_issue_votes')
    .select('*')
    .eq('user_id', user_id)
    .eq('issue_id', issue_id)
    .single();

  if (selectErr && selectErr.code !== 'PGRST116') {
     console.warn('[db] Supabase community_issue_votes select failed:', selectErr.message);
     return mockFallback();
  }

  if (existing) {
    // Toggle off (delete)
    await client.from('community_issue_votes').delete().eq('id', existing.id);
    return { message: 'Vote removed' };
  } else {
    // Insert
    const { data, error } = await client.from('community_issue_votes').insert([{ user_id, issue_id }]).select();
    if (error) return mockFallback();
    return data;
  }
}

