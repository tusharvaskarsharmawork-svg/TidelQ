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
    _map.repaint = true;

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
    let data;
    try {
      const res = await fetch('/api/beaches');
      data = await res.json();
      _beaches = data.beaches || data;

      // ── Real-time Danger Alerts tracking ──
      _beaches.forEach(b => {
        const prev = _previousScores[b.id];
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

    // Update reports stat card
    const totalReports = data.total_reports ?? null;
    const reportsStatEl = document.getElementById('report-count');
    if (reportsStatEl) {
      reportsStatEl.textContent = totalReports !== null ? totalReports : '—';
    }

    renderBeachList(_beaches);
    updateMarkers();

    // If a beach detail panel is open, refresh its reports
    if (_selectedBeach) {
      fetch(`/api/beaches/${_selectedBeach}`)
        .then(r => r.json())
        .then(detail => {
          if (detail && detail.reports !== undefined) {
            renderReports(detail.reports);
          }
        })
        .catch(() => {});
    }
  }

  // ─── Danger Alert ───────────────────────────────────────────────
  function sendDangerAlert(name, score) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50';
    toast.style.animation = 'slideIn 0.3s ease-out';
    toast.innerHTML = `<span style="font-size:1.25rem">🚨</span><div><p style="font-weight:700;font-size:0.875rem;margin:0">Danger: ${name}</p><p style="font-size:0.75rem;margin:0;opacity:0.9">Score dropped to ${score}.</p></div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
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
    const geojsonData = {
      type: 'FeatureCollection',
      features: _beaches.map(b => ({
        type: 'Feature',
        id: b.id,
        geometry: { type: 'Point', coordinates: [b.longitude, b.latitude] },
        properties: { id: b.id, name: b.name, status: statusClass(b.current_score), score: b.current_score }
      }))
    };

    if (!_map.getSource('beaches')) {
      _map.addSource('beaches', {
        type: 'geojson',
        data: geojsonData,
        cluster: false
      });

      // Glow layer — only visible when hover or active (opacity 0 at rest)
      _map.addLayer({
        id: 'beach-points-glow',
        type: 'circle',
        source: 'beaches',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            5,  ['case', ['boolean', ['feature-state', 'active'], false], 10, ['boolean', ['feature-state', 'hover'], false], 8, 0],
            10, ['case', ['boolean', ['feature-state', 'active'], false], 16, ['boolean', ['feature-state', 'hover'], false], 12, 0],
            15, ['case', ['boolean', ['feature-state', 'active'], false], 22, ['boolean', ['feature-state', 'hover'], false], 18, 0]
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'aqi'], false], '#a855f7',
            ['==', ['get', 'status'], 'safe'], '#22c55e',
            ['==', ['get', 'status'], 'caution'], '#f59e0b',
            ['==', ['get', 'status'], 'danger'], '#ef4444',
            '#64748b'
          ],
          'circle-blur': 0.7,
          'circle-opacity': 0.6
        }
      });

      // Main point layer — always visible, scales with zoom
      _map.addLayer({
        id: 'beach-points',
        type: 'circle',
        source: 'beaches',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            5,  ['case', ['boolean', ['feature-state', 'active'], false], 7,  ['boolean', ['feature-state', 'hover'], false], 6,  4],
            10, ['case', ['boolean', ['feature-state', 'active'], false], 10, ['boolean', ['feature-state', 'hover'], false], 9,  6],
            15, ['case', ['boolean', ['feature-state', 'active'], false], 14, ['boolean', ['feature-state', 'hover'], false], 12, 8]
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'status'], 'safe'], '#22c55e',
            ['==', ['get', 'status'], 'caution'], '#f59e0b',
            ['==', ['get', 'status'], 'danger'], '#ef4444',
            '#3b82f6'
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'aqi'], false], '#a855f7',
            '#ffffff'
          ],
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.95,
          'circle-blur': 0.1
        }
      });

      _map.on('click', 'beach-points', (e) => {
        const feature = e.features[0];
        selectBeach(feature.properties.id);
      });

      _map.on('mouseenter', 'beach-points', (e) => {
        _map.getCanvas().style.cursor = 'pointer';
        if (e.features.length > 0) {
          _map.setFeatureState({ source: 'beaches', id: e.features[0].id }, { hover: true });
        }
      });

      _map.on('mouseleave', 'beach-points', (e) => {
        _map.getCanvas().style.cursor = '';
        if (e.features.length > 0) {
          _map.setFeatureState({ source: 'beaches', id: e.features[0].id }, { hover: false });
        }
      });
    } else {
      _map.getSource('beaches').setData(geojsonData);
    }
  }

  // ─── Select Beach (Detail View) ─────────────────────────────────
  window.selectBeach = async function (beachId) {
    if (_selectedBeach && _map.getSource('beaches')) {
      _map.setFeatureState({ source: 'beaches', id: _selectedBeach }, { active: false });
    }
    _selectedBeach = beachId;
    if (_map.getSource('beaches')) {
      _map.setFeatureState({ source: 'beaches', id: beachId }, { active: true });
    }
    const beach = _beaches.find(b => b.id === beachId);
    if (!beach) return;

    // Show detail panel
    const listPanel = document.getElementById('beach-list-panel');
    const detailPanel = document.getElementById('beach-detail-panel');
    if (listPanel) listPanel.classList.add('hidden');
    if (detailPanel) detailPanel.classList.remove('hidden');

    const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const safeStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };

    // Set basic info
    safeSet('detail-name', beach.name);
    safeSet('detail-score', beach.current_score);
    safeStyle('detail-score', 'color', scoreColor(beach.current_score));
    
    safeSet('detail-status-badge', statusLabel(beach.current_score));
    const badge = document.getElementById('detail-status-badge');
    if (badge) badge.className = `status-badge ${statusClass(beach.current_score)}`;

    // Update report links
    const rl1 = document.getElementById('report-link-detail');
    const rl2 = document.getElementById('report-cta-link');
    if (rl1) rl1.href = `/report.html?beach=${beachId}`;
    if (rl2) rl2.href = `/report.html?beach=${beachId}`;

    // Score ring animation
    const arc = document.getElementById('score-arc');
    if (arc) {
      const pct = beach.current_score / 100;
      const circumference = 2 * Math.PI * 66;
      arc.style.stroke = scoreColor(beach.current_score);
      setTimeout(() => { arc.setAttribute('stroke-dashoffset', circumference * (1 - pct)); }, 50);
    }

    // Grade indicator
    safeStyle('grade-indicator', 'left', `${beach.current_score}%`);

    // Fly to
    if (_map && _map.flyTo) {
      _map.flyTo({ center: [beach.longitude, beach.latitude], zoom: 13.5, duration: 1200 });
    }

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

    const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const safeStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };

    // ── Metrics Grid ──
    safeSet('detail-temp', sat.sst ? `${sat.sst}°C` : '—');
    safeSet('detail-wind', sat.wind_speed ? `${sat.wind_speed} km/h` : '—');
    safeSet('detail-chlor', sat.chlorophyll ? `${sat.chlorophyll} mg/m³` : '—');
    safeSet('detail-turb', sat.turbidity ? `${sat.turbidity} NTU` : '—');

    // ── Weather alert ──
    const alertEl = document.getElementById('weather-alert');
    if (alertEl) {
      const weather = sat.weather_condition || '';
      if (weather.includes('Thunderstorm') || weather.includes('Rain') || weather.includes('Heavy')) {
        alertEl.classList.add('active');
        safeSet('weather-alert-text', `⚠ ${weather} — Exercise extreme caution`);
      } else {
        alertEl.classList.remove('active');
      }
    }

    // ── Beach grade ──
    triggerAIScore(detail);

    // ── Marine / Tide ──
    const mc = marine.current || {};
    safeSet('detail-wave', mc.wave_height != null ? `${mc.wave_height}m` : '—');
    safeSet('detail-wave-ht', mc.wave_height != null ? `${mc.wave_height}m` : '—');
    safeSet('detail-swell', mc.swell_wave_height != null ? `${mc.swell_wave_height}m` : '—');
    safeSet('detail-current-vel', mc.ocean_current_velocity != null ? `${mc.ocean_current_velocity}km/h` : '—');

    // Current direction arrow
    if (mc.ocean_current_direction != null) {
      safeStyle('detail-current-dir', 'transform', `rotate(${mc.ocean_current_direction}deg)`);
    }

    // Tide windows
    const tw = document.getElementById('tide-windows');
    if (tw) {
      if (marine.tides && marine.tides.length > 0) {
        tw.innerHTML = marine.tides.map(t => {
          const time = new Date(t.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          return `<span class="tide-badge ${t.type}">${t.type === 'high' ? '▲' : '▼'} ${t.type.toUpperCase()} ${time}</span>`;
        }).join('');
      } else {
        tw.innerHTML = '<span style="color:#475569;font-size:11px">No tide data</span>';
      }
    }

    // Tide chart
    renderTideChart(marine.hourly || []);
    safeSet('tide-source', marine.source || 'Marine API');

    // ── Air Quality / UV ──
    const eqiVal = aqi.eqi ?? 80;
    safeSet('eqi-value', eqiVal);
    
    const eqiArc = document.getElementById('eqi-arc');
    if (eqiArc) {
      const eqiCirc = 2 * Math.PI * 19;
      const eqiOffset = eqiCirc * (1 - eqiVal / 100);
      eqiArc.setAttribute('stroke-dashoffset', eqiOffset);
      eqiArc.setAttribute('stroke', eqiVal >= 70 ? '#4ade80' : eqiVal >= 40 ? '#facc15' : '#f87171');
    }

    const eqiGrade = eqiVal >= 90 ? 'A+' : eqiVal >= 80 ? 'A' : eqiVal >= 70 ? 'B' : eqiVal >= 50 ? 'C' : 'D';
    safeSet('eqi-grade', eqiGrade);
    safeStyle('eqi-grade', 'color', eqiVal >= 70 ? '#4ade80' : eqiVal >= 40 ? '#facc15' : '#f87171');

    safeSet('detail-pm25', aqi.pm2_5 != null ? `${aqi.pm2_5} µg/m³` : '—');
    safeSet('detail-aqi', aqi.european_aqi != null ? `EU ${aqi.european_aqi}` : '—');

    // UV
    const uv = aqi.uv_index ?? 0;
    const uvCat = aqi.uv_category || {};
    safeSet('detail-uv', uv);
    safeSet('uv-value', uv);
    safeStyle('uv-value', 'color', uvCat.color || '#facc15');
    safeSet('uv-level', uvCat.level || 'N/A');
    safeStyle('uv-level', 'color', uvCat.color || '#facc15');
    safeStyle('uv-indicator', 'left', `${Math.min(100, (uv / 11) * 100)}%`);
    safeSet('uv-advice', uvCat.advice || '');

    // ── Crowd ──
    safeSet('detail-crowd', crowd.level_emoji ? `${crowd.level_emoji} ${crowd.level || ''}` : '—');
    safeSet('crowd-emoji', crowd.level_emoji || '👥');
    safeSet('crowd-level', crowd.level || 'Unknown');
    safeSet('crowd-index', `${crowd.crowd_index ?? 0}/100`);
    safeStyle('crowd-bar-fill', 'width', `${crowd.crowd_index ?? 0}%`);
    const ci = crowd.crowd_index ?? 0;
    safeStyle('crowd-bar-fill', 'background',
      ci <= 30 ? '#4ade80' : ci <= 50 ? 'linear-gradient(90deg,#4ade80,#facc15)' :
      ci <= 70 ? 'linear-gradient(90deg,#facc15,#fb923c)' : '#f87171');
    safeSet('crowd-advice', crowd.best_time || '');

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
    const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const safeStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };

    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beach_id: beach.id }),
      });
      const result = await res.json();

      // Attribution
      safeSet('detail-attribution', result.attribution || 'Analysis complete.');

      // Grade
      safeSet('detail-grade', result.beach_grade || 'N/A');
      const gradeEl = document.getElementById('detail-grade');
      if (gradeEl) gradeEl.className = `grade-badge ${gradeClass(result.beach_grade)}`;

      // Risk factors
      const rfSection = document.getElementById('risk-factors-section');
      const rfList = document.getElementById('risk-factors-list');
      if (rfSection && rfList) {
        if (result.risk_factors && result.risk_factors.length > 0) {
          rfSection.classList.remove('hidden');
          rfList.innerHTML = result.risk_factors.map(f => `<li>${f}</li>`).join('');
        } else {
          rfSection.classList.add('hidden');
        }
      }

      // Recommendations
      const recSection = document.getElementById('recommendations-section');
      const recList = document.getElementById('recommendations-list');
      if (recSection && recList) {
        if (result.recommendations && result.recommendations.length > 0) {
          recSection.classList.remove('hidden');
          recList.innerHTML = result.recommendations.map(r => `<li>${r}</li>`).join('');
        } else {
          recSection.classList.add('hidden');
        }
      }

      // Update score if different
      if (result.score) {
        safeSet('detail-score', result.score);
        safeStyle('detail-score', 'color', scoreColor(result.score));
        
        const arc = document.getElementById('score-arc');
        if (arc) {
          arc.style.stroke = scoreColor(result.score);
          const circumference = 2 * Math.PI * 66;
          arc.setAttribute('stroke-dashoffset', circumference * (1 - result.score / 100));
        }
        
        safeStyle('grade-indicator', 'left', `${result.score}%`);
        safeSet('detail-status-badge', statusLabel(result.score));
        
        const badge = document.getElementById('detail-status-badge');
        if (badge) badge.className = `status-badge ${statusClass(result.score)}`;
      }
    } catch (err) {
      console.error('[map] AI score fetch failed:', err);
      safeSet('detail-attribution', 'AI analysis temporarily unavailable.');
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
    const countEl = document.getElementById('report-count');
    const list = Array.isArray(reports) ? reports : [];

    if (countEl) countEl.textContent = list.length;

    if (!list.length) {
      container.innerHTML = '<p style="color:#475569;font-size:12px;padding:8px 0">No community reports yet. Be the first to report!</p>';
      return;
    }

    container.innerHTML = list.slice(0, 5).map(r => {
      const tags = (r.ai_tags || []).map(t => `<span class="tag">${t}</span>`).join('');
      const time = r.created_at
        ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : 'Recent';
      const sevColor = r.ai_severity === 'high' ? '#f87171' : r.ai_severity === 'medium' ? '#fb923c' : '#4ade80';
      return `
        <div class="report-card">
          <div class="flex items-center justify-between mb-1">
            <div class="flex gap-1 flex-wrap">${tags || '<span class="tag">Community Report</span>'}</div>
            <span style="color:${sevColor};font-size:10px;font-weight:700;text-transform:uppercase">${r.ai_severity || 'info'}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;line-height:1.4">${r.description || 'No details provided'}</p>
          <p style="color:#334155;font-size:10px;margin-top:4px">${time}</p>
        </div>`;
    }).join('');
  }

  // ─── Safety Zone Layers ─────────────────────────────────────────
  function initZoneLayers() {
    if (!_map.getSource('zones')) {
      _map.addSource('zones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      
      _map.addLayer({
        id: 'zone-danger-radius',
        type: 'circle',
        source: 'zones',
        filter: ['==', ['get', 'type'], 'danger'],
        paint: {
          'circle-radius': ['/', ['get', 'radius'], 3],
          'circle-color': 'rgba(248,113,113,0.15)',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#f87171'
        }
      });
      
      _map.addLayer({
        id: 'zone-symbols',
        type: 'symbol',
        source: 'zones',
        layout: {
          'text-field': [
            'match', ['get', 'type'],
            'lifeguard', '🏊',
            'danger', '⚠',
            'entry', '🔷',
            ''
          ],
          'text-size': [
            'match', ['get', 'type'],
            'lifeguard', 16,
            'danger', 14,
            'entry', 14,
            12
          ]
        },
        paint: {
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });
    }
  }

  function renderZoneLayers(zones) {
    initZoneLayers();
    const features = [];
    (zones.lifeguard || []).forEach(z => {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [z.lng, z.lat] }, properties: { type: 'lifeguard', label: z.label }});
    });
    (zones.danger || []).forEach(z => {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [z.lng, z.lat] }, properties: { type: 'danger', label: z.label, radius: z.radius || 80 }});
    });
    (zones.entry || []).forEach(z => {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [z.lng, z.lat] }, properties: { type: 'entry', label: z.label }});
    });
    _map.getSource('zones').setData({ type: 'FeatureCollection', features });
  }

  function clearZoneLayers() {
    if (_map.getSource('zones')) {
      _map.getSource('zones').setData({ type: 'FeatureCollection', features: [] });
    }
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
    if (_selectedBeach && _map.getSource('beaches')) {
      _map.setFeatureState({ source: 'beaches', id: _selectedBeach }, { active: false });
    }
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
        if (_map.getSource('beaches')) {
          _map.setFeatureState({ source: 'beaches', id: b.id }, { aqi: _layerState.aqi });
        }
      });
    });

    document.getElementById('toggle-crowd').addEventListener('click', function () {
      _layerState.crowd = !_layerState.crowd;
      this.classList.toggle('active', _layerState.crowd);
      // Toggle crowd visual — pulse effect on high-crowd markers
      _beaches.forEach(b => {
        if (_map.getSource('beaches')) {
          _map.setFeatureState({ source: 'beaches', id: b.id }, { crowd: _layerState.crowd });
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
