/**
 * RetinaSafe — api-bridge.js
 * ─────────────────────────────────────────────────────────────
 * Centralised API client.  Every network call the front-end
 * makes lives here.  Backend developers only need to change
 * BASE_URL and the individual endpoint paths.
 *
 * All methods return Promises.
 * On success  → resolves with the parsed JSON response body.
 * On failure  → rejects with an Error whose .message is the
 *               server's error string (or a network message).
 *
 * USAGE:
 *   <script src="session.js"></script>
 *   <script src="api-bridge.js"></script>
 *
 *   const result = await RetinaSafeAPI.uploadImage(file, sessionId, medHistory);
 */

window.RetinaSafeAPI = (function () {
  'use strict';

  // ── CONFIGURATION ─────────────────────────────────────────────
  /* 
   * On Vercel, the backend is mapped to /api via vercel.json.
   * If running locally, you can still use window.RS_API_BASE.
   */
  const BASE_URL = window.RS_API_BASE || '/api';

  // ── LOW-LEVEL FETCH WRAPPER ────────────────────────────────────
  async function request(method, path, body, isFormData = false) {
    const url = `${BASE_URL}${path}`;
    const headers = {};
    let bodyPayload;

    if (body) {
      if (isFormData) {
        bodyPayload = body; // FormData – browser sets Content-Type automatically
      } else {
        headers['Content-Type'] = 'application/json';
        bodyPayload = JSON.stringify(body);
      }
    }

    let res;
    try {
      res = await fetch(url, { method, headers, body: bodyPayload });
    } catch (e) {
      throw new Error(`Network error: ${e.message}`);
    }

    let data;
    const ct = res.headers.get('Content-Type') || '';
    try {
      data = ct.includes('application/json') ? await res.json() : await res.text();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg = (data && data.detail) || (data && data.error) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  // ══════════════════════════════════════════════════════════════
  // ENDPOINT 1 — POST /predict
  // ══════════════════════════════════════════════════════════════
  /**
   * Upload a fundus image and get predictions directly.
   *
   * @param {File}   file          – the fundus image File object
   *
   * @returns {Promise<{
   *   results: Array<{ id: string, score: number }>
   * }>}
   */
  async function uploadImage(file) {
    const fd = new FormData();
    fd.append('image', file);
    return request('POST', '/predict', fd, true);
  }

  // Helper to map backend results to frontend format
  function mapBackendToPredictions(backendResults) {
    const predictions = {};
    const mapping = {
      'amd': 'macular_degeneration',
      'cataract': 'cataract',
      'diabetes': 'diabetic_retinopathy',
      'glaucoma': 'glaucoma',
      'hypertensive': 'hypertensive_retinopathy',
      'normal': 'normal'
    };

    backendResults.results.forEach(res => {
      const frontendId = mapping[res.id];
      if (frontendId) {
        predictions[frontendId] = {
          probability: res.score,
          risk_level: res.score < 0.35 ? 'Low' : res.score < 0.65 ? 'Moderate' : 'High'
        };
      }
    });

    return {
      status: 'done',
      predictions: predictions,
      processed_at: new Date().toISOString()
    };
  }

  // ══════════════════════════════════════════════════════════════
  // ENDPOINT 3 — POST /api/game-result
  // ══════════════════════════════════════════════════════════════
  async function submitGameResult(sessionId, gamePayload) {
    // This is currently a mockable action or saved locally in session.js
    // If backend doesn't support it yet, we just return success
    return Promise.resolve({ status: 'saved' });
  }

  // ══════════════════════════════════════════════════════════════
  // ENDPOINT 4 — Frontend-only Logic for Computing Report
  // ══════════════════════════════════════════════════════════════
  async function computeReport(sessionId, gameResults, modelOutput, medicalHistory) {
    // We'll handle fusion on the frontend for now to keep it responsive
    const conds = modelOutput ? modelOutput.predictions : {};
    const games = gameResults || {};

    function fuse(condKey, gameName, gameScoreKey) {
      const modelProb = conds[condKey]?.probability ?? 0.1;
      const gameResult = games[gameName];
      const gameScore = gameResult?.[gameScoreKey] ?? 50;

      // Game score 0-100 -> modifier 0.8-1.5 (low game score raises risk)
      const modifier = 1.3 - (gameScore / 100) * 0.5;
      const final = Math.min(1, modelProb * modifier);

      return {
        final_probability: +(final || 0).toFixed(3),
        model_probability: +(modelProb || 0).toFixed(3),
        game_score: gameScore,
        risk_level: final < 0.35 ? 'Low' : final < 0.65 ? 'Moderate' : 'High',
        game_flag: gameResult?.game_flag || null,
      };
    }

    const dr = fuse('diabetic_retinopathy', 'Contrast Discrimination', 'dr_contrast_score');
    const amd = fuse('macular_degeneration', 'Amsler Grid', 'amd_amsler_score');
    const gl = fuse('glaucoma', 'Peripheral Reaction', 'glaucoma_peripheral_score');
    const cat = fuse('cataract', 'Hue Sorting', 'cataract_hue_score');

    const avg = (dr.final_probability + amd.final_probability + gl.final_probability + cat.final_probability) / 4;
    const overall = Math.round(avg * 100);
    const label = overall < 35 ? 'Low' : overall < 60 ? 'Borderline' : overall < 75 ? 'Moderate' : overall < 90 ? 'High' : 'Critical';

    const actions = {
      'Low': 'No immediate action required. Continue annual eye health screening.',
      'Borderline': 'Monitor symptoms and rescreen in 6 months.',
      'Moderate': 'Schedule an ophthalmology consultation within 4–6 weeks.',
      'High': 'Book an urgent ophthalmology appointment within 1–2 weeks.',
      'Critical': 'Attend emergency ophthalmology or A&E immediately.',
    };
    const urgency = { Low: 'ROUTINE', Borderline: 'MONITOR', Moderate: 'RECOMMENDED', High: 'URGENT', Critical: 'CRITICAL' };

    return Promise.resolve({
      session_id: sessionId,
      overall_risk_score: overall,
      risk_label: label,
      recommended_action: actions[label],
      urgency_level: urgency[label],
      conditions: {
        diabetic_retinopathy: dr,
        macular_degeneration: amd,
        glaucoma: gl,
        cataract: cat,
      },
      generated_at: new Date().toISOString(),
      report_id: 'report-' + Date.now(),
    });
  }

  // ══════════════════════════════════════════════════════════════
  // MOCK MODE (Disabled by default)
  // ══════════════════════════════════════════════════════════════
  let _mockEnabled = false;
  function enableMock() { _mockEnabled = true; }
  function disableMock() { _mockEnabled = false; }
  function isMock() { return _mockEnabled; }

  return {
    enableMock, disableMock, isMock,
    uploadImage,
    mapBackendToPredictions,
    submitGameResult,
    computeReport,
    healthCheck: () => request('GET', '/health')
  };
})();