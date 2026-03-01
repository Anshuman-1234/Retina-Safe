/* ============================================================
   RetinaSafe — screening.js
   Multi-step wizard logic, file upload, games state, analysis
   ============================================================ */


'use strict';


// ── STATE ──────────────────────────────────────────────────
const state = {
  currentStep: 1,
  totalSteps: 5,
  imageUploaded: false,
  gamesCompleted: new Set(),  // stores gids 1-4
  analysisComplete: false,
};


// ── HELPERS ───────────────────────────────────────────────
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }


// ── STEP NAVIGATION ───────────────────────────────────────
function goToStep(n) {
  if (n < 1 || n > state.totalSteps) return;


  // Hide all steps
  qsa('.screen-step').forEach(el => el.classList.remove('ps-step-active'));


  // Show target step
  const target = qs(`#step-${n}`);
  if (target) target.classList.add('ps-step-active');


  // Update progress stepper
  qsa('.progress-step').forEach((el, i) => {
    const stepNum = i / 2 + 1; // steps are every other element (connectors in between)
    el.classList.remove('ps-active', 'ps-done');
  });


  // Re-index: actual step elements (not connectors)
  const stepEls = qsa('.progress-step');
  stepEls.forEach((el, i) => {
    const num = i + 1;
    el.classList.remove('ps-active', 'ps-done');
    if (num === n)  el.classList.add('ps-active');
    if (num < n)    el.classList.add('ps-done');
  });


  // Update connectors
  const connectors = qsa('.progress-connector');
  connectors.forEach((el, i) => {
    el.classList.remove('pc-done');
    if (i + 1 < n) el.classList.add('pc-done');
  });


  // Update aria
  const progressWrapper = qs('.progress-bar-wrapper');
  if (progressWrapper) progressWrapper.setAttribute('aria-valuenow', n);


  state.currentStep = n;


  // Scroll to top of main
  qs('#main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ── STEP 1 → 2 ────────────────────────────────────────────
qs('#step1-next')?.addEventListener('click', () => goToStep(2));


// ── STEP 2: FILE UPLOAD ───────────────────────────────────
const uploadArea  = qs('#upload-area');
const fileInput   = qs('#file-input');
const uploadIdle  = qs('#upload-idle');
const uploadPrev  = qs('#upload-preview');
const previewImg  = qs('#preview-img');
const previewName = qs('#preview-filename');
const previewSize = qs('#preview-size');
const step2Next   = qs('#step2-next');


function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}


function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;


  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewName.textContent = file.name;
    previewSize.textContent = formatBytes(file.size);
    uploadIdle.classList.add('hidden');
    uploadPrev.classList.remove('hidden');
    state.imageUploaded = true;
    if (step2Next) step2Next.disabled = false;
  };
  reader.readAsDataURL(file);
}


// Click to open file dialog
uploadArea?.addEventListener('click', (e) => {
  if (e.target.id === 'preview-replace') return;
  fileInput?.click();
});


uploadArea?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput?.click(); }
});


fileInput?.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});


// Drag and drop
uploadArea?.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
uploadArea?.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});


// Replace image
qs('#preview-replace')?.addEventListener('click', (e) => {
  e.stopPropagation();
  uploadPrev.classList.add('hidden');
  uploadIdle.classList.remove('hidden');
  state.imageUploaded = false;
  if (step2Next) step2Next.disabled = true;
  if (fileInput) fileInput.value = '';
});


qs('#step2-next')?.addEventListener('click', () => goToStep(3));


// ── BACK BUTTONS (generic via data-back) ──────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-back]');
  if (!btn) return;
  goToStep(parseInt(btn.dataset.back, 10));
});


// ── STEP 3: GAMES ─────────────────────────────────────────
function updateGamesProgress() {
  const count = state.gamesCompleted.size;
  const bar   = qs('#gpr-bar');
  const label = qs('#gpr-label');
  if (bar)   bar.style.width = `${(count / 4) * 100}%`;
  if (label) label.textContent = `${count} of 4 games completed`;


  const next = qs('#step3-next');
  if (next) next.disabled = count < 4;
}


// Simulate a game session (in a real build each button opens games.html)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-gid]');
  if (!btn) return;


  const gid = btn.dataset.gid;
  const row = qs(`#grow-${gid}`);
  if (!row) return;


  // Disable button while "playing"
  btn.disabled = true;
  btn.textContent = 'Playing…';


  // Simulate game completion after 1.5s
  setTimeout(() => {
    state.gamesCompleted.add(gid);


    const dot   = row.querySelector('.grow-dot');
    const badge = qs(`#gbadge-${gid}`);


    dot?.classList.replace('dot-pending', 'dot-done');
    row.classList.add('gr-done');


    if (badge) {
      badge.textContent = 'Complete';
      badge.classList.replace('badge-pending', 'badge-done');
    }


    btn.textContent = '✓ Done';
    btn.classList.replace('btn-primary', 'btn-outline');


    updateGamesProgress();
  }, 1500);
});


updateGamesProgress();


qs('#step3-next')?.addEventListener('click', () => {
  goToStep(4);
  runAnalysis();
});


// ── STEP 4: ANALYSIS SIMULATION ───────────────────────────
function runAnalysis() {
  const logs = qsa('.log-item');
  let idx = 0;


  function activateNext() {
    if (idx > 0) {
      logs[idx - 1]?.classList.replace('log-active', 'log-done');
      logs[idx - 1]?.querySelector('.log-dot')?.classList.remove('log-active');
    }
    if (idx < logs.length) {
      logs[idx]?.classList.add('log-active');
      idx++;
      setTimeout(activateNext, 1800);
    } else {
      // All done — show report
      setTimeout(() => {
        buildReport();
        goToStep(5);
      }, 600);
    }
  }


  // Reset log state
  logs.forEach(l => { l.classList.remove('log-active', 'log-done'); });
  activateNext();
}


// ── STEP 5: REPORT GENERATION ─────────────────────────────
function buildReport() {
  // Simulated scores — in production these come from the backend API
  const scores = {
    overall: Math.floor(Math.random() * 60) + 20,
    dr:   { prob: +(Math.random() * 0.6).toFixed(2), game: Math.floor(Math.random() * 40) + 40 },
    amd:  { prob: +(Math.random() * 0.5).toFixed(2), game: Math.floor(Math.random() * 40) + 50 },
    glauc:{ prob: +(Math.random() * 0.55).toFixed(2),game: Math.floor(Math.random() * 35) + 45 },
    cat:  { prob: +(Math.random() * 0.5).toFixed(2), game: Math.floor(Math.random() * 40) + 50 },
  };


  // Overall score
  const scoreEl = qs('#rsc-score');
  if (scoreEl) scoreEl.textContent = scores.overall;


  // Risk classification
  const { label, badgeClass, action, urgency, urgencyClass } = getRiskInfo(scores.overall);
  const badgeEl = qs('#rsc-badge');
  if (badgeEl) { badgeEl.textContent = label; badgeEl.className = `rsc-badge ${badgeClass}`; }


  const actionEl = qs('#rsc-action');
  if (actionEl) actionEl.textContent = action;


  const urgencyEl = qs('#rsc-urgency');
  if (urgencyEl) { urgencyEl.textContent = urgency; urgencyEl.className = `rsc-urgency ${urgencyClass}`; }


  // Per-disease panels
  fillDisease('dr',   scores.dr,   'Contrast score');
  fillDisease('amd',  scores.amd,  'Amsler score');
  fillDisease('glauc',scores.glauc,'Peripheral score');
  fillDisease('cat',  scores.cat,  'Hue score');
}


function getRiskInfo(score) {
  if (score < 35)  return { label: 'Low Risk',        badgeClass: 'badge-low',        action: 'No immediate action required. Continue annual eye health screening.', urgency: 'ROUTINE',     urgencyClass: 'badge-low' };
  if (score < 60)  return { label: 'Borderline',      badgeClass: 'badge-borderline', action: 'Monitor symptoms and rescreen with RetinaSafe in 6 months.',          urgency: 'MONITOR',     urgencyClass: 'badge-borderline' };
  if (score < 75)  return { label: 'Moderate Risk',   badgeClass: 'badge-moderate',   action: 'Schedule an ophthalmology consultation within 4–6 weeks.',             urgency: 'RECOMMENDED', urgencyClass: 'badge-moderate' };
  if (score < 90)  return { label: 'High Risk',       badgeClass: 'badge-high',        action: 'Book an urgent ophthalmology appointment within 1–2 weeks.',           urgency: 'URGENT',      urgencyClass: 'badge-high' };
  return              { label: 'Critical',         badgeClass: 'badge-critical',    action: 'Attend emergency ophthalmology or A&E eye department immediately.',    urgency: 'CRITICAL',    urgencyClass: 'badge-critical' };
}


function fillDisease(key, data, gameLabel) {
  const probEl  = qs(`#dc-${key}-prob`);
  const barEl   = qs(`#dc-${key}-bar`);
  const gameEl  = qs(`#dc-${key}-game`);
  const levelEl = qs(`#dc-${key}-level`);


  const pct = Math.round(data.prob * 100);


  if (probEl)  probEl.textContent  = `${pct}%`;
  if (gameEl)  gameEl.textContent  = `${gameLabel}: ${data.game}/100`;


  // Animate bar after a tick
  requestAnimationFrame(() => {
    if (barEl) barEl.style.width = `${pct}%`;
  });


  const lvl = pct < 35 ? 'Low' : pct < 60 ? 'Moderate' : 'High';
  if (levelEl) { levelEl.textContent = lvl; levelEl.style.color = pct < 35 ? 'var(--glauc-color)' : pct < 60 ? 'var(--cat-color)' : 'var(--risk-high)'; }
}


// ── REPORT ACTIONS ────────────────────────────────────────
qs('#download-report')?.addEventListener('click', () => {
  alert('PDF report download would be generated server-side in production. Your report data has been prepared.');
});


qs('#find-doctor')?.addEventListener('click', () => {
  alert('In production, this opens a map of nearby ophthalmologists using the Location API.');
});


qs('#restart-screening')?.addEventListener('click', () => {
  // Reset state
  state.imageUploaded = false;
  state.gamesCompleted.clear();
  state.analysisComplete = false;


  // Reset upload UI
  qs('#upload-idle')?.classList.remove('hidden');
  qs('#upload-preview')?.classList.add('hidden');
  if (qs('#step2-next')) qs('#step2-next').disabled = true;


  // Reset games UI
  qsa('.game-row').forEach((row, i) => {
    row.classList.remove('gr-done');
    const gid = i + 1;
    const dot   = row.querySelector('.grow-dot');
    const badge = qs(`#gbadge-${gid}`);
    const btn   = row.querySelector('[data-gid]');
    dot?.classList.replace('dot-done', 'dot-pending');
    if (badge) { badge.textContent = 'Not Started'; badge.classList.replace('badge-done', 'badge-pending'); }
    if (btn)   { btn.disabled = false; btn.textContent = 'Start Game'; btn.classList.replace('btn-outline', 'btn-primary'); }
  });


  updateGamesProgress();
  goToStep(1);
});


// ── INIT ──────────────────────────────────────────────────
goToStep(1);

