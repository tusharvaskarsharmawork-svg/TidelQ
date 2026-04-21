// ═══════════════════════════════════════════════════════════════════════════
// analytics.js — AntiGravity Analytics Dashboard
// ═══════════════════════════════════════════════════════════════════════════

(async function () {
  'use strict';

  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();

    // ── Health Index ──
    document.getElementById('health-index').textContent = data.avg_score ?? '—';

    // ── Distribution ──
    const dist = data.score_distribution || {};
    document.getElementById('dist-safe').textContent = dist.safe ?? 0;
    document.getElementById('dist-moderate').textContent = dist.moderate ?? 0;
    document.getElementById('dist-danger').textContent = dist.danger ?? 0;

    // ── Stats ──
    document.getElementById('stat-total').textContent = data.total_beaches ?? 0;
    document.getElementById('stat-reports').textContent = data.total_reports ?? 0;

    // ── Best 5 ──
    renderLeaderboard('best-5', data.best_5 || [], true);

    // ── Worst 5 ──
    renderLeaderboard('worst-5', data.worst_5 || [], false);

    // ── 7-Day Health Trend ──
    renderHealthTrend(data.coastline_health_7d || []);

    // ── Reports Chart ──
    renderReportsChart(data.top_reported || []);

  } catch (err) {
    console.error('[analytics] Failed to load:', err);
  }

  function renderLeaderboard(containerId, beaches, isBest) {
    const container = document.getElementById(containerId);
    container.innerHTML = beaches.map((b, i) => {
      const c = b.score >= 80 ? '#4ade80' : b.score >= 50 ? '#fb923c' : '#f87171';
      const bg = b.score >= 80 ? 'rgba(74,222,128,0.15)' : b.score >= 50 ? 'rgba(251,146,60,0.15)' : 'rgba(248,113,113,0.15)';
      const medals = ['🥇', '🥈', '🥉', '4', '5'];
      return `
        <div class="leaderboard-item">
          <div class="leaderboard-rank" style="background:${bg};color:${c}">${medals[i] || i + 1}</div>
          <div class="flex-1 min-w-0">
            <div class="text-white font-semibold text-sm truncate">${b.name}</div>
          </div>
          <div style="color:${c};font-weight:800;font-size:15px">${b.score}</div>
        </div>`;
    }).join('');
  }

  function renderHealthTrend(data) {
    const labels = ['7d ago', '6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Today'];
    const canvas = document.getElementById('health-trend-chart');

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels.slice(0, data.length),
        datasets: [{
          label: 'Coastline Health',
          data,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: 'rgba(148,163,184,0.06)' },
            ticks: { color: '#475569', font: { size: 11 } },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(148,163,184,0.06)' },
            ticks: { color: '#475569', font: { size: 11 }, stepSize: 25 },
          },
        },
      },
    });
  }

  function renderReportsChart(data) {
    const canvas = document.getElementById('reports-chart');

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Reports',
          data: data.map(d => d.count),
          backgroundColor: data.map((_, i) => {
            const colors = ['#f87171', '#fb923c', '#facc15', '#a3e635', '#4ade80'];
            return colors[i] || '#38bdf8';
          }),
          borderRadius: 6,
          barThickness: 30,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: 'rgba(148,163,184,0.06)' },
            ticks: { color: '#475569', font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#cbd5e1', font: { size: 11, weight: 600 } },
          },
        },
      },
    });
  }

})();
