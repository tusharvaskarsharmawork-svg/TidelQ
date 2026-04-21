import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE variables!");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BEACHES_MOCK = [
  { id: 'querim', name: 'Querim Beach', latitude: 15.7335, longitude: 73.6888, current_score: 91, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'arambol', name: 'Arambol Beach', latitude: 15.6847, longitude: 73.7029, current_score: 87, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'mandrem', name: 'Mandrem Beach', latitude: 15.6560, longitude: 73.7144, current_score: 84, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'ashwem', name: 'Ashwem Beach', latitude: 15.6322, longitude: 73.7196, current_score: 88, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'morjim', name: 'Morjim Beach', latitude: 15.6171, longitude: 73.7332, current_score: 75, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'vagator', name: 'Vagator Beach', latitude: 15.5994, longitude: 73.7447, current_score: 61, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'ozran', name: 'Ozran Beach', latitude: 15.5936, longitude: 73.7386, current_score: 68, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'anjuna', name: 'Anjuna Beach', latitude: 15.5738, longitude: 73.7403, current_score: 73, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'baga', name: 'Baga Beach', latitude: 15.5562, longitude: 73.7525, current_score: 64, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'calangute', name: 'Calangute Beach', latitude: 15.5440, longitude: 73.7553, current_score: 55, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'candolim', name: 'Candolim Beach', latitude: 15.5187, longitude: 73.7634, current_score: 59, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'sinquerim', name: 'Sinquerim Beach', latitude: 15.4988, longitude: 73.7674, current_score: 66, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'miramar', name: 'Miramar Beach', latitude: 15.4800, longitude: 73.8080, current_score: 71, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'caranzalem', name: 'Caranzalem Beach', latitude: 15.4638, longitude: 73.8052, current_score: 76, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'dona-paula', name: 'Dona Paula', latitude: 15.4526, longitude: 73.8043, current_score: 81, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'bambolim', name: 'Bambolim Beach', latitude: 15.4518, longitude: 73.8504, current_score: 83, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'siridao', name: 'Siridao Beach', latitude: 15.4211, longitude: 73.8647, current_score: 85, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'bogmalo', name: 'Bogmalo Beach', latitude: 15.3697, longitude: 73.8340, current_score: 82, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'velsao', name: 'Velsao Beach', latitude: 15.3475, longitude: 73.8508, current_score: 77, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'cansaulim', name: 'Cansaulim Beach', latitude: 15.3340, longitude: 73.8682, current_score: 73, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'arossim', name: 'Arossim Beach', latitude: 15.3262, longitude: 73.8824, current_score: 79, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'utorda', name: 'Utorda Beach', latitude: 15.3129, longitude: 73.8966, current_score: 86, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'majorda', name: 'Majorda Beach', latitude: 15.3015, longitude: 73.9064, current_score: 89, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'betalbatim', name: 'Betalbatim Beach', latitude: 15.2858, longitude: 73.9144, current_score: 88, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'colva', name: 'Colva Beach', latitude: 15.2766, longitude: 73.9168, current_score: 79, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'sernabatim', name: 'Sernabatim Beach', latitude: 15.2635, longitude: 73.9213, current_score: 81, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'benaulim', name: 'Benaulim Beach', latitude: 15.2519, longitude: 73.9272, current_score: 85, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'varca', name: 'Varca Beach', latitude: 15.2227, longitude: 73.9317, current_score: 93, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'cavelossim', name: 'Cavelossim Beach', latitude: 15.1711, longitude: 73.9400, current_score: 95, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'mobor', name: 'Mobor Beach', latitude: 15.1517, longitude: 73.9482, current_score: 94, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'betul', name: 'Betul Beach', latitude: 15.1432, longitude: 73.9634, current_score: 90, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'canaguinim', name: 'Canaguinim Beach', latitude: 15.1213, longitude: 73.9850, current_score: 88, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'cabo-de-rama', name: 'Cabo de Rama', latitude: 15.0886, longitude: 73.9195, current_score: 85, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'agonda', name: 'Agonda Beach', latitude: 15.0416, longitude: 73.9880, current_score: 83, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'butterfly', name: 'Butterfly Beach', latitude: 15.0216, longitude: 73.9928, current_score: 96, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'palolem', name: 'Palolem Beach', latitude: 15.0095, longitude: 74.0232, current_score: 88, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'patnem', name: 'Patnem Beach', latitude: 15.0019, longitude: 74.0322, current_score: 91, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'rajbagh', name: 'Rajbagh Beach', latitude: 14.9922, longitude: 74.0411, current_score: 92, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'talpona', name: 'Talpona Beach', latitude: 14.9780, longitude: 74.0475, current_score: 87, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'galgibaga', name: 'Galgibaga Beach', latitude: 14.9602, longitude: 74.0519, current_score: 94, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() },
  { id: 'polem', name: 'Polem Beach', latitude: 14.9122, longitude: 74.0620, current_score: 88, ai_attribution: 'Baseline environmental conditions standard.', last_updated: new Date().toISOString() }
];

async function seed() {
  console.log('Seeding 40 beaches to Supabase...');
  for (const beach of BEACHES_MOCK) {
    const { error } = await sb.from('beaches').upsert(beach);
    if (error) {
      console.error(`Failed to upsert ${beach.id}:`, error.message);
    } else {
      console.log(`Upserted ${beach.id}`);
    }
  }
  console.log('Done.');
}

seed();
