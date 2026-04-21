-- ═══════════════════════════════════════════════════════════════════════════
-- AntiGravity — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor: https://app.supabase.com → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Beaches table
CREATE TABLE IF NOT EXISTS beaches (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  latitude        DECIMAL(10, 7) NOT NULL,
  longitude       DECIMAL(10, 7) NOT NULL,
  current_score   INTEGER DEFAULT 75 CHECK (current_score BETWEEN 0 AND 100),
  ai_attribution  TEXT,
  last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- Historical score records (for sparklines)
CREATE TABLE IF NOT EXISTS beach_scores (
  id          SERIAL PRIMARY KEY,
  beach_id    TEXT NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community hazard reports
CREATE TABLE IF NOT EXISTS reports (
  id           SERIAL PRIMARY KEY,
  beach_id     TEXT NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  latitude     DECIMAL(10, 7),
  longitude    DECIMAL(10, 7),
  description  TEXT,
  image_url    TEXT,
  ai_tags      TEXT[] DEFAULT '{}',
  ai_severity  TEXT DEFAULT 'unknown' CHECK (ai_severity IN ('low', 'medium', 'high', 'unknown')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_beach_scores_beach_id   ON beach_scores(beach_id);
CREATE INDEX IF NOT EXISTS idx_beach_scores_recorded_at ON beach_scores(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_beach_id         ON reports(beach_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at       ON reports(created_at DESC);

-- Seed: 5 Goan beaches
INSERT INTO beaches (id, name, latitude, longitude, current_score, ai_attribution) VALUES
  ('baga',       'Baga Beach',      15.5562, 73.7525, 72, 'Moderate chlorophyll levels detected. Recent reports of plastic debris near northern shoreline.'),
  ('calangute',  'Calangute Beach', 15.5440, 73.7553, 65, 'Elevated SST (+1.2°C above baseline). High visitor density contributing to increased waste reports.'),
  ('anjuna',     'Anjuna Beach',    15.5738, 73.7403, 81, 'Clean water conditions. SST within normal range. Low hazard report density. Community cleanup effective.'),
  ('palolem',    'Palolem Beach',   15.0095, 74.0232, 88, 'Excellent environmental conditions. Clear water, minimal waste. Community conservation efforts successful.'),
  ('vagator',    'Vagator Beach',   15.5994, 73.7447, 58, 'Below-average safety score. Seasonal seaweed bloom detected via Copernicus satellite. Exercise caution.')
ON CONFLICT (id) DO NOTHING;

-- Seed: Historical score data (7 days per beach)
INSERT INTO beach_scores (beach_id, score, recorded_at) VALUES
  ('baga', 68, NOW() - INTERVAL '6 days'),
  ('baga', 71, NOW() - INTERVAL '5 days'),
  ('baga', 74, NOW() - INTERVAL '4 days'),
  ('baga', 70, NOW() - INTERVAL '3 days'),
  ('baga', 72, NOW() - INTERVAL '2 days'),
  ('baga', 69, NOW() - INTERVAL '1 day'),
  ('baga', 72, NOW()),

  ('calangute', 78, NOW() - INTERVAL '6 days'),
  ('calangute', 75, NOW() - INTERVAL '5 days'),
  ('calangute', 71, NOW() - INTERVAL '4 days'),
  ('calangute', 68, NOW() - INTERVAL '3 days'),
  ('calangute', 66, NOW() - INTERVAL '2 days'),
  ('calangute', 64, NOW() - INTERVAL '1 day'),
  ('calangute', 65, NOW()),

  ('anjuna', 74, NOW() - INTERVAL '6 days'),
  ('anjuna', 76, NOW() - INTERVAL '5 days'),
  ('anjuna', 78, NOW() - INTERVAL '4 days'),
  ('anjuna', 79, NOW() - INTERVAL '3 days'),
  ('anjuna', 80, NOW() - INTERVAL '2 days'),
  ('anjuna', 80, NOW() - INTERVAL '1 day'),
  ('anjuna', 81, NOW()),

  ('palolem', 83, NOW() - INTERVAL '6 days'),
  ('palolem', 84, NOW() - INTERVAL '5 days'),
  ('palolem', 85, NOW() - INTERVAL '4 days'),
  ('palolem', 86, NOW() - INTERVAL '3 days'),
  ('palolem', 87, NOW() - INTERVAL '2 days'),
  ('palolem', 87, NOW() - INTERVAL '1 day'),
  ('palolem', 88, NOW()),

  ('vagator', 70, NOW() - INTERVAL '6 days'),
  ('vagator', 67, NOW() - INTERVAL '5 days'),
  ('vagator', 63, NOW() - INTERVAL '4 days'),
  ('vagator', 60, NOW() - INTERVAL '3 days'),
  ('vagator', 59, NOW() - INTERVAL '2 days'),
  ('vagator', 58, NOW() - INTERVAL '1 day'),
  ('vagator', 58, NOW());

-- Storage bucket for report images (run in Supabase Storage UI or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true);
