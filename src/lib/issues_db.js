// ═══════════════════════════════════════════════════════════════════════════
// src/lib/issues_db.js — Dedicated Database logic for Community Issues
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

let _sb = null;
function sb() {
  if (!_sb && SUPABASE_URL && SUPABASE_KEY) {
    _sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _sb;
}

/**
 * Fetch all issues with their vote counts and creator info
 */
export async function getIssues() {
  const client = sb();
  if (!client) return [];

  const { data, error } = await client
    .from('issue_reports')
    .select(`
      *,
      creator:profiles(display_name),
      issue_votes(id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[issues_db] getIssues error:', error.message);
    return [];
  }

  return data.map(issue => ({
    ...issue,
    vote_count: issue.issue_votes?.length || 0,
    creator_name: issue.creator?.display_name || 'Anonymous'
  })).sort((a, b) => b.vote_count - a.vote_count);
}

/**
 * Create a new issue report
 */
export async function createIssue(data) {
  const client = sb();
  if (!client) throw new Error('Database not connected');

  const { data: result, error } = await client
    .from('issue_reports')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('[issues_db] createIssue error:', error.message);
    throw error;
  }
  return result;
}

/**
 * Toggle a vote for an issue
 */
export async function toggleVote(user_id, issue_id) {
  const client = sb();
  if (!client) throw new Error('Database not connected');

  // Check if already voted
  const { data: existing, error: selectErr } = await client
    .from('issue_votes')
    .select('*')
    .eq('user_id', user_id)
    .eq('issue_id', issue_id)
    .single();

  if (selectErr && selectErr.code !== 'PGRST116') {
    throw selectErr;
  }

  if (existing) {
    // Remove vote
    const { error } = await client
      .from('issue_votes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return { status: 'removed' };
  } else {
    // Add vote
    const { error } = await client
      .from('issue_votes')
      .insert([{ user_id, issue_id }]);
    if (error) throw error;
    return { status: 'added' };
  }
}
