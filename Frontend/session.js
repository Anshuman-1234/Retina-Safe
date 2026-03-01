/**
 * RetinaSafe — session.js
 * ─────────────────────────────────────────────────────────────
 * Shared session state manager.
 * Works entirely in localStorage so state persists when the
 * browser navigates between pages (games open in same tab).
 *
 * USAGE (all pages):
 *   <script src="session.js"></script>
 *
 * PUBLIC API:
 *   RetinaSafeSession.init(data)           – start a new session
 *   RetinaSafeSession.get()                – get current session object
 *   RetinaSafeSession.setImageUploaded(meta) – mark image done + store meta
 *   RetinaSafeSession.saveGameResult(result) – save one game JSON payload
 *   RetinaSafeSession.getGameResults()     – get all saved game payloads
 *   RetinaSafeSession.isGameDone(gameName) – check if a game is complete
 *   RetinaSafeSession.allGamesDone()       – true when all 4 games are done
 *   RetinaSafeSession.setModelOutput(data) – store backend model prediction
 *   RetinaSafeSession.clear()              – wipe session
 *   RetinaSafeSession.getReturnUrl()       – where to send user after a game
 */

window.RetinaSafeSession = (function () {
  'use strict';

  const KEY        = 'rs_session_v1';
  const RETURN_KEY = 'rs_return_url';

  // ── Canonical game names (must match game JSON payloads) ──────
  const GAME_NAMES = [
    'Contrast Discrimination',   // contrast_discrimination_challenge.html
    'Amsler Grid',               // dynamic_amsler_grid.html
    'Peripheral Reaction',       // peripheral_reaction_tester.html
    'Hue Sorting',               // color_hue_sorting.html
  ];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; }
    catch { return null; }
  }

  function save(obj) {
    try { localStorage.setItem(KEY, JSON.stringify(obj)); }
    catch (e) { console.warn('[RetinaSafeSession] localStorage write failed', e); }
  }

  // ── PUBLIC ────────────────────────────────────────────────────

  /** Create / reset a session. Call from Step 1 of screening. */
  function init(medicalHistory = {}) {
    const session = {
      sessionId    : crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
      createdAt    : new Date().toISOString(),
      medicalHistory,
      imageUploaded: false,
      imageMeta    : null,   // { filename, size, previewDataUrl, serverSessionId }
      gameResults  : {},     // keyed by game_name
      modelOutput  : null,   // backend prediction payload
      reportReady  : false,
    };
    save(session);
    return session;
  }

  function get() { return load(); }

  function setImageUploaded(meta = {}) {
    const s = load() || init();
    s.imageUploaded = true;
    s.imageMeta     = meta;
    save(s);
  }

  /**
   * Save a game result JSON payload.
   * Each game page calls this after the player finishes.
   * @param {Object} result – must contain `game_name` field
   */
  function saveGameResult(result) {
    if (!result || !result.game_name) {
      console.error('[RetinaSafeSession] saveGameResult: missing game_name', result);
      return;
    }
    const s = load() || init();
    s.gameResults[result.game_name] = {
      ...result,
      completedAt: new Date().toISOString(),
    };
    save(s);
    console.info('[RetinaSafeSession] Game result saved:', result.game_name, result);
  }

  function getGameResults() {
    const s = load();
    return s ? s.gameResults : {};
  }

  function isGameDone(gameName) {
    const results = getGameResults();
    return !!results[gameName];
  }

  function allGamesDone() {
    return GAME_NAMES.every(n => isGameDone(n));
  }

  function setModelOutput(data) {
    const s = load() || init();
    s.modelOutput = data;
    save(s);
  }

  function setReportReady(flag) {
    const s = load();
    if (s) { s.reportReady = flag; save(s); }
  }

  function clear() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(RETURN_KEY);
  }

  /** Games use this to know where to redirect after completion. */
  function getReturnUrl() {
    return localStorage.getItem(RETURN_KEY) || 'screening.html';
  }

  function setReturnUrl(url) {
    localStorage.setItem(RETURN_KEY, url);
  }

  return {
    GAME_NAMES,
    init,
    get,
    setImageUploaded,
    saveGameResult,
    getGameResults,
    isGameDone,
    allGamesDone,
    setModelOutput,
    setReportReady,
    clear,
    getReturnUrl,
    setReturnUrl,
  };
})();