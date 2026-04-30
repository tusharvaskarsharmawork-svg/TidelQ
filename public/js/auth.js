// ═══════════════════════════════════════════════════════════════════════════
// public/js/auth.js — Supabase browser auth (email/password + magic link)
// Exposes: window.Auth.init(), window.Auth.user, window.Auth.signOut()
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://nbhabuzspifmsmyixlgr.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaGFidXpzcGlmbXNteWl4bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODgxNjEsImV4cCI6MjA5MjI2NDE2MX0.UW8qPnRpN-7mE9BiJKV1h0rDlKpKljKhViUu4OEHM7Y';

// ─── Bootstrap Supabase client from CDN ──────────────────────────────────────
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
window.supabaseClient = _sb;

// ─── State ───────────────────────────────────────────────────────────────────
let _currentUser = null;
const _listeners  = [];

// ─── Auth Modal HTML ──────────────────────────────────────────────────────────
function injectModal() {
  if (document.getElementById('auth-modal')) return;

  const html = `
  <div id="auth-modal" style="
    display:none; position:fixed; inset:0; z-index:1000;
    background:rgba(3,7,18,0.85); backdrop-filter:blur(18px);
    align-items:center; justify-content:center;
  ">
    <div style="
      background:rgba(10,17,35,0.98); border:1px solid rgba(148,163,184,0.12);
      border-radius:16px; width:100%; max-width:400px; padding:32px 28px;
      box-shadow:0 24px 64px rgba(0,0,0,0.5); position:relative;
    ">
      <!-- Close -->
      <button id="auth-close" style="
        position:absolute; top:14px; right:16px; background:none; border:none;
        color:#64748b; font-size:22px; cursor:pointer; line-height:1;
      ">×</button>

      <!-- Logo + Title -->
      <div style="text-align:center; margin-bottom:24px">
        <svg width="36" height="36" viewBox="0 0 34 34" fill="none" style="margin:0 auto 10px">
          <polygon points="17,3 31,10 31,24 17,31 3,24 3,10" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" stroke-width="1.5"/>
          <polygon points="17,9 25,13.5 25,20.5 17,25 9,20.5 9,13.5" fill="rgba(56,189,248,0.35)" stroke="#38bdf8" stroke-width="1"/>
          <circle cx="17" cy="17" r="4" fill="#38bdf8"/>
        </svg>
        <h2 id="auth-title" style="color:#f1f5f9; font-size:20px; font-weight:800; margin:0">Sign in to TidelQ</h2>
        <p id="auth-subtitle" style="color:#64748b; font-size:13px; margin:6px 0 0">Help protect Goa's coastline by reporting hazards</p>
      </div>

      <!-- Error -->
      <div id="auth-error" style="
        display:none; background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.25);
        border-radius:8px; padding:10px 13px; color:#f87171; font-size:13px; margin-bottom:14px;
      "></div>

      <!-- Tabs -->
      <div style="display:flex; gap:0; margin-bottom:20px; background:rgba(18,28,50,0.65); border-radius:9px; padding:4px">
        <button id="tab-signin" onclick="Auth._tab('signin')" style="
          flex:1; padding:8px; border:none; border-radius:7px; font-size:13px; font-weight:600;
          cursor:pointer; transition:all .15s; background:#0ea5e9; color:#fff; font-family:inherit;
        ">Sign In</button>
        <button id="tab-signup" onclick="Auth._tab('signup')" style="
          flex:1; padding:8px; border:none; border-radius:7px; font-size:13px; font-weight:600;
          cursor:pointer; transition:all .15s; background:transparent; color:#64748b; font-family:inherit;
        ">Sign Up</button>
      </div>

      <!-- Fields -->
      <div style="display:flex; flex-direction:column; gap:12px">
        <div id="field-name" style="display:none">
          <label style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px">Display Name</label>
          <input id="auth-name" type="text" placeholder="Beach Guardian" style="
            width:100%; background:rgba(18,28,50,0.65); border:1px solid rgba(148,163,184,0.1);
            border-radius:8px; padding:10px 13px; color:#f1f5f9; font-size:14px; font-family:inherit;
            outline:none; box-sizing:border-box;
          "/>
        </div>
        <div>
          <label style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px">Email</label>
          <input id="auth-email" type="email" placeholder="you@example.com" style="
            width:100%; background:rgba(18,28,50,0.65); border:1px solid rgba(148,163,184,0.1);
            border-radius:8px; padding:10px 13px; color:#f1f5f9; font-size:14px; font-family:inherit;
            outline:none; box-sizing:border-box;
          "/>
        </div>
        <div>
          <label style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px">Password</label>
          <input id="auth-password" type="password" placeholder="••••••••" style="
            width:100%; background:rgba(18,28,50,0.65); border:1px solid rgba(148,163,184,0.1);
            border-radius:8px; padding:10px 13px; color:#f1f5f9; font-size:14px; font-family:inherit;
            outline:none; box-sizing:border-box;
          "/>
        </div>
        <button id="auth-submit" onclick="Auth._submit()" style="
          width:100%; background:linear-gradient(135deg,#0ea5e9,#2563eb); color:#fff;
          border:none; border-radius:9px; padding:12px; font-size:14px; font-weight:700;
          cursor:pointer; font-family:inherit; margin-top:4px; transition:all .15s;
        ">Sign In</button>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('auth-close').onclick = () => Auth.hideModal();
  document.getElementById('auth-modal').addEventListener('click', (e) => {
    if (e.target.id === 'auth-modal') Auth.hideModal();
  });
}

// ─── Auth Namespace ───────────────────────────────────────────────────────────
window.Auth = {
  get user() { return _currentUser; },

  async init(options = {}) {
    injectModal();
    const { data: { session } } = await _sb.auth.getSession();
    _currentUser = session?.user || null;
    
    _sb.auth.onAuthStateChange((_event, session) => {
      _currentUser = session?.user || null;
      _listeners.forEach((fn) => fn(_currentUser));
      this._updateUI();
      
      // If auth is required and user logs out, redirect to landing
      if (options.required && !_currentUser) {
        window.location.href = '/landing.html';
      }
    });

    this._updateUI();

    // Guard logic
    if (options.required && !_currentUser) {
      console.log("Auth required. Redirecting to landing...");
      window.location.href = '/landing.html';
      return null;
    }

    return _currentUser;
  },

  onUserChange(fn) { _listeners.push(fn); },

  showModal(tab = 'signin') {
    const m = document.getElementById('auth-modal');
    if (m) { m.style.display = 'flex'; this._tab(tab); }
  },
  hideModal() {
    const m = document.getElementById('auth-modal');
    if (m) m.style.display = 'none';
  },

  _tab(type) {
    const isSignup = type === 'signup';
    document.getElementById('tab-signin').style.cssText += isSignup
      ? ';background:transparent;color:#64748b' : ';background:#0ea5e9;color:#fff';
    document.getElementById('tab-signup').style.cssText += isSignup
      ? ';background:#0ea5e9;color:#fff' : ';background:transparent;color:#64748b';
    document.getElementById('auth-title').textContent     = isSignup ? 'Create Account' : 'Sign In';
    document.getElementById('auth-subtitle').textContent  = isSignup ? 'Join the TidelQ community' : 'Help protect Goa\'s coastline';
    document.getElementById('auth-submit').textContent    = isSignup ? 'Create Account' : 'Sign In';
    document.getElementById('field-name').style.display   = isSignup ? 'block' : 'none';
    document.getElementById('auth-error').style.display   = 'none';
    document.getElementById('auth-modal').dataset.tab     = type;
  },

  async _submit() {
    const tab      = document.getElementById('auth-modal').dataset.tab || 'signin';
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const name     = document.getElementById('auth-name')?.value.trim();
    const errEl    = document.getElementById('auth-error');
    const btn      = document.getElementById('auth-submit');

    errEl.style.display = 'none';
    if (!email || !password) { this._showErr('Email and password are required.'); return; }
    if (password.length < 6) { this._showErr('Password must be at least 6 characters.'); return; }

    btn.disabled = true;
    btn.textContent = tab === 'signup' ? 'Creating account…' : 'Signing in…';

    try {
      if (tab === 'signup') {
        const { error } = await _sb.auth.signUp({ email, password, options: { data: { display_name: name || email.split('@')[0] } } });
        if (error) throw error;
        this._showErr('Check your email to confirm your account! Then sign in.', '#4ade80');
      } else {
        const { error } = await _sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.hideModal();
        if (window.location.pathname.includes('landing.html') || window.location.pathname === '/') {
          window.location.href = '/dashboard.html';
        }
      }
    } catch (err) {
      this._showErr(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = tab === 'signup' ? 'Create Account' : 'Sign In';
    }
  },

  _showErr(msg, color = '#f87171') {
    const el = document.getElementById('auth-error');
    el.textContent   = msg;
    el.style.color   = color;
    el.style.display = 'block';
  },

  async signOut() {
    await _sb.auth.signOut();
  },

  getSession: () => _sb.auth.getSession(),

  _updateUI() {
    const user = _currentUser;
    // Update auth buttons wherever they exist
    document.querySelectorAll('[data-auth-btn]').forEach((el) => {
      if (user) {
        el.textContent = `👤 ${(user.email || '').split('@')[0]}`;
        el.onclick = () => Auth.signOut();
      } else {
        el.textContent = '🔑 Sign In';
        el.onclick = () => Auth.showModal();
      }
    });
  },

  // Returns a JWT token for API calls (or null if not logged in)
  async getToken() {
    const { data: { session } } = await _sb.auth.getSession();
    return session?.access_token || null;
  },
};
