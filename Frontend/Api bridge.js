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
  /**
   * Change BASE_URL to your deployed backend root.
   * All endpoints below are relative to this.
   *
   * During local dev you can override via:
   *   window.RS_API_BASE = 'http://localhost:8000';
   *   (put this in a <script> tag before loading api-bridge.js)
   */
  const BASE_URL = window.RS_API_BASE || 'http://localhost:8000';

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
  // ENDPOINT 1 — POST /api/upload-image
  // ══════════════════════════════════════════════════════════════
  /**
   * Upload a fundus image + optional medical history.
   *
   * @param {File}   file          – the fundus image File object
   * @param {string} sessionId     – from RetinaSafeSession.get().sessionId
   * @param {Object} medicalHistory – { age_group, gender, conditions[], last_exam }
   *
   * @returns {Promise<{
   *   session_id   : string,   // backend session / job ID
   *   status       : "queued" | "processing" | "done",
   *   message      : string
   * }>}
   */
  async function uploadImage(file, sessionId, medicalHistory = {}) {
    const fd = new FormData();
    fd.append('image',           file);
    fd.append('session_id',      sessionId);
    fd.append('medical_history', JSON.stringify(medicalHistory));
    return request('POST', '/api/upload-image', fd, true);
  }

  // ══════════════════════════════════════════════════════════════
  // ENDPOINT 2 — GET /api/model-result/:sessionId
  // ══════════════════════════════════════════════════════════════
  /**
   * Poll the backend for the CNN model prediction result.
   * Call this after uploadImage; the model may take a few seconds.
   *
   * @param {string} sessionId – backend session_id returned by uploadImage
   *
   * @returns {Promise<{
   *   session_id  : string,
   *   status      : "queued" | "processing" | "done" | "error",
   *   predictions : {          // only present when status === "done"
   *     diabetic_retinopathy : { probability: number, risk_level: string },
   *     macular_degeneration : { probability: number, risk_level: string },
   *     glaucoma             : { probability: number, risk_level: string },
   *     cataract             : { probability: number, risk_level: string },
   *   },
   *   model_version : string,
   *   processed_at  : string   // ISO timestamp
   * }>}
   */
  async function getModelResult(sessionId) {
    return request('GET', `/api/model-result/${encodeURIComponent(sessionId)}`);
  }

  // ══════════════════════════════════════════════════════════════
  // ENDPOINT 3 — POST /api/game-result
  // ══════════════════════════════════════════════════════════════
  /**
   * Submit a single vision-game JSON payload to the backend.
   * Called by each game page immediately after the player
   * finishes, before redirecting back to screening.html.
   *
   * @param {string} sessionId – RetinaSafeSession.get().sessionId
   * @param {Object} gamePayload – the raw JSON produced by the game
   *   (see individual game schemas below in API_DOCUMENTATION.md)
   *
   * @returns {Promise<{
   *   session_id  : string,
   *   game_name   : string,
   *   status      : "saved",
   *   saved_at    : string
   * }>}
   */
  async function submitGameResult(sessionId, gamePayload) {
    return request('POST', '/api/game-result', {
      session_id   : sessionId,
      game_payload : gamePayload,
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ENDPOINT 4 — POST /api/compute-report
  // ══════════════════════════════════════════════════════════════
  /**
   * Combine model predictions + all 4 game results into a final
   * risk report. Call this once all games are done.
   *
   * The backend applies the fusion algorithm (model confidence
   * adjusted by game performance scores).
   *
   * @param {string} sessionId       – backend session_id
   * @param {Object} gameResults     – RetinaSafeSession.getGameResults()
   * @param {Object} modelOutput     – RetinaSafeSession.get().modelOutput
   * @param {Object} medicalHistory  – RetinaSafeSession.get().medicalHistory
   *
   * @returns {Promise<{
   *   session_id  : string,
   *   overall_risk_score : number,          // 0-100
   *   risk_label         : string,          // "Low" | "Borderline" | "Moderate" | "High" | "Critical"
   *   recommended_action : string,
   *   urgency_level      : string,
   *   conditions: {
   *     diabetic_retinopathy : {
   *       final_probability  : number,
   *       model_probability  : number,
   *       game_score         : number,
   *       risk_level         : string,
   *       game_flag          : string | null,
   *     },
   *     macular_degeneration : { ... },
   *     glaucoma             : { ... },
   *     cataract             : { ... },
   *   },
   *   generated_at : string,
   *   report_id    : string,
   * }>}
   */
  async function computeReport(sessionId, gameResults, modelOutput, medicalHistory) {
    return request('POST', '/api/compute-report', {
      session_id      : sessionId,
      game_results    : gameResults,
      model_output    : modelOutput,
      medical_history : medicalHistory,
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ENDPOINT 5 — GET /api/report/:reportId/pdf
  // ══════════════════════════════════════════════════════════════
  /**
   * Download the final PDF report.
   * Opens in a new browser tab or triggers a download.
   *
   * @param {string} reportId – from computeReport response
   */
  function downloadReportPDF(reportId) {
    window.open(`${BASE_URL}/api/report/${encodeURIComponent(reportId)}/pdf`, '_blank');
  }

  // ══════════════════════════════════════════════════════════════
  // ENDPOINT 6 — GET /api/health
  // ══════════════════════════════════════════════════════════════
  /**
   * Health check. Useful to verify the backend is reachable
   * before starting a screening session.
   *
   * @returns {Promise<{ status: "ok", version: string }>}
   */
  async function healthCheck() {
    return request('GET', '/api/health');
  }

  // ══════════════════════════════════════════════════════════════
  // MOCK MODE  (used when backend is not available)
  // ══════════════════════════════════════════════════════════════
  /**
   * Enable mock mode so the frontend works without a backend.
   * Call:  RetinaSafeAPI.enableMock();
   * before any API calls to use simulated responses.
   */
  let _mockEnabled = false;

  function enableMock() { _mockEnabled = true; console.info('[RetinaSafeAPI] Mock mode ON'); }
  function disableMock() { _mockEnabled = false; }
  function isMock() { return _mockEnabled; }

  /**
   * Mock versions of each endpoint for standalone frontend dev.
   * These mirror the real response shapes exactly.
   */
  const Mock = {
    uploadImage(file, sessionId) {
      return Promise.resolve({
        session_id : sessionId,
        status     : 'done',
        message    : 'Image received (mock)',
      });
    },
    getModelResult(sessionId) {
      const rand = () => +(Math.random() * 0.65 + 0.1).toFixed(3);
      const level = p => p < 0.35 ? 'Low' : p < 0.65 ? 'Moderate' : 'High';
      const dr = rand(), amd = rand(), gl = rand(), cat = rand();
      return Promise.resolve({
        session_id   : sessionId,
        status       : 'done',
        model_version: 'mock-v1.0',
        processed_at : new Date().toISOString(),
        predictions  : {
          diabetic_retinopathy : { probability: dr,  risk_level: level(dr)  },
          macular_degeneration : { probability: amd, risk_level: level(amd) },
          glaucoma             : { probability: gl,  risk_level: level(gl)  },
          cataract             : { probability: cat, risk_level: level(cat) },
        },
      });
    },
    submitGameResult(sessionId, payload) {
      return Promise.resolve({
        session_id : sessionId,
        game_name  : payload.game_name,
        status     : 'saved',
        saved_at   : new Date().toISOString(),
      });
    },
    computeReport(sessionId, gameResults, modelOutput) {
      // Simple fusion: average model probs adjusted by game scores
      const conds  = modelOutput ? modelOutput.predictions : {};
      const games  = gameResults || {};

      function fuse(condKey, gameName, gameScoreKey) {
        const modelProb  = conds[condKey]?.probability ?? (Math.random() * 0.5 + 0.1);
        const gameResult = Object.values(games).find(g => g.game_name === gameName);
        const gameScore  = gameResult?.[gameScoreKey] ?? 50;
        // Game score 0-100 → modifier 0.8-1.2 (low game score raises risk)
        const modifier   = 1.2 - (gameScore / 100) * 0.4;
        const final      = Math.min(1, modelProb * modifier);
        return {
          final_probability : +final.toFixed(3),
          model_probability : +modelProb.toFixed(3),
          game_score        : gameScore,
          risk_level        : final < 0.35 ? 'Low' : final < 0.65 ? 'Moderate' : 'High',
          game_flag         : gameResult?.game_flag || null,
        };
      }

      const dr   = fuse('diabetic_retinopathy', 'Contrast Discrimination', 'score');
      const amd  = fuse('macular_degeneration',  'Amsler Grid',            'compositeAMDScore');
      const gl   = fuse('glaucoma',              'Peripheral Reaction',    'score');
      const cat  = fuse('cataract',              'Hue Sorting',            'score');

      const avg = (dr.final_probability + amd.final_probability + gl.final_probability + cat.final_probability) / 4;
      const overall = Math.round(avg * 100);
      const label   = overall < 35 ? 'Low' : overall < 60 ? 'Borderline' : overall < 75 ? 'Moderate' : overall < 90 ? 'High' : 'Critical';
      const actions = {
        'Low'        : 'No immediate action required. Continue annual eye health screening.',
        'Borderline' : 'Monitor symptoms and rescreen in 6 months.',
        'Moderate'   : 'Schedule an ophthalmology consultation within 4–6 weeks.',
        'High'       : 'Book an urgent ophthalmology appointment within 1–2 weeks.',
        'Critical'   : 'Attend emergency ophthalmology or A&E immediately.',
      };
      const urgency = { Low:'ROUTINE', Borderline:'MONITOR', Moderate:'RECOMMENDED', High:'URGENT', Critical:'CRITICAL' };

      return Promise.resolve({
        session_id         : sessionId,
        overall_risk_score : overall,
        risk_label         : label,
        recommended_action : actions[label],
        urgency_level      : urgency[label],
        conditions: {
          diabetic_retinopathy : dr,
          macular_degeneration : amd,
          glaucoma             : gl,
          cataract             : cat,
        },
        generated_at : new Date().toISOString(),
        report_id    : 'mock-report-' + Date.now(),
      });
    },
    downloadReportPDF(reportId) {
      alert(`PDF download for report "${reportId}" – requires live backend.`);
    },
    healthCheck() {
      return Promise.resolve({ status: 'ok', version: 'mock-v1.0' });
    },
  };

  // ── PROXY: auto-use Mock when mockEnabled ─────────────────────
  return {
    enableMock,
    disableMock,
    isMock,

    uploadImage    : (...a) => _mockEnabled ? Mock.uploadImage(...a)     : uploadImage(...a),
    getModelResult : (...a) => _mockEnabled ? Mock.getModelResult(...a)  : getModelResult(...a),
    submitGameResult:(...a) => _mockEnabled ? Mock.submitGameResult(...a): submitGameResult(...a),
    computeReport  : (...a) => _mockEnabled ? Mock.computeReport(...a)   : computeReport(...a),
    downloadReportPDF:(...a)=> _mockEnabled ? Mock.downloadReportPDF(...a):downloadReportPDF(...a),
    healthCheck    : (...a) => _mockEnabled ? Mock.healthCheck(...a)     : healthCheck(...a),
  };
})();