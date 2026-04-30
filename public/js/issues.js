/**
 * issues.js — Handles the Public Voting System for Coastal Issues
 * Refactored to use the public_issues table directly via Supabase client
 * and connected to beaches/profiles tables.
 */

// ─── AUTH & USER ─────────────────────────────────────────────────────────────
const getCurrentUser = () => window.Auth?.user;

// ─── STATE ────────────────────────────────────────────────────────────────────
let allIssues = [];
let allBeaches = [];
let currentFilter = 'All';

// ─── DOM MAP ──────────────────────────────────────────────────────────────────
const DOM = {
  feed: document.getElementById('issues-feed'),
  count: document.getElementById('issues-count'),
  filterCat: document.getElementById('filter-category'),
  form: document.getElementById('raise-issue-form'),
  beachSelect: document.getElementById('issue-beach'),
  submitBtn: document.getElementById('submit-issue-btn')
};

// ─── FETCH & RENDER ───────────────────────────────────────────────────────────

async function init() {
  console.log('[Issues] Initializing...');
  
  // Handle auth
  if (window.Auth) {
    try {
      await Auth.init();
    } catch (err) {
      console.error('[Issues] Auth init failed:', err);
    }
  }

  // Load data
  try {
    // 1. Load beaches from DB
    await loadBeachesFromDB();
    // 2. Load issues with Profile names
    await loadIssuesWithProfiles();
  } catch (err) {
    console.error('[Issues] Data load failed:', err);
  }

  DOM.filterCat?.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderIssues();
  });

  DOM.form?.addEventListener('submit', handleFormSubmit);
}

async function loadBeachesFromDB() {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    const { data, error } = await supabase
      .from('beaches')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    
    allBeaches = data || [];
    
    if (DOM.beachSelect) {
      DOM.beachSelect.innerHTML = `<option value="" disabled selected>Select Beach</option>` + 
        allBeaches.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
    }
  } catch (err) {
    console.error('Failed to load beaches from DB', err);
  }
}

async function loadIssuesWithProfiles() {
  // Show skeleton loading state
  DOM.feed.innerHTML = `
    <div class="issue-card animate-pulse flex gap-5">
      <div class="w-16 h-20 bg-[rgba(255,255,255,0.05)] rounded-xl"></div>
      <div class="flex-1 space-y-3">
        <div class="h-6 bg-[rgba(255,255,255,0.05)] rounded w-3/4"></div>
        <div class="h-4 bg-[rgba(255,255,255,0.05)] rounded w-1/4"></div>
        <div class="h-10 bg-[rgba(255,255,255,0.05)] rounded w-full"></div>
      </div>
    </div>
  `;

  try {
    const supabase = window.supabaseClient;
    if (!supabase) throw new Error("Supabase client not initialized.");

    // Fetch issues and join with profiles to get display_name
    const { data, error } = await supabase
      .from("public_issues")
      .select(`
        *,
        profiles:user_id (display_name)
      `)
      .order("votes", { ascending: false });

    if (error) throw error;

    allIssues = data || [];
    renderIssues();
  } catch (err) {
    console.error('[Issues] Load error:', err);
    DOM.feed.innerHTML = `
      <div class="p-6 text-center bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] rounded-xl text-[#f87171]">
        Failed to load issues. Please try refreshing the page.
      </div>`;
  }
}

function renderIssues() {
  const filtered = currentFilter === 'All' 
    ? allIssues 
    : allIssues.filter(i => i.category === currentFilter);

  if (DOM.count) DOM.count.textContent = filtered.length;

  if (filtered.length === 0) {
    DOM.feed.innerHTML = `<div class="text-center text-[var(--text-2)] py-10">No issues yet. Be the first to raise one!</div>`;
    return;
  }

  const localVotes = JSON.parse(localStorage.getItem('my_public_issues_votes') || '{}');

  DOM.feed.innerHTML = filtered.map(issue => {
    const isHighPriority = issue.votes >= 10;
    const isTrendingClass = isHighPriority ? 'trending' : '';
    const statusClass = issue.status ? issue.status.toLowerCase().replace(' ', '') : 'open';
    const statusText = issue.status || 'open';
    const reporterName = issue.profiles?.display_name || 'Anonymous User';

    const myVote = localVotes[issue.id] || 0;
    const upvotedClass = myVote === 1 ? 'voted' : '';

    return `
      <div class="issue-card flex gap-4 ${isTrendingClass}" data-id="${issue.id}">
        <!-- Voting Col -->
        <div class="flex flex-col items-center gap-1">
          <button class="vote-btn upvote ${upvotedClass}" onclick="castVote('${issue.id}', ${issue.votes}, ${myVote})">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
            <span class="font-bold text-lg mt-1" id="count-${issue.id}">${issue.votes || 0}</span>
          </button>
        </div>

        <!-- Content Col -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between flex-wrap gap-2 mb-1">
            <h4 class="font-bold text-lg text-white leading-tight">${escapeHTML(issue.title)}</h4>
            ${isHighPriority ? '<span class="text-xs font-bold text-[#FFB347] bg-[#FFB347]/10 px-2 py-1 rounded">🔥 Trending</span>' : ''}
          </div>
          
          <div class="flex items-center gap-3 text-sm text-[var(--text-2)] mb-3">
            <div class="flex items-center gap-1">
              <span>📍</span> <span>${escapeHTML(issue.beach_location || 'Unknown')}</span>
            </div>
            <div class="w-1 h-1 bg-[var(--text-3)] rounded-full"></div>
            <span class="category-chip">${escapeHTML(issue.category || 'General')}</span>
            <div class="w-1 h-1 bg-[var(--text-3)] rounded-full"></div>
            <span class="status-pill ${statusClass}">${escapeHTML(statusText)}</span>
          </div>

          ${issue.description ? `<p class="text-[var(--text-2)] text-sm mb-3 whitespace-pre-wrap">${escapeHTML(issue.description)}</p>` : ''}
          
          <div class="text-xs text-[var(--text-3)] flex items-center justify-between">
            <span>Reported by <b>${escapeHTML(reporterName)}</b></span>
            <span>${timeAgo(issue.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

window.castVote = async function(issueId, currentVotes, currentLocalVoteState) {
  const isCurrentlyUpvoted = currentLocalVoteState === 1;
  const newVoteDelta = isCurrentlyUpvoted ? -1 : 1;
  const newTotalVotes = currentVotes + newVoteDelta;
  
  const localVotes = JSON.parse(localStorage.getItem('my_public_issues_votes') || '{}');
  if (isCurrentlyUpvoted) {
    delete localVotes[issueId];
  } else {
    localVotes[issueId] = 1;
  }
  localStorage.setItem('my_public_issues_votes', JSON.stringify(localVotes));

  const countSpan = document.getElementById(`count-${issueId}`);
  if (countSpan) countSpan.textContent = newTotalVotes;
  
  const btn = countSpan?.closest('.vote-btn');
  if (btn) {
    if (isCurrentlyUpvoted) btn.classList.remove('voted');
    else btn.classList.add('voted');
  }

  const issueRef = allIssues.find(i => i.id === issueId);
  if (issueRef) issueRef.votes = newTotalVotes;

  try {
    const supabase = window.supabaseClient;
    
    const { data: fetchRes, error: fetchErr } = await supabase
        .from('public_issues')
        .select('votes')
        .eq('id', issueId)
        .single();
        
    if (fetchErr) throw fetchErr;

    const actualNewTotal = (fetchRes.votes || 0) + newVoteDelta;

    const { error: updateErr } = await supabase
      .from('public_issues')
      .update({ votes: actualNewTotal })
      .eq('id', issueId);

    if (updateErr) throw updateErr;
  } catch (err) {
    console.error('Vote sync failed', err);
    if (isCurrentlyUpvoted) localVotes[issueId] = 1;
    else delete localVotes[issueId];
    localStorage.setItem('my_public_issues_votes', JSON.stringify(localVotes));
    if (issueRef) issueRef.votes = currentVotes;
    renderIssues();
  }
};

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const originalBtnHTML = DOM.submitBtn.innerHTML;
  DOM.submitBtn.innerHTML = 'Submitting...';
  DOM.submitBtn.disabled = true;

  const user = getCurrentUser();

  const data = {
    title: document.getElementById('issue-title').value,
    beach_location: document.getElementById('issue-beach').value,
    category: document.getElementById('issue-category').value,
    description: document.getElementById('issue-desc').value,
    status: 'open',
    votes: 0,
    user_id: user ? user.id : null // Link to profile if logged in
  };

  try {
    const supabase = window.supabaseClient;
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { error } = await supabase.from("public_issues").insert([data]);

    if (error) throw error;

    DOM.form.reset();
    showToast('Issue raised successfully!');
    await loadIssuesWithProfiles();

  } catch (err) {
    console.error(err);
    alert('Failed to submit issue. Please try again.');
  } finally {
    DOM.submitBtn.innerHTML = originalBtnHTML;
    DOM.submitBtn.disabled = false;
  }
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-[#4ECDC4] text-gray-900 font-bold px-4 py-2 rounded shadow-lg z-50 transform transition-all duration-300 translate-y-0 opacity-100';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function timeAgo(dateParam) {
  if (!dateParam) return '';
  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const today = new Date();
  const seconds = Math.round((today - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 5) return 'just now';
  else if (seconds < 60) return seconds + ' seconds ago';
  else if (seconds < 90) return 'about a minute ago';
  else if (minutes < 60) return minutes + ' mins ago';
  else if (hours < 24) return hours + ' hours ago';
  else if (days === 1) return 'Yesterday';
  else return days + ' days ago';
}

// Start
document.addEventListener('DOMContentLoaded', init);
