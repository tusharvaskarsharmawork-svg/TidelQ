// ═══════════════════════════════════════════════════════════════════════════
// public/js/report.js — Hazard report form: upload, geolocation, submit
// ═══════════════════════════════════════════════════════════════════════════

const form        = document.getElementById('hazard-form');
const imageInput  = document.getElementById('image-input');
const uploadZone  = document.getElementById('upload-zone');
const preview     = document.getElementById('preview');
const locBtn      = document.getElementById('geo-btn');
const locStatus   = document.getElementById('loc-status');
const submitBtn   = document.getElementById('submit-btn');
const successBox  = document.getElementById('success-box');
const formCard    = document.getElementById('form-card');
const beachSelect = document.getElementById('beach-select');

let locationCaptured = { lat: null, lng: null };
let capturedBase64   = null;
let capturedMime     = 'image/jpeg';

// ─── Auto-populate beach from URL ?beach=baga ─────────────────────────────
(function prefillBeach() {
  const params = new URLSearchParams(window.location.search);
  const beach  = params.get('beach');
  if (beach && beachSelect) {
    const opt = beachSelect.querySelector(`option[value="${beach}"]`);
    if (opt) beachSelect.value = beach;
  }
})();

// ─── Image Upload & Preview ───────────────────────────────────────────────────
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  readAndPreview(file);
});

// Drag-and-drop
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    imageInput.files = dt.files;
    readAndPreview(file);
  }
});

function readAndPreview(file) {
  capturedMime = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = (e) => {
    capturedBase64 = e.target.result.split(',')[1];
    preview.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById('upload-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ─── Geolocation ─────────────────────────────────────────────────────────────
locBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    locStatus.textContent = 'Geolocation not supported by your browser.';
    return;
  }
  locBtn.disabled = true;
  locStatus.textContent = 'Detecting location…';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locationCaptured.lat = pos.coords.latitude;
      locationCaptured.lng = pos.coords.longitude;
      locStatus.textContent = `📍 ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      locBtn.disabled = false;
      locBtn.style.borderColor = 'rgba(74,222,128,0.5)';
      locBtn.style.color = '#4ade80';
      locBtn.innerHTML = `
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Location Captured`;
    },
    () => {
      locStatus.textContent = 'Location access denied. You can submit without it.';
      locBtn.disabled = false;
    },
    { timeout: 10000, maximumAge: 60000 }
  );
});

// ─── Validation Helpers ───────────────────────────────────────────────────────
function showInlineError(msg) {
  // Show right above the submit button
  const inlineErr = document.getElementById('submit-error');
  if (inlineErr) {
    inlineErr.textContent = msg;
    inlineErr.style.display = 'block';
    inlineErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { inlineErr.style.display = 'none'; }, 6000);
  }
}

function highlightBeachSelect(hasError) {
  if (!beachSelect) return;
  beachSelect.style.borderColor = hasError ? 'rgba(248,113,113,0.6)' : '';
  beachSelect.style.boxShadow   = hasError ? '0 0 0 3px rgba(248,113,113,0.12)' : '';
  const beachErr = document.getElementById('beach-error');
  if (beachErr) beachErr.style.display = hasError ? 'block' : 'none';
  if (hasError) beachSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Clear beach highlight when user selects
beachSelect.addEventListener('change', () => highlightBeachSelect(false));

// ─── Form Submission ──────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const beachId     = beachSelect.value;
  const description = document.getElementById('description').value.trim();
  const severity    = document.querySelector('input[name="severity"]:checked')?.value || 'medium';

  // ── Validation ──────────────────────────────────────────────────────────
  if (!beachId) {
    highlightBeachSelect(true);
    showInlineError('⚠ Please scroll up and select a beach first.');
    return;
  }
  highlightBeachSelect(false);

  // ── Loading state ────────────────────────────────────────────────────────
  submitBtn.disabled  = true;
  submitBtn.innerHTML = `
    <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
    Analysing with AI…`;

  // ── Build JSON payload ───────────────────────────────────────────────────
  const payload = {
    beach_id:     beachId,
    description,
    severity,
    latitude:     locationCaptured.lat || 0,
    longitude:    locationCaptured.lng || 0,
    image_base64: capturedBase64 || null,
    image_mime:   capturedMime,
  };

  // ── Auth token (optional) ────────────────────────────────────────────────
  const headers = { 'Content-Type': 'application/json' };
  try {
    if (typeof Auth !== 'undefined' && Auth.getToken) {
      const token = await Auth.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (_) { /* anonymous submission — fine */ }

  // ── Send to API ──────────────────────────────────────────────────────────
  let result;
  try {
    const res  = await fetch('/api/reports/submit', {
      method:  'POST',
      headers,
      body:    JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({ error: 'Invalid server response' }));
    result = res.ok
      ? { success: true, data }
      : { success: false, error: data.error || `Server error (HTTP ${res.status})` };
  } catch (err) {
    result = { success: false, error: 'Network error — check your connection.' };
  }

  submitBtn.disabled = false;
  resetSubmitBtn();

  if (result.success) {
    showSuccess(result.data?.ai_categorisation);
  } else {
    showInlineError('❌ ' + (result.error || 'Submission failed. Please try again.'));
  }
});

function resetSubmitBtn() {
  submitBtn.innerHTML = `
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
    </svg>
    Submit Report`;
}

function showSuccess(aiResult) {
  const formContent = document.getElementById('form-content');
  if (formContent) formContent.style.display = 'none';
  if (successBox) {
    successBox.style.display = 'flex';
    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (aiResult?.tags?.length) {
    const tagsEl = document.getElementById('success-tags');
    if (tagsEl) tagsEl.textContent = `AI detected: ${aiResult.tags.join(', ')}`;
  }

  // Auto-redirect after 4 seconds
  setTimeout(() => { window.location.href = '/index.html'; }, 4000);
}

// CSS spin for loading state
const spinStyle = document.createElement('style');
spinStyle.textContent = `.spin { animation: spin 0.9s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);
