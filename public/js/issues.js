/**
 * issues.js — Handles the Public Voting System for Coastal Issues
 */

// ─── INIT & LOCAL USER ────────────────────────────────────────────────────────
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
  
  // Load data first so the page isn't empty
  try {
    await Promise.all([loadBeaches(), loadIssues()]);
  } catch (err) {
    console.error('[Issues] Data load failed:', err);
  }

  // Then handle auth
  if (window.Auth) {
    try {
      await Auth.init();
    } catch (err) {
      console.error('[Issues] Auth init failed:', err);
    }
  }

  DOM.filterCat?.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderIssues();
  });

  DOM.form?.addEventListener('submit', handleFormSubmit);
}

async function loadBeaches() {
  try {
    const res = await fetch('/assets/beaches.json');
    const data = await res.json();
    
    // Check if it's a FeatureCollection (GeoJSON) or array
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      allBeaches = data.features.map(f => f.properties);
    } else {
      allBeaches = data;
    }

    allBeaches.sort((a,b) => a.name.localeCompare(b.name));
    
    // Populate select
    DOM.beachSelect.innerHTML = `<option value="" disabled selected>Select Beach</option>` + 
      allBeaches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  } catch (err) {
    console.error('Failed to load beaches JSON', err);
  }
}

function getBeachName(id) {
  const b = allBeaches.find(x => x.id === id);
  return b ? b.name : id;
}

async function loadIssues() {
  try {
    const res = await fetch('/api/issues');
    if (!res.ok) throw new Error('API failed');
    allIssues = await res.json();
    renderIssues();
  } catch (err) {
    DOM.feed.innerHTML = `<div class="p-4 text-center text-[var(--coral)]">Failed to load issues. Ensure server is running.</div>`;
  }
}

function renderIssues() {
  const filtered = currentFilter === 'All' 
    ? allIssues 
    : allIssues.filter(i => i.category === currentFilter);

  DOM.count.textContent = filtered.length;

  if (filtered.length === 0) {
    DOM.feed.innerHTML = `<div class="text-center text-[var(--text-2)] py-10">No issues found. Raise one!</div>`;
    return;
  }

  DOM.feed.innerHTML = filtered.map(issue => {
    const isHighPriority = issue.vote_count >= 10;
    const isTrendingClass = isHighPriority ? 'trending' : '';
    const statusClass = issue.status ? issue.status.toLowerCase().replace(' ', '') : 'open';
    const statusText = issue.status || 'Open';

    // Check if current user has already voted on this mockingly
    // Without full backend tracking who voted, we rely on localstorage + backend
    // Since backend returns global count, we'll store local votes in localstorage to show active state
    const localVotes = JSON.parse(localStorage.getItem('my_votes') || '{}');
    const myVote = localVotes[issue.id] || 0;
    const upvotedClass = myVote === 1 ? 'voted' : '';
    const downvotedClass = myVote === -1 ? 'voted' : '';

    return `
      <div class="issue-card flex gap-4 ${isTrendingClass}" data-id="${issue.id}">
        <!-- Voting Col -->
        <div class="flex flex-col items-center gap-1">
          <button class="vote-btn upvote ${upvotedClass}" onclick="castVote('${issue.id}', 1)">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
            <span class="font-bold text-lg mt-1" id="count-${issue.id}">${issue.vote_count}</span>
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
              <span>📍</span> <span>${escapeHTML(getBeachName(issue.beach_id))}</span>
            </div>
            <div class="w-1 h-1 bg-[var(--text-3)] rounded-full"></div>
            <span class="category-chip">${escapeHTML(issue.category || 'General')}</span>
            <div class="w-1 h-1 bg-[var(--text-3)] rounded-full"></div>
            <span class="status-pill ${statusClass}">${escapeHTML(statusText)}</span>
          </div>

          ${issue.description ? `<p class="text-[var(--text-2)] text-sm mb-3 whitespace-pre-wrap">${escapeHTML(issue.description)}</p>` : ''}
          
          <div class="text-xs text-[var(--text-3)] flex items-center justify-between">
            <span>By ${escapeHTML(issue.creator_name || issue.created_by)}</span>
            <span>${timeAgo(issue.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

window.castVote = async function(issueId, newVote) {
  // Local state tracking
  const localVotes = JSON.parse(localStorage.getItem('my_votes') || '{}');
  const currentVote = localVotes[issueId] || 0;
  
  // Toggle off if clicking the same vote
  const finalVote = currentVote === newVote ? 0 : newVote;

    const user = getCurrentUser();
    if (!user) {
      Auth?.showModal('signin');
      return;
    }

    const res = await fetch('/api/issues/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue_id: issueId, user_id: user.id, vote_type: finalVote })
    });
    if (!res.ok) throw new Error('API Error');

    // Update local cache
    if (finalVote === 0) delete localVotes[issueId];
    else localVotes[issueId] = finalVote;
    localStorage.setItem('my_votes', JSON.stringify(localVotes));

    // Refetch and render
    await loadIssues();

  } catch (err) {
    console.error('Vote failed', err);
    alert('Failed to register vote. Server may be down.');
  }
};

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const originalBtnHTML = DOM.submitBtn.innerHTML;
  DOM.submitBtn.innerHTML = 'Submitting...';
  DOM.submitBtn.disabled = true;

  const user = getCurrentUser();
  if (!user) {
    Auth?.showModal('signin');
    DOM.submitBtn.innerHTML = originalBtnHTML;
    DOM.submitBtn.disabled = false;
    return;
  }

  const data = {
    title: document.getElementById('issue-title').value,
    beach_id: document.getElementById('issue-beach').value,
    category: document.getElementById('issue-category').value,
    description: document.getElementById('issue-desc').value,
    created_by: user.id
  };

  try {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API Error');

    // Reset form
    DOM.form.reset();
    
    // Automatically upvote own issue
    const newIssue = await res.json();
    if (newIssue && newIssue.id) {
      await castVote(newIssue.id, 1);
    } else {
      await loadIssues();
    }

  } catch (err) {
    console.error(err);
    alert('Failed to submit issue.');
  } finally {
    DOM.submitBtn.innerHTML = originalBtnHTML;
    DOM.submitBtn.disabled = false;
  }
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

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
