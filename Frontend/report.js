/**
 * RetinaSafe — Report Renderer
 * ==============================
 * Reads computed scores from sessionStorage, applies the full risk
 * computation and rule engine (per Clinical Judgement Framework §2–§7),
 * and renders the report page.
 *
 * All rendering is deterministic — no language model involved in
 * risk classification or recommended action generation.
 */

(function () {

  'use strict';

  // ── Run on DOM ready ────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', renderReport);

  function renderReport() {
    const payload = Scoring.load();

    // If no data (user landed here directly), show a graceful message
    if (!payload.cnn || !payload.games.contrast) {
      showNoData();
      return;
    }

    const riskResult = Scoring.computeOverallRisk(payload);
    const action     = Scoring.computeRecommendedAction(riskResult, payload.games);
    const now        = new Date();
    const dateStr    = now.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    // Save report for potential downstream use
    Scoring.saveReport({ riskResult, action, generatedAt: now.toISOString() });

    // ── Report date ──────────────────────────────────────────────────
    setEl('report-date', `Generated: ${dateStr}`);
    setEl('doc-date', dateStr);

    // ── Overall risk score ───────────────────────────────────────────
    renderOverallRisk(riskResult);

    // ── Per-disease panel ────────────────────────────────────────────
    renderDiseasePanel(riskResult.diseases, payload.games);

    // ── Game score summary table ─────────────────────────────────────
    renderGameTable(payload.games);

    // ── Recommended action ───────────────────────────────────────────
    renderAction(action);

    // ── Doctor summary card ──────────────────────────────────────────
    renderDoctorCard(riskResult, action, payload.games, dateStr);
  }

  // ─────────────────────────────────────────────────────────────────────
  // OVERALL RISK SCORE
  // ─────────────────────────────────────────────────────────────────────
  function renderOverallRisk(risk) {
    setEl('ors-score', risk.overallScore);

    const badge = document.getElementById('ors-badge');
    if (badge) {
      badge.textContent = risk.classification;
      badge.className   = `risk-badge ${risk.classKey}`;
    }

    // Animate bar fill (uses gradient, just set width)
    const fill = document.getElementById('ors-bar-fill');
    if (fill) {
      setTimeout(() => {
        fill.style.width = `${risk.overallScore}%`;
      }, 200);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // PER-DISEASE RISK PANEL (§3)
  // ─────────────────────────────────────────────────────────────────────
  function renderDiseasePanel(diseases, games) {
    const map = {
      dr:       { barId: 'bar-dr',       pctId: 'pct-dr',       badgeId: 'badge-dr'       },
      amd:      { barId: 'bar-amd',      pctId: 'pct-amd',      badgeId: 'badge-amd'      },
      glaucoma: { barId: 'bar-glaucoma', pctId: 'pct-glaucoma', badgeId: 'badge-glaucoma' },
      cataract: { barId: 'bar-cataract', pctId: 'pct-cataract', badgeId: 'badge-cataract' }
    };

    Object.entries(map).forEach(([key, ids]) => {
      const d = diseases[key];
      if (!d) return;

      // Animate bar
      const bar = document.getElementById(ids.barId);
      if (bar) setTimeout(() => { bar.style.width = `${d.pct}%`; }, 400);

      setEl(ids.pctId, `${d.pct}%`);

      const badge = document.getElementById(ids.badgeId);
      if (badge) {
        badge.textContent = d.label;
        badge.className   = `risk-badge sm ${d.key}`;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // GAME SCORE SUMMARY TABLE (§4)
  // ─────────────────────────────────────────────────────────────────────
  function renderGameTable(games) {
    const tbody = document.getElementById('game-table-body');
    if (!tbody) return;

    const rows = [
      {
        name:   'Contrast Discrimination (DR)',
        result: games.contrast,
        scoreKey: 'score',
        extra: (g) => `Levels passed: ${g.levelsPassed}/10 · Avg reaction: ${g.avgReactionMs}ms`
      },
      {
        name:   'Dynamic Amsler Grid (AMD)',
        result: games.amsler,
        scoreKey: 'score',
        extra: (g) => `Marked area: ${g.markedArea} points`
      },
      {
        name:   'Peripheral Reaction Tester (Glaucoma)',
        result: games.peripheral,
        scoreKey: 'score',
        extra: (g) => `Scotoma-pattern zones: ${g.scotomicZones}/8`
      },
      {
        name:   'Colour Hue Sorting (Cataract)',
        result: games.hue,
        scoreKey: 'score',
        extra: (g) => `Rounds correct: ${g.roundsCorrect}/${g.totalRounds}`
      }
    ];

    tbody.innerHTML = rows.map(row => {
      if (!row.result) {
        return `<tr><td>${row.name}</td><td colspan="3"><em>Not completed</em></td></tr>`;
      }
      const g        = row.result;
      const score    = g[row.scoreKey];
      const scoreCls = score >= 75 ? 'good' : score >= 45 ? 'warn' : 'bad';
      const influenced = g.influenced ? 'Yes' : 'No';

      return `
        <tr>
          <td>${row.name}</td>
          <td class="score-cell" style="color:${scoreCls === 'good' ? 'var(--risk-low)' : scoreCls === 'warn' ? 'var(--risk-mod)' : 'var(--risk-high)'}">${score}/100</td>
          <td>${g.interpretation || '—'}<br/><small style="color:var(--text-muted)">${row.extra(g)}</small></td>
          <td>${influenced}</td>
        </tr>`;
    }).join('');
  }

  // ─────────────────────────────────────────────────────────────────────
  // RECOMMENDED ACTION (§5 rule engine)
  // ─────────────────────────────────────────────────────────────────────
  function renderAction(action) {
    const box = document.getElementById('action-box');
    if (box) box.className = `action-box ${action.key}`;

    setEl('action-icon',  action.icon);
    setEl('action-level', action.level);
    setEl('action-text',  action.text);
  }

  // ─────────────────────────────────────────────────────────────────────
  // DOCTOR SUMMARY CARD (§7)
  // Contains: Overall score, per-disease probs, critical flags,
  // games below 45, recommended action sentence
  // ─────────────────────────────────────────────────────────────────────
  function renderDoctorCard(risk, action, games, dateStr) {
    setEl('doc-overall',  `${risk.overallScore}/100 — ${risk.classification}`);
    setEl('doc-dr',       `${risk.diseases.dr.pct}% — ${risk.diseases.dr.label}`);
    setEl('doc-amd',      `${risk.diseases.amd.pct}% — ${risk.diseases.amd.label}`);
    setEl('doc-glaucoma', `${risk.diseases.glaucoma.pct}% — ${risk.diseases.glaucoma.label}`);
    setEl('doc-cataract', `${risk.diseases.cataract.pct}% — ${risk.diseases.cataract.label}`);
    setEl('doc-action',   `${action.icon} ${action.text}`);

    // Low game scores (§7 — games that deviated below 45)
    const lowGames = [];
    if (games.contrast   && games.contrast.score < 45)   lowGames.push(`Contrast: ${games.contrast.score}`);
    if (games.amsler     && games.amsler.score < 45)      lowGames.push(`Amsler: ${games.amsler.score}`);
    if (games.peripheral && games.peripheral.score < 45)  lowGames.push(`Peripheral: ${games.peripheral.score}`);
    if (games.hue        && games.hue.score < 45)         lowGames.push(`Hue: ${games.hue.score}`);
    setEl('doc-low-games', lowGames.length > 0 ? lowGames.join(', ') : 'None');

    // Critical flags
    const highDiseases = Object.entries(risk.diseases)
      .filter(([, d]) => d.key === 'high')
      .map(([key]) => key.toUpperCase());
    setEl('doc-flags', highDiseases.length > 0 ? `HIGH: ${highDiseases.join(', ')}` : 'None');
  }

  // ─────────────────────────────────────────────────────────────────────
  // FALLBACK — no session data
  // ─────────────────────────────────────────────────────────────────────
  function showNoData() {
    const main = document.querySelector('.report-main');
    if (!main) return;
    main.innerHTML = `
      <div class="container" style="text-align:center;padding:5rem 1.5rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">◉</div>
        <h2>No screening data found.</h2>
        <p style="color:var(--text-muted);max-width:400px;margin:1rem auto 2rem;">
          It looks like you haven't completed the screening pipeline yet,
          or your session data was cleared.
        </p>
        <a href="index.html" class="btn btn-primary">Start Screening →</a>
      </div>`;
  }

  // ─────────────────────────────────────────────────────────────────────
  // UTILITY
  // ─────────────────────────────────────────────────────────────────────
  function setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

})();