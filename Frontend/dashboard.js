/*
=====================================================
RetinaSafe — dashboard.js
Dashboard logic: history, stats, risk display
=====================================================
*/
'use strict';

// ── STORAGE KEY ──────────────────────────────────────────────
const HISTORY_KEY = 'retinasafe_history';

// ── SAMPLE / SEED DATA (shown when no real data exists) ──────
const SEED_DATA = [
  {
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    overall: 42,
    label: 'Borderline',
    badgeClass: 'badge-borderline',
    action: 'Monitor symptoms and rescreen in 6 months.',
    urgency: 'MONITOR',
    conditions: {
      dr:   { prob: 0.28, game: 72, level: 'Low' },
      amd:  { prob: 0.44, game: 61, level: 'Moderate' },
      glauc:{ prob: 0.18, game: 80, level: 'Low' },
      cat:  { prob: 0.31, game: 68, level: 'Low' },
    },
  },
  {
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    overall: 29,
    label: 'Low Risk',
    badgeClass: 'badge-low',
    action: 'No immediate action required. Continue annual screening.',
    urgency: 'ROUTINE',
    conditions: {
      dr:   { prob: 0.14, game: 85, level: 'Low' },
      amd:  { prob: 0.20, game: 79, level: 'Low' },
      glauc:{ prob: 0.11, game: 88, level: 'Low' },
      cat:  { prob: 0.22, game: 82, level: 'Low' },
    },
  },
];

// ── CONDITION META ────────────────────────────────────────────
const CONDITIONS = [
  { key: 'dr',   name: 'Diabetic Retinopathy', color: 'var(--dr-color)',   game: 'Contrast score' },
  { key: 'amd',  name: 'Macular Degeneration', color: 'var(--amd-color)',  game: 'Amsler score' },
  { key: 'glauc',name: 'Glaucoma',             color: 'var(--glauc-color)',game: 'Peripheral score' },
  { key: 'cat',  name: 'Cataract',             color: 'var(--cat-color)',  game: 'Hue score' },
];

// ── HELPERS ───────────────────────────────────────────────────
function qs(sel) { return document.querySelector(sel); }

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveHistory(data) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getRiskInfo(score) {
  if (score < 35) return { label: 'Low Risk',      badgeClass: 'badge-low',         ringClass: 'risk-low',  urgency: 'ROUTINE',     action: 'No immediate action required. Continue annual eye health screening.' };
  if (score < 60) return { label: 'Borderline',    badgeClass: 'badge-borderline',  ringClass: '',          urgency: 'MONITOR',     action: 'Monitor symptoms and rescreen with RetinaSafe in 6 months.' };
  if (score < 75) return { label: 'Moderate Risk', badgeClass: 'badge-moderate',    ringClass: 'risk-mod',  urgency: 'RECOMMENDED', action: 'Schedule an ophthalmology consultation within 4–6 weeks.' };
  if (score < 90) return { label: 'High Risk',     badgeClass: 'badge-high',        ringClass: 'risk-high', urgency: 'URGENT',      action: 'Book an urgent ophthalmology appointment within 1–2 weeks.' };
  return            { label: 'Critical',           badgeClass: 'badge-critical',    ringClass: 'risk-high', urgency: 'CRITICAL',    action: 'Attend emergency ophthalmology or A&E eye department immediately.' };
}

function getLevelClass(level) {
  if (level === 'Low') return 'level-low';
  if (level === 'Moderate') return 'level-moderate';
  return 'level-high';
}

// ── RENDER OVERALL RISK ───────────────────────────────────────
function renderOverallRisk(screening) {
  const score = screening.overall;
  const { label, ringClass, urgency, action } = getRiskInfo(score);
  const circumference = 314.16;
  const offset = circumference - (score / 100) * circumference;

  // Score ring
  const ring = qs('#risk-ring');
  if (ring) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ring.style.strokeDashoffset = offset;
      });
    });
  }

  // Color ring by risk
  const riskCard = qs('.risk-card');
  if (riskCard) {
    riskCard.classList.remove('risk-low', 'risk-mod', 'risk-high');
    if (ringClass) riskCard.classList.add(ringClass);
  }

  // Values
  const scoreEl = qs('#overall-score');
  if (scoreEl) scoreEl.textContent = score;

  const tierEl = qs('.risk-tier-label');
  if (tierEl) tierEl.textContent = label;

  const actionEl = qs('.risk-action');
  if (actionEl) actionEl.textContent = action;

  const urgencyEl = qs('.risk-meta-pill');
  if (urgencyEl) urgencyEl.textContent = urgency;

  const lastDate = qs('#last-screening-date');
  if (lastDate) lastDate.textContent = formatDate(screening.date);
}

// ── RENDER CONDITION BARS ─────────────────────────────────────
function renderConditionBars(screening) {
  const container = qs('#condition-bars');
  if (!container || !screening.conditions) return;

  container.innerHTML = CONDITIONS.map(c => {
    const data = screening.conditions[c.key] || { prob: 0, game: 0, level: 'Low' };
    const pct = Math.round(data.prob * 100);
    const levelClass = getLevelClass(data.level);
    return `
      <div class="cbar-row">
        <div class="cbar-meta">
          <span class="cbar-name">${c.name}</span>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="cbar-level ${levelClass}">${data.level}</span>
            <span class="cbar-pct" style="color:${c.color}">${pct}%</span>
          </div>
        </div>
        <div class="cbar-track">
          <div class="cbar-fill" data-width="${pct}" style="background-color:${c.color};width:0%"></div>
        </div>
      </div>`;
  }).join('');

  // Animate bars in
  setTimeout(() => {
    container.querySelectorAll('.cbar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });
  }, 200);
}

// ── RENDER HISTORY LIST ───────────────────────────────────────
function renderHistory(history) {
  const container = qs('#history-list');
  if (!container) return;

  if (!history || history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <p>No past screenings on file.</p>
        <a href="screening.html" class="btn btn-primary btn-sm">Start First Screening</a>
      </div>`;
    return;
  }

  container.innerHTML = history.map((h, i) => {
    const { label, badgeClass } = getRiskInfo(h.overall);
    const badgeColors = {
      'badge-low':         'color:#065F46;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.3)',
      'badge-borderline':  'color:#92400E;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3)',
      'badge-moderate':    'color:#9A3412;background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.3)',
      'badge-high':        'color:#991B1B;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3)',
      'badge-critical':    'color:#7B0000;background:rgba(185,28,28,0.15);border:1px solid rgba(185,28,28,0.3)',
    };
    const bStyle = badgeColors[badgeClass] || '';
    return `
      <div class="history-entry">
        <span class="he-date">${formatDate(h.date)}</span>
        <span class="he-score">${h.overall}<small style="font-size:0.65rem;color:var(--text-muted);font-family:'Source Sans 3',sans-serif;">/100</small></span>
        <span class="he-badge" style="${bStyle}">${label}</span>
      </div>`;
  }).join('');
}

// ── RENDER STATS ──────────────────────────────────────────────
function renderStats(history) {
  if (!history || history.length === 0) return;

  const total = history.length;
  const avgScore = Math.round(history.reduce((s, h) => s + h.overall, 0) / total);
  const gamesTotal = total * 4;

  // Trend: compare last two
  let trend = '—';
  if (total >= 2) {
    const diff = history[0].overall - history[1].overall;
    if (diff > 0) trend = `↑ +${diff}`;
    else if (diff < 0) trend = `↓ ${diff}`;
    else trend = '→ 0';
  }

  const screeningsEl = qs('#stat-screenings');
  const gamesEl = qs('#stat-games');
  const avgEl = qs('#stat-avg-score');
  const trendEl = qs('#stat-trend');

  if (screeningsEl) screeningsEl.textContent = total;
  if (gamesEl) gamesEl.textContent = gamesTotal;
  if (avgEl) avgEl.textContent = avgScore;
  if (trendEl) trendEl.textContent = trend;
}

// ── CLEAR HISTORY ────────────────────────────────────────────
function initClearHistory() {
  const btn = qs('#clear-history-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (confirm('Clear all screening history? This cannot be undone.')) {
      localStorage.removeItem(HISTORY_KEY);
      location.reload();
    }
  });
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  let history = loadHistory();

  // Seed with sample data if nothing stored
  if (!history || history.length === 0) {
    history = SEED_DATA;
    saveHistory(history);
  }

  const latest = history[0];
  renderOverallRisk(latest);
  renderConditionBars(latest);
  renderHistory(history);
  renderStats(history);
  initClearHistory();
});