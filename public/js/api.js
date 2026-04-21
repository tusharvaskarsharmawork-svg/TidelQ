// ═══════════════════════════════════════════════════════════════════════════
// public/js/api.js — Fetch wrapper with loading state + error handling
// ═══════════════════════════════════════════════════════════════════════════

const API = (() => {
  const BASE = window.location.origin;

  async function request(method, path, body = null, isForm = false) {
    const options = {
      method,
      headers: isForm ? {} : (body ? { 'Content-Type': 'application/json' } : {}),
    };
    if (body) {
      options.body = isForm ? body : JSON.stringify(body);
    }

    try {
      const res = await fetch(`${BASE}${path}`, options);
      const data = await res.json().catch(() => ({ error: 'Invalid JSON response' }));
      if (!res.ok) {
        console.error(`[API] ${method} ${path} → ${res.status}`, data);
        return { success: false, error: data.error || `HTTP ${res.status}`, status: res.status };
      }
      return { success: true, data, status: res.status };
    } catch (err) {
      console.error(`[API] ${method} ${path} → Network error:`, err.message);
      return { success: false, error: 'Network error — check your connection', status: 0 };
    }
  }

  return {
    get:  (path)               => request('GET',  path),
    post: (path, body)         => request('POST', path, body),
    upload: (path, formData)   => request('POST', path, formData, true),
  };
})();
