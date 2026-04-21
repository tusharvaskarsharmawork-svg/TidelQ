// ═══════════════════════════════════════════════════════════════════════════
// map.js — TidelQ v2.0: Full coastal intelligence frontend
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────
  let _beaches = [];
  let _selectedBeach = null;
  let _sparkChart = null;
  let _tideChart = null;
  let _map = null;
  let _markers = {};
  let _zoneLayers = { lifeguard: [], danger: [], entry: [] };
  let _layerState = { zones: false, aqi: false, crowd: false };
  let _previousScores = {};

  // ─── Color helpers ──────────────────────────────────────────────
  function scoreColor(s) {
    if (s >= 80) return '#4ade80'; // Green = Safe
    if (s >= 50) return '#facc15'; // Yellow = Moderate
    return '#f87171'; // Red = Dangerous
  }
  function statusClass(s) {
    if (s >= 80) return 'safe';
    if (s >= 50) return 'caution';
    return 'danger';
  }
  function statusLabel(s) {
    if (s >= 80) return 'SAFE';
    if (s >= 50) return 'MODERATE';
    return 'DANGER';
  }
  function gradeClass(grade) {
    if (!grade) return 'grade-b';
    const g = grade.charAt(0).toLowerCase();
    if (g === 'a') return 'grade-a';
    if (g === 'b') return 'grade-b';
    if (g === 'c') return 'grade-c';
    if (g === 'd') return 'grade-d';
    return 'grade-f';
  }

  // ─── Init Map ───────────────────────────────────────────────────
  async function initMap() {
    _map = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [73.87, 15.35],
      zoom: 10.2,
      attributionControl: false,
    });

    _map.addControl(new maplibregl.NavigationControl(), 'top-left');

    _map.on('load', async () => {
      await loadBeaches();
      setupSearch();
      setupSOS();
      setupLayerToggles();
      // Auto-refresh every 10 seconds for real-time hackathon demo
      setInterval(loadBeaches, 10000);
    });
  }

  // ─── Load Beaches ───────────────────────────────────────────────
  async function loadBeaches() {
    try {
      const res = await fetch('/api/beaches');
      const data = await res.json();
      _beaches = data.beaches || data;

      // ── Real-time Danger Alerts tracking ──
      _beaches.forEach(b => {
        const prev = _previousScores[b.id];
        // If score drops from safe/moderate into danger zone, trigger alert
        if (prev !== undefined && prev >= 50 && b.current_score < 50) {
          sendDangerAlert(b.name, b.current_score);
        }
        _previousScores[b.id] = b.current_score;
      });

    } catch (err) {
      console.error('[map] Failed to load beaches:', err);
      return;
    }

    // Update stats
    document.getElementById('beaches-count').textContent = _beaches.length;
    const scores = _beaches.map(b => b.current_score);
    const avg = Math.round(scores.reduce((a, v) => a + v, 0) / scores.length);
    document.getElementById('avg-score').textContent = avg;
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    renderBeachList(_beaches);
    updateMarkers();
  }

  // ─── Render Beach List ──────────────────────────────────────────
  function renderBeachList(beaches) {
    const container = document.getElementById('beach-list');
    container.innerHTML = beaches.map(b => {
      const c = scoreColor(b.current_score);
      return `
        <div class="beach-list-item" onclick="selectBeach('${b.id}')">
          <div class="beach-score-dot" style="background:${c}20;color:${c};border:2px solid ${c}40">${b.current_score}</div>
          <div class="flex-1 min-w-0">
            <div class="text-white font-semibold text-sm truncate">${b.name}</div>
            <div style="color:#64748b;font-size:11px">${b.latitude.toFixed(4)}°N, ${b.longitude.toFixed(4)}°E</div>
          </div>
          <span class="status-badge ${statusClass(b.current_score)}">${statusLabel(b.current_score)}</span>
        </div>`;
    }).join('');
  }

  // ─── Map Markers ────────────────────────────────────────────────
  function updateMarkers() {
    // Clear old
    Object.values(_markers).forEach(m => m.remove());
    _markers = {};

    _beaches.forEach(b => {
      const el = document.createElement('div');
      el.className = 'beach-marker';
      const c = scoreColor(b.current_score);
      Object.assign(el.style, {
        width: '18px', height: '18px', borderRadius: '50%',
        background: c, border: '2.5px solid white',
        boxShadow: `0 0 12px ${c}90, 0 2px 6px rgba(0,0,0,0.5)`,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      });
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([b.longitude, b.latitude])
        .addTo(_map);

      el.addEventListener('click', () => selectBeach(b.id));
      _markers[b.id] = marker;
    });
  }

  // ─── Select Beach (Detail View) ─────────────────────────────────
  window.selectBeach = async function (beachId) {
    _selectedBeach = beachId;
    const beach = _beaches.find(b => b.id === beachId);
    if (!beach) return;

    // Show detail panel
    document.getElementById('beach-list-panel').classList.add('hidden');
    document.getElementById('beach-detail-panel').classList.remove('hidden');

    // Set basic info
    document.getElementById('detail-name').textContent = beach.name;
    document.getElementById('detail-score').textContent = beach.current_score;
    document.getElementById('detail-score').style.color = scoreColor(beach.current_score);
    document.getElementById('detail-status-badge').textContent = statusLabel(beach.current_score);
    document.getElementById('detail-status-badge').className = `status-badge ${statusClass(beach.current_score)}`;

    // Update report links
    const rl1 = document.getElementById('report-link-detail');
    const rl2 = document.getElementById('report-cta-link');
    if (rl1) rl1.href = `/report.html?beach=${beachId}`;
    if (rl2) rl2.href = `/report.html?beach=${beachId}`;

    // Score ring animation
    const arc = document.getElementById('score-arc');
    const pct = beach.current_score / 100;
    const circumference = 2 * Math.PI * 66;
    arc.style.stroke = scoreColor(beach.current_score);
    setTimeout(() => { arc.setAttribute('stroke-dashoffset', circumference * (1 - pct)); }, 50);

    // Grade indicator
    document.getElementById('grade-indicator').style.left = `${beach.current_score}%`;

    // Fly to
    _map.flyTo({ center: [beach.longitude, beach.latitude], zoom: 13.5, duration: 1200 });

    // Fetch full detail
    try {
      const res = await fetch(`/api/beaches/${beachId}`);
      const detail = await res.json();
      populateDetail(detail);
    } catch (err) {
      console.error('[map] Detail fetch failed:', err);
    }
  };

  // ─── Populate Detail Panel ──────────────────────────────────────
  function populateDetail(detail) {
    const sat = detail.satellite_data || {};
    const marine = detail.marine_data || {};
    const aqi = detail.air_quality || {};
    const crowd = detail.crowd_estimate || {};
    const zones = detail.safety_zones || {};
    const reports = detail.reports || [];

    // ── Satellite data ──
    document.getElementById('detail-sst').textContent = sat.sst ? `${sat.sst}°C` : '—';
    document.getElementById('detail-wind').textContent = sat.wind_speed ? `${sat.wind_speed} km/h` : '—';
    document.getElementById('detail-chlor').textContent = sat.chlorophyll ? `${sat.chlorophyll} mg/m³` : '—';
    document.getElementById('detail-turb').textContent = sat.turbidity ? `${sat.turbidity} NTU` : '—';

    // ── Weather alert ──
    const alertEl = document.getElementById('weather-alert');
    const weather = sat.weather_condition || '';
    if (weather.includes('Thunderstorm') || weather.includes('Rain') || weather.includes('Heavy')) {
      alertEl.classList.add('active');
      document.getElementById('weather-alert-text').textContent = `⚠ ${weather} — Exercise extreme caution`;
    } else {
      alertEl.classList.remove('active');
    }

    // ── Beach grade ──
    const gradeEl = document.getElementById('detail-grade');
    // We'll get grade from AI score call
    triggerAIScore(detail);

    // ── Marine / Tide ──
    const mc = marine.current || {};
    document.getElementById('detail-wave-ht').textContent = mc.wave_height != null ? `${mc.wave_height}m` : '—';
    document.getElementById('detail-swell').textContent = mc.swell_wave_height != null ? `${mc.swell_wave_height}m` : '—';
    document.getElementById('detail-current-vel').textContent = mc.ocean_current_velocity != null ? `${mc.ocean_current_velocity}km/h` : '—';

    // Current direction arrow
    if (mc.ocean_current_direction != null) {
      document.getElementById('detail-current-dir').style.transform = `rotate(${mc.ocean_current_direction}deg)`;
    }

    // Tide windows
    const tw = document.getElementById('tide-windows');
    if (marine.tides && marine.tides.length > 0) {
      tw.innerHTML = marine.tides.map(t => {
        const time = new Date(t.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return `<span class="tide-badge ${t.type}">${t.type === 'high' ? '▲' : '▼'} ${t.type.toUpperCase()} ${time}</span>`;
      }).join('');
    } else {
      tw.innerHTML = '<span style="color:#475569;font-size:11px">No tide data</span>';
    }

    // Tide chart
    renderTideChart(marine.hourly || []);
    document.getElementById('tide-source').textContent = marine.source || 'Marine API';

    // ── Air Quality / UV ──
    const eqiVal = aqi.eqi ?? 80;
    document.getElementById('eqi-value').textContent = eqiVal;
    const eqiCirc = 2 * Math.PI * 19;
    const eqiOffset = eqiCirc * (1 - eqiVal / 100);
    const eqiArc = document.getElementById('eqi-arc');
    eqiArc.setAttribute('stroke-dashoffset', eqiOffset);
    eqiArc.setAttribute('stroke', eqiVal >= 70 ? '#4ade80' : eqiVal >= 40 ? '#facc15' : '#f87171');

    const eqiGrade = eqiVal >= 90 ? 'A+' : eqiVal >= 80 ? 'A' : eqiVal >= 70 ? 'B' : eqiVal >= 50 ? 'C' : 'D';
    document.getElementById('eqi-grade').textContent = eqiGrade;
    document.getElementById('eqi-grade').style.color = eqiVal >= 70 ? '#4ade80' : eqiVal >= 40 ? '#facc15' : '#f87171';

    document.getElementById('detail-pm25').textContent = aqi.pm2_5 != null ? `${aqi.pm2_5} µg/m³` : '—';
    document.getElementById('detail-aqi').textContent = aqi.european_aqi != null ? `EU ${aqi.european_aqi}` : '—';

    // UV
    const uv = aqi.uv_index ?? 0;
    const uvCat = aqi.uv_category || {};
    document.getElementById('uv-value').textContent = uv;
    document.getElementById('uv-value').style.color = uvCat.color || '#facc15';
    document.getElementById('uv-level').textContent = uvCat.level || 'N/A';
    document.getElementById('uv-level').style.color = uvCat.color || '#facc15';
    document.getElementById('uv-indicator').style.left = `${Math.min(100, (uv / 11) * 100)}%`;
    document.getElementById('uv-advice').textContent = uvCat.advice || '';

    // ── Crowd ──
    document.getElementById('crowd-emoji').textContent = crowd.level_emoji || '👥';
    document.getElementById('crowd-level').textContent = crowd.level || 'Unknown';
    document.getElementById('crowd-index').textContent = `${crowd.crowd_index ?? 0}/100`;
    document.getElementById('crowd-bar-fill').style.width = `${crowd.crowd_index ?? 0}%`;
    const ci = crowd.crowd_index ?? 0;
    document.getElementById('crowd-bar-fill').style.background =
      ci <= 30 ? '#4ade80' : ci <= 50 ? 'linear-gradient(90deg,#4ade80,#facc15)' :
      ci <= 70 ? 'linear-gradient(90deg,#facc15,#fb923c)' : '#f87171';
    document.getElementById('crowd-advice').textContent = crowd.best_time || '';

    // ── Safety Zones on map ──
    clearZoneLayers();
    if (_layerState.zones && zones) renderZoneLayers(zones);

    // ── Sparkline / history ──
    const history = detail.history || [];
    renderSparkline(history);

    // ── Reports ──
    renderReports(reports);
  }

  // ─── AI Score for Grade + Risk Factors ──────────────────────────
  async function triggerAIScore(detail) {
    const beach = detail.beach;
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beach_id: beach.id }),
      });
      const result = await res.json();

      // Attribution
      document.getElementById('detail-attribution').textContent = result.attribution || 'Analysis complete.';

      // Grade
      const gradeEl = document.getElementById('detail-grade');
      gradeEl.textContent = result.beach_grade || 'N/A';
      gradeEl.className = `grade-badge ${gradeClass(result.beach_grade)}`;

      // Risk factors
      const rfSection = document.getElementById('risk-factors-section');
      const rfList = document.getElementById('risk-factors-list');
      if (result.risk_factors && result.risk_factors.length > 0) {
        rfSection.classList.remove('hidden');
        rfList.innerHTML = result.risk_factors.map(f => `<li>${f}</li>`).join('');
      } else {
        rfSection.classList.add('hidden');
      }

      // Recommendations
      const recSection = document.getElementById('recommendations-section');
      const recList = document.getElementById('recommendations-list');
      if (result.recommendations && result.recommendations.length > 0) {
        recSection.classList.remove('hidden');
        recList.innerHTML = result.recommendations.map(r => `<li>${r}</li>`).join('');
      } else {
        recSection.classList.add('hidden');
      }

      // Update score if different
      if (result.score) {
        document.getElementById('detail-score').textContent = result.score;
        document.getElementById('detail-score').style.color = scoreColor(result.score);
        const arc = document.getElementById('score-arc');
        arc.style.stroke = scoreColor(result.score);
        const circumference = 2 * Math.PI * 66;
        arc.setAttribute('stroke-dashoffset', circumference * (1 - result.score / 100));
        document.getElementById('grade-indicator').style.left = `${result.score}%`;
        document.getElementById('detail-status-badge').textContent = statusLabel(result.score);
        document.getElementById('detail-status-badge').className = `status-badge ${statusClass(result.score)}`;
      }
    } catch (err) {
      console.error('[map] AI score fetch failed:', err);
      document.getElementById('detail-attribution').textContent = 'AI analysis temporarily unavailable.';
    }
  }

  // ─── Tide Chart ─────────────────────────────────────────────────
  function renderTideChart(hourly) {
    const canvas = document.getElementById('tide-chart');
    if (_tideChart) { _tideChart.destroy(); _tideChart = null; }

    const labels = hourly.map(h => {
      const d = new Date(h.time);
      return d.getHours() + ':00';
    });
    const seaLevels = hourly.map(h => h.sea_level_height);
    const waveHeights = hourly.map(h => h.wave_height);

    _tideChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Sea Level (m)',
            data: seaLevels,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56,189,248,0.08)',
            borderWidth: 1.5,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: 'Waves (m)',
            data: waveHeights,
            borderColor: '#a855f740',
            borderWidth: 1,
            borderDash: [4, 3],
            fill: false,
            tension: 0.3,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: {
            display: true,
            position: 'right',
            grid: { color: 'rgba(148,163,184,0.06)' },
            ticks: { font: { size: 9 }, color: '#475569', maxTicksLimit: 3 },
          },
        },
      },
    });
  }

  // ─── Sparkline ──────────────────────────────────────────────────
  function renderSparkline(history) {
    const canvas = document.getElementById('sparkline');
    if (_sparkChart) { _sparkChart.destroy(); _sparkChart = null; }

    const scores = history.length ? history.map(h => h.score) : [65, 72, 68, 74, 70, 78, 72];
    const labels = scores.map((_, i) => `Day ${i + 1}`);

    const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0;
    const trendEl = document.getElementById('trend-label');
    trendEl.textContent = trend > 0 ? `↑ +${trend}` : trend < 0 ? `↓ ${trend}` : '→ Stable';
    trendEl.style.color = trend > 0 ? '#4ade80' : trend < 0 ? '#f87171' : '#475569';

    _sparkChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: scores,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#38bdf8',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: {
            display: false,
            min: 0,
            max: 100,
          },
        },
      },
    });
  }

  // ─── Reports ────────────────────────────────────────────────────
  function renderReports(reports) {
    const container = document.getElementById('detail-reports');
    if (!reports.length) {
      container.innerHTML = '<p style="color:#475569;font-size:12px">No community reports yet</p>';
      return;
    }
    document.getElementById('report-count').textContent = reports.length;
    container.innerHTML = reports.slice(0, 5).map(r => {
      const tags = (r.ai_tags || []).map(t => `<span class="tag">${t}</span>`).join('');
      const time = new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const sevColor = r.ai_severity === 'high' ? '#f87171' : r.ai_severity === 'medium' ? '#fb923c' : '#4ade80';
      return `
        <div class="report-card">
          <div class="flex items-center justify-between mb-1">
            <div class="flex gap-1 flex-wrap">${tags || '<span class="tag">Report</span>'}</div>
            <span style="color:${sevColor};font-size:10px;font-weight:700;text-transform:uppercase">${r.ai_severity || 'info'}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;line-height:1.4" class="line-clamp-2">${r.description || 'No details provided'}</p>
          <p style="color:#334155;font-size:10px;margin-top:4px">${time}</p>
        </div>`;
    }).join('');
  }

  // ─── Safety Zone Layers ─────────────────────────────────────────
  function renderZoneLayers(zones) {
    // Lifeguard markers (green)
    (zones.lifeguard || []).forEach(z => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'rgba(74,222,128,0.2)', border: '2px solid #4ade80',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', cursor: 'pointer',
      });
      el.textContent = '🏊';
      el.title = z.label;
      const m = new maplibregl.Marker({ element: el }).setLngLat([z.lng, z.lat]).addTo(_map);
      _zoneLayers.lifeguard.push(m);
    });

    // Danger markers (red circles)
    (zones.danger || []).forEach(z => {
      const el = document.createElement('div');
      const size = (z.radius || 80) / 3;
      Object.assign(el.style, {
        width: `${size}px`, height: `${size}px`, borderRadius: '50%',
        background: 'rgba(248,113,113,0.15)', border: '2px dashed #f87171',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', cursor: 'pointer',
      });
      el.textContent = '⚠';
      el.title = z.label;
      const m = new maplibregl.Marker({ element: el }).setLngLat([z.lng, z.lat]).addTo(_map);
      _zoneLayers.danger.push(m);
    });

    // Safe entry markers (blue diamonds)
    (zones.entry || []).forEach(z => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        width: '22px', height: '22px',
        background: '#38bdf8', transform: 'rotate(45deg)',
        border: '2px solid white', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(56,189,248,0.5)',
      });
      el.title = z.label;
      const m = new maplibregl.Marker({ element: el }).setLngLat([z.lng, z.lat]).addTo(_map);
      _zoneLayers.entry.push(m);
    });
  }

  function clearZoneLayers() {
    Object.values(_zoneLayers).forEach(arr => {
      arr.forEach(m => m.remove());
      arr.length = 0;
    });
  }

  // ─── Search ─────────────────────────────────────────────────────
  function setupSearch() {
    const input = document.getElementById('beach-search');
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      const filtered = q ? _beaches.filter(b => b.name.toLowerCase().includes(q)) : _beaches;
      renderBeachList(filtered);
    });
  }

  // ─── Back Button ────────────────────────────────────────────────
  document.getElementById('back-btn').addEventListener('click', () => {
    _selectedBeach = null;
    document.getElementById('beach-detail-panel').classList.add('hidden');
    document.getElementById('beach-list-panel').classList.remove('hidden');
    clearZoneLayers();
    _map.flyTo({ center: [73.87, 15.35], zoom: 10.2, duration: 1000 });
  });

  // ─── SOS System ─────────────────────────────────────────────────
  function setupSOS() {
    const fab = document.getElementById('sos-fab');
    const overlay = document.getElementById('sos-overlay');
    const closeBtn = document.getElementById('sos-close');

    fab.addEventListener('click', () => {
      overlay.classList.add('active');
      // Get GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          document.getElementById('sos-gps').textContent =
            `📍 GPS: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        }, () => {
          document.getElementById('sos-gps').textContent = '📍 GPS: Location unavailable';
        });
      }
      // Nearest lifeguard
      if (_selectedBeach) {
        const beach = _beaches.find(b => b.id === _selectedBeach);
        document.getElementById('sos-nearest').textContent =
          `📍 Nearest lifeguard: ${beach ? beach.name + ' beach area' : 'Unknown'}`;
      }
    });

    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
  }

  // ─── Layer Toggles ──────────────────────────────────────────────
  function setupLayerToggles() {
    document.getElementById('toggle-zones').addEventListener('click', function () {
      _layerState.zones = !_layerState.zones;
      this.classList.toggle('active', _layerState.zones);
      if (!_layerState.zones) {
        clearZoneLayers();
      } else if (_selectedBeach) {
        // Re-fetch zones for selected beach
        fetch(`/api/beaches/${_selectedBeach}`)
          .then(r => r.json())
          .then(d => { if (d.safety_zones) renderZoneLayers(d.safety_zones); });
      }
    });

    document.getElementById('toggle-aqi').addEventListener('click', function () {
      _layerState.aqi = !_layerState.aqi;
      this.classList.toggle('active', _layerState.aqi);
      // Toggle AQI visual on markers
      _beaches.forEach(b => {
        const marker = _markers[b.id];
        if (marker) {
          const el = marker.getElement();
          if (_layerState.aqi) {
            el.style.boxShadow = `0 0 18px rgba(168,85,247,0.7), 0 2px 6px rgba(0,0,0,0.5)`;
            el.style.borderColor = '#a855f7';
          } else {
            const c = scoreColor(b.current_score);
            el.style.boxShadow = `0 0 12px ${c}90, 0 2px 6px rgba(0,0,0,0.5)`;
            el.style.borderColor = 'white';
          }
        }
      });
    });

    document.getElementById('toggle-crowd').addEventListener('click', function () {
      _layerState.crowd = !_layerState.crowd;
      this.classList.toggle('active', _layerState.crowd);
      // Toggle crowd visual — pulse effect on high-crowd markers
      _beaches.forEach(b => {
        const marker = _markers[b.id];
        if (marker) {
          const el = marker.getElement();
          if (_layerState.crowd) {
            el.style.animation = 'live-blink 2s ease-in-out infinite';
          } else {
            el.style.animation = 'none';
          }
        }
      });
    });
  }

  // ─── Browser Notifications ──────────────────────────────────────
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function sendDangerAlert(beachName, score) {
    if ('Notification' in window && Notification.permission === 'granted' && score < 50) {
      new Notification('🚨 TidelQ Danger Alert', {
        body: `${beachName} safety score dropped to ${score}! Avoid swimming.`,
        icon: '/favicon.ico',
        tag: `danger-${beachName}`,
      });
    }
  }

  // ─── Init ───────────────────────────────────────────────────────
  requestNotificationPermission();
  initMap();

})();
