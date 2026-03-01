/**
 * RetinaSafe — screening.js  (v2)
 * ─────────────────────────────────────────────────────────────
 * Multi-step wizard:
 *   Step 1 – Medical History
 *   Step 2 – Fundus Image Upload  →  POST /api/upload-image
 *   Step 3 – Vision Games         →  launches each game, collects JSON
 *   Step 4 – Final Report         →  POST /api/compute-report
 *
 * Removed: the old "AI Analysis" step (step 4).
 * Model result is polled silently in the background after image
 * upload so it is ready by the time all games are done.
 *
 * Dependencies (must load before this file):
 *   session.js
 *   api-bridge.js
 */
'use strict';

// ── Enable mock mode for standalone development ───────────────
// Remove / comment this line when a real backend is available.
RetinaSafeAPI.enableMock();

// ── HELPERS ────────────────────────────────────────────────────
const qs  = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => [...ctx.querySelectorAll(s)];

// ── STATE ──────────────────────────────────────────────────────
const state = {
  currentStep     : 1,
  imageUploaded   : false,
  backendSessionId: null,
  modelPolling    : null,
  modelReady      : false,
  reportData      : null,
};

// ── STEP NAVIGATION ────────────────────────────────────────────
const TOTAL_STEPS = 4;

function goToStep(n) {
  if (n < 1 || n > TOTAL_STEPS) return;

  qsa('.screen-step').forEach(el => el.classList.remove('ps-step-active'));
  const target = qs(`#step-${n}`);
  if (target) target.classList.add('ps-step-active');

  const stepEls = qsa('.progress-step');
  stepEls.forEach((el, i) => {
    el.classList.remove('ps-active', 'ps-done');
    if (i + 1 === n) el.classList.add('ps-active');
    if (i + 1 < n)  el.classList.add('ps-done');
  });

  const connectors = qsa('.progress-connector');
  connectors.forEach((el, i) => {
    el.classList.remove('pc-done');
    if (i + 1 < n) el.classList.add('pc-done');
  });

  const pw = qs('.progress-bar-wrapper');
  if (pw) pw.setAttribute('aria-valuenow', n);

  state.currentStep = n;
  qs('#main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (n === 3) renderGamesStep();
}

// ── STEP 1: MEDICAL HISTORY ────────────────────────────────────
qs('#step1-next')?.addEventListener('click', () => {
  const history = collectMedicalHistory();
  RetinaSafeSession.init(history);
  goToStep(2);
});

function collectMedicalHistory() {
  return {
    age_group  : qs('#age-group')?.value || '',
    gender     : qs('#gender')?.value    || '',
    last_exam  : qs('#last-exam')?.value || '',
    conditions : qsa('.checkbox-input:checked').map(cb => cb.name),
  };
}

// ── STEP 2: IMAGE UPLOAD ───────────────────────────────────────
const uploadArea  = qs('#upload-area');
const fileInput   = qs('#file-input');
const uploadIdle  = qs('#upload-idle');
const uploadPrev  = qs('#upload-preview');
const previewImg  = qs('#preview-img');
const previewName = qs('#preview-filename');
const previewSize = qs('#preview-size');
const step2Next   = qs('#step2-next');

// Inject a status element after upload area
function ensureUploadStatus() {
  let el = qs('#upload-status');
  if (!el) {
    el = document.createElement('p');
    el.id        = 'upload-status';
    el.className = 'upload-status upload-status-info';
    el.hidden    = true;
    uploadArea?.after(el);
  }
  return el;
}

function showUploadStatus(msg, type = 'info') {
  const el = ensureUploadStatus();
  el.textContent = msg;
  el.className   = `upload-status upload-status-${type}`;
  el.hidden      = false;
}
function hideUploadStatus() {
  const el = qs('#upload-status');
  if (el) el.hidden = true;
}

function formatBytes(bytes) {
  return bytes < 1048576
    ? (bytes / 1024).toFixed(1) + ' KB'
    : (bytes / 1048576).toFixed(1) + ' MB';
}

async function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  // Show preview immediately
  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src          = e.target.result;
    previewName.textContent = file.name;
    previewSize.textContent = formatBytes(file.size);
    uploadIdle.classList.add('hidden');
    uploadPrev.classList.remove('hidden');
    state.imageUploaded = true;
  };
  reader.readAsDataURL(file);

  // Upload to backend
  showUploadStatus('Uploading image…', 'info');
  if (step2Next) step2Next.disabled = true;

  try {
    const session = RetinaSafeSession.get() || RetinaSafeSession.init();
    const res = await RetinaSafeAPI.uploadImage(
      file,
      session.sessionId,
      session.medicalHistory || {}
    );

    state.backendSessionId = res.session_id;
    RetinaSafeSession.setImageUploaded({
      filename        : file.name,
      size            : file.size,
      serverSessionId : res.session_id,
    });

    showUploadStatus('Image uploaded successfully ✓', 'success');
    if (step2Next) step2Next.disabled = false;

    // Begin polling model result in background
    startModelPolling(res.session_id);

  } catch (err) {
    showUploadStatus(`Upload failed: ${err.message} — you may still continue.`, 'error');
    console.error('[screening] upload error:', err);
    if (step2Next) step2Next.disabled = false;
  }
}

// Upload interaction handlers
uploadArea?.addEventListener('click', e => {
  if (e.target.id === 'preview-replace') return;
  fileInput?.click();
});
uploadArea?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput?.click(); }
});
fileInput?.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});
uploadArea?.addEventListener('dragover', e => {
  e.preventDefault(); uploadArea.classList.add('drag-over');
});
uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
uploadArea?.addEventListener('drop', e => {
  e.preventDefault(); uploadArea.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
qs('#preview-replace')?.addEventListener('click', e => {
  e.stopPropagation();
  uploadPrev.classList.add('hidden');
  uploadIdle.classList.remove('hidden');
  state.imageUploaded = false;
  hideUploadStatus();
  if (step2Next) step2Next.disabled = true;
  if (fileInput) fileInput.value = '';
});

qs('#step2-next')?.addEventListener('click', () => goToStep(3));

// ── BACKGROUND MODEL POLLING ───────────────────────────────────
function startModelPolling(serverSessionId) {
  if (state.modelPolling) clearInterval(state.modelPolling);
  let attempts = 0;
  const MAX    = 20; // 20 × 2s = 40s total

  state.modelPolling = setInterval(async () => {
    attempts++;
    try {
      const res = await RetinaSafeAPI.getModelResult(serverSessionId);
      if (res.status === 'done') {
        clearInterval(state.modelPolling);
        state.modelPolling = null;
        state.modelReady   = true;
        RetinaSafeSession.setModelOutput(res);
        console.info('[screening] Model result ready:', res);
        if (state.currentStep === 3) updateGamesProgress();
      }
    } catch (e) {
      console.warn('[screening] Model poll attempt', attempts, 'failed:', e.message);
    }
    if (attempts >= MAX) {
      clearInterval(state.modelPolling);
      state.modelPolling = null;
      console.warn('[screening] Model polling timed out — proceeding with game data only.');
    }
  }, 2000);
}

// ── STEP 3: VISION GAMES ──────────────────────────────────────
const GAMES = [
  {
    id         : 1,
    game_name  : 'Contrast Discrimination',
    label      : 'Contrast Discrimination',
    detects    : 'Diabetic Retinopathy',
    url        : 'contrast_discrimination_challenge.html',
    description: '10 contrast levels, 30+ trials. Identify a subtly different object against grey. ~3 min.',
    emoji      : '🌫',
  },
  {
    id         : 2,
    game_name  : 'Amsler Grid',
    label      : 'Dynamic Amsler Grid',
    detects    : 'Macular Degeneration',
    url        : 'dynamic_amsler_grid.html',
    description: 'Mark wavy or missing lines — each eye separately. Central zone weighted 4×. ~2 min.',
    emoji      : '⊞',
  },
  {
    id         : 3,
    game_name  : 'Peripheral Reaction',
    label      : 'Peripheral Reaction Tester',
    detects    : 'Glaucoma',
    url        : 'peripheral_reaction_tester.html',
    description: 'Fixate centre. 32 peripheral flashes across 8 zones at 200 ms each. ~1 min.',
    emoji      : '✦',
  },
  {
    id         : 4,
    game_name  : 'Hue Sorting',
    label      : 'Color Hue Sorting',
    detects    : 'Cataract',
    url        : 'color_hue_sorting.html',
    description: 'Find the odd-hue tile. 10 rounds on the blue-yellow tritan axis. 30 s limit.',
    emoji      : '🎨',
  },
];

function renderGamesStep() {
  const container = qs('#games-checklist');
  if (!container) return;

  container.innerHTML = GAMES.map(g => {
    const done     = RetinaSafeSession.isGameDone(g.game_name);
    const dotCls   = done ? 'dot-done' : 'dot-pending';
    const badgeTxt = done ? 'Complete' : 'Not Started';
    const badgeCls = done ? 'badge-done' : 'badge-pending';
    const rowCls   = done ? 'game-row gr-done' : 'game-row';
    return `
      <div class="${rowCls}" id="grow-${g.id}">
        <div class="grow-left">
          <div class="grow-dot ${dotCls}" aria-hidden="true"></div>
          <div class="grow-info">
            <div class="grow-meta">
              <span class="grow-num">0${g.id}</span>
              <h3 class="grow-title">${g.label}</h3>
              <span class="grow-tag">${g.detects}</span>
            </div>
            <p class="grow-desc">${g.description}</p>
          </div>
        </div>
        <div class="grow-right">
          <span class="game-badge ${badgeCls}" id="gbadge-${g.id}">${badgeTxt}</span>
          <button class="btn ${done ? 'btn-outline' : 'btn-primary'} btn-sm" data-launch="${g.id}">
            ${done ? '↺ Redo' : 'Start Game'}
          </button>
        </div>
      </div>`;
  }).join('');

  updateGamesProgress();

  container.querySelectorAll('[data-launch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const gid  = parseInt(btn.dataset.launch, 10);
      const game = GAMES.find(g => g.id === gid);
      if (game) launchGame(game);
    });
  });
}

function launchGame(game) {
  RetinaSafeSession.setReturnUrl('screening.html');
  window.location.href = game.url;
}

function updateGamesProgress() {
  const done  = GAMES.filter(g => RetinaSafeSession.isGameDone(g.game_name)).length;
  const total = GAMES.length;
  const bar   = qs('#gpr-bar');
  const label = qs('#gpr-label');
  const next  = qs('#step3-next');
  if (bar)   bar.style.width      = `${(done / total) * 100}%`;
  if (label) label.textContent    = `${done} of ${total} games completed`;
  if (next)  next.disabled        = done < total;
}

qs('#step3-next')?.addEventListener('click', () => buildReport());

// ── STEP 4: COMBINED REPORT ────────────────────────────────────
async function buildReport() {
  const session = RetinaSafeSession.get();
  if (!session) return;

  goToStep(4);

  const loadingDiv = qs('#report-loading');
  const contentDiv = qs('#report-content');
  if (loadingDiv) loadingDiv.hidden = false;
  if (contentDiv) contentDiv.hidden = true;

  try {
    const reportData = await RetinaSafeAPI.computeReport(
      session.imageMeta?.serverSessionId || session.sessionId,
      RetinaSafeSession.getGameResults(),
      session.modelOutput,
      session.medicalHistory
    );

    state.reportData = reportData;
    RetinaSafeSession.setReportReady(true);

    if (loadingDiv) loadingDiv.hidden = true;
    if (contentDiv) contentDiv.hidden = false;

    renderReport(reportData);

  } catch (err) {
    console.error('[screening] compute-report failed:', err);
    if (loadingDiv) loadingDiv.hidden = true;
    if (contentDiv) {
      contentDiv.hidden = false;
      contentDiv.innerHTML = `
        <div class="report-disclaimer">
          <p><strong>⚠ Report generation failed:</strong> ${err.message}</p>
        </div>`;
    }
  }
}

function getRiskInfo(score) {
  if (score < 35) return { label:'Low Risk',      badgeClass:'badge-low',        action:'No immediate action required. Continue annual eye health screening.',            urgency:'ROUTINE' };
  if (score < 60) return { label:'Borderline',    badgeClass:'badge-borderline', action:'Monitor symptoms and rescreen with RetinaSafe in 6 months.',                    urgency:'MONITOR' };
  if (score < 75) return { label:'Moderate Risk', badgeClass:'badge-moderate',   action:'Schedule an ophthalmology consultation within 4–6 weeks.',                      urgency:'RECOMMENDED' };
  if (score < 90) return { label:'High Risk',     badgeClass:'badge-high',       action:'Book an urgent ophthalmology appointment within 1–2 weeks.',                    urgency:'URGENT' };
  return              { label:'Critical',        badgeClass:'badge-critical',    action:'Attend emergency ophthalmology or A&E eye department immediately.',             urgency:'CRITICAL' };
}

function renderReport(r) {
  const score = r.overall_risk_score;
  const { label, badgeClass, action, urgency } = getRiskInfo(score);

  const scoreEl   = qs('#rsc-score');
  const badgeEl   = qs('#rsc-badge');
  const actionEl  = qs('#rsc-action');
  const urgencyEl = qs('#rsc-urgency');

  if (scoreEl)   scoreEl.textContent   = score;
  if (badgeEl)   { badgeEl.textContent = label; badgeEl.className = `rsc-badge ${badgeClass}`; }
  if (actionEl)  actionEl.textContent  = action;
  if (urgencyEl) { urgencyEl.textContent = urgency; urgencyEl.className = `rsc-urgency ${badgeClass}`; }

  const condMap = {
    dr    : r.conditions?.diabetic_retinopathy,
    amd   : r.conditions?.macular_degeneration,
    glauc : r.conditions?.glaucoma,
    cat   : r.conditions?.cataract,
  };
  const gameLabels = { dr:'Contrast score', amd:'Amsler score', glauc:'Peripheral score', cat:'Hue score' };

  Object.entries(condMap).forEach(([key, data]) => {
    if (!data) return;
    const pct      = Math.round((data.final_probability ?? data.model_probability ?? 0) * 100);
    const lvl      = data.risk_level || (pct < 35 ? 'Low' : pct < 65 ? 'Moderate' : 'High');
    const lvlColor = pct < 35 ? 'var(--glauc-color)' : pct < 65 ? 'var(--cat-color)' : 'var(--risk-high)';

    const probEl  = qs(`#dc-${key}-prob`);
    const barEl   = qs(`#dc-${key}-bar`);
    const gameEl  = qs(`#dc-${key}-game`);
    const levelEl = qs(`#dc-${key}-level`);

    if (probEl)  probEl.textContent  = `${pct}%`;
    if (gameEl)  gameEl.textContent  = `${gameLabels[key]}: ${data.game_score ?? '—'}/100`;
    if (levelEl) { levelEl.textContent = lvl; levelEl.style.color = lvlColor; }
    requestAnimationFrame(() => { if (barEl) barEl.style.width = `${pct}%`; });
  });

  // Game flags (e.g. "Tritan Deficiency Noted")
  const flagContainer = qs('#report-game-flags');
  if (flagContainer) {
    const flags = Object.values(r.conditions || {})
      .filter(c => c?.game_flag)
      .map(c => c.game_flag);
    if (flags.length) {
      flagContainer.innerHTML = flags.map(f =>
        `<p class="report-flag-item">⚠ ${f}</p>`
      ).join('');
      flagContainer.hidden = false;
    }
  }
}

// ── REPORT ACTIONS ────────────────────────────────────────────
qs('#download-report')?.addEventListener('click', () => {
  if (state.reportData?.report_id) {
    RetinaSafeAPI.downloadReportPDF(state.reportData.report_id);
  } else {
    alert('Report not yet generated. Please complete all steps first.');
  }
});

qs('#find-doctor')?.addEventListener('click', () => {
  alert('In production this opens a map of nearby ophthalmologists using the Geolocation API.');
});

qs('#restart-screening')?.addEventListener('click', () => {
  RetinaSafeSession.clear();
  uploadIdle?.classList.remove('hidden');
  uploadPrev?.classList.add('hidden');
  hideUploadStatus();
  if (step2Next) step2Next.disabled = true;
  if (fileInput) fileInput.value    = '';
  state.imageUploaded     = false;
  state.backendSessionId  = null;
  state.modelReady        = false;
  state.reportData        = null;
  if (state.modelPolling) { clearInterval(state.modelPolling); state.modelPolling = null; }
  goToStep(1);
});

// ── BACK BUTTONS ──────────────────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-back]');
  if (!btn) return;
  goToStep(parseInt(btn.dataset.back, 10));
});

// ── ON PAGE LOAD: Restore state if returning from a game ───────
(function checkReturnFromGame() {
  const session = RetinaSafeSession.get();
  if (!session) { goToStep(1); return; }

  if (RetinaSafeSession.allGamesDone() && session.imageUploaded) {
    if (session.reportReady && session.modelOutput) {
      goToStep(4);
      buildReport();
    } else {
      goToStep(3);
    }
    return;
  }

  if (session.imageUploaded) {
    if (session.imageMeta?.serverSessionId && !session.modelOutput) {
      startModelPolling(session.imageMeta.serverSessionId);
    }
    goToStep(3);
    return;
  }

  goToStep(1);
})();