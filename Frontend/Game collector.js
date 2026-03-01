/**
 * RetinaSafe — game-collector.js
 * ─────────────────────────────────────────────────────────────
 * Drop this script into every vision-game HTML page.
 * It provides a single function:
 *
 *   RetinaSafeCollector.submit(payload)
 *
 * Each game calls this instead of (or after) logging to console.
 *
 * What it does:
 *   1. Saves the payload to the shared session (localStorage).
 *   2. POSTs the payload to POST /api/game-result (async, fire-and-forget).
 *   3. Redirects back to screening.html (or wherever setReturnUrl pointed).
 *
 * USAGE in each game's end-game handler:
 *   RetinaSafeCollector.submit(finalPayload);
 *
 * The payload MUST contain a `game_name` field matching one of:
 *   - "Contrast Discrimination"
 *   - "Amsler Grid"
 *   - "Peripheral Reaction"
 *   - "Hue Sorting"
 *
 * Dependencies (must load before this file):
 *   session.js
 *   api-bridge.js
 *
 * ─────────────────────────────────────────────────────────────
 * Integration checklist per game page:
 *
 *  ✅ Add to <head> or before </body>:
 *     <script src="session.js"></script>
 *     <script src="api-bridge.js"></script>
 *     <script src="game-collector.js"></script>
 *
 *  ✅ In the game's endGame / showResults function, replace or
 *     supplement the console.log call with:
 *     RetinaSafeCollector.submit(finalPayload);
 *
 *  ✅ The redirect back happens automatically after ~400ms.
 *     If the user reloads the game page directly (not from
 *     screening), they are sent to screening.html to start fresh.
 */

window.RetinaSafeCollector = (function () {
  'use strict';

  // How long to show the "result saved" overlay before redirecting (ms)
  const REDIRECT_DELAY = 1200;

  /**
   * Submit a completed game result.
   * @param {Object} payload – game JSON output (must have game_name)
   */
  async function submit(payload) {
    if (!payload || !payload.game_name) {
      console.error('[RetinaSafeCollector] submit() called without game_name:', payload);
      return;
    }

    console.info('[RetinaSafeCollector] Submitting result for:', payload.game_name, payload);

    // 1. Save to session (synchronous, localStorage)
    if (window.RetinaSafeSession) {
      RetinaSafeSession.saveGameResult(payload);
    } else {
      console.warn('[RetinaSafeCollector] session.js not loaded — result not persisted locally.');
    }

    // 2. POST to backend (async, non-blocking)
    if (window.RetinaSafeAPI) {
      const session   = RetinaSafeSession?.get();
      const sessionId = session?.imageMeta?.serverSessionId || session?.sessionId || 'unknown';
      RetinaSafeAPI.submitGameResult(sessionId, payload).catch(err => {
        console.warn('[RetinaSafeCollector] Backend submit failed (result still saved locally):', err.message);
      });
    }

    // 3. Show brief overlay then redirect
    showReturnOverlay(payload.game_name, () => {
      const returnUrl = RetinaSafeSession?.getReturnUrl() || 'screening.html';
      window.location.href = returnUrl;
    });
  }

  /**
   * Show a small non-intrusive overlay confirming the result was saved,
   * then invoke callback.
   */
  function showReturnOverlay(gameName, callback) {
    // Remove any existing overlay
    document.getElementById('rs-collector-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'rs-collector-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = `
      <div class="rs-co-inner">
        <div class="rs-co-check">✓</div>
        <div class="rs-co-text">
          <strong>${gameName}</strong> complete<br>
          <span>Returning to screening…</span>
        </div>
      </div>`;

    const style = document.createElement('style');
    style.textContent = `
      #rs-collector-overlay {
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        animation: rs-co-slide-up 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
      }
      @keyframes rs-co-slide-up {
        from { opacity:0; transform:translateX(-50%) translateY(20px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
      .rs-co-inner {
        display: flex;
        align-items: center;
        gap: 14px;
        background: #1E3A5F;
        color: #fff;
        padding: 14px 24px;
        border-radius: 100px;
        box-shadow: 0 8px 32px rgba(30,58,95,0.35);
        font-family: 'Source Sans 3', 'Segoe UI', sans-serif;
        font-size: 0.95rem;
        white-space: nowrap;
      }
      .rs-co-check {
        width: 32px; height: 32px;
        background: #10B981;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem; font-weight: 700; flex-shrink: 0;
      }
      .rs-co-text { line-height: 1.4; }
      .rs-co-text strong { display: block; }
      .rs-co-text span { font-size: 0.82rem; opacity: 0.75; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    setTimeout(callback, REDIRECT_DELAY);
  }

  /**
   * Check whether this page was launched as part of a screening session.
   * Returns false if the user navigated directly (no active session).
   * Games can use this to show a warning if no session is found.
   */
  function hasActiveSession() {
    if (!window.RetinaSafeSession) return false;
    const s = RetinaSafeSession.get();
    return !!(s && s.imageUploaded);
  }

  return { submit, hasActiveSession };
})();