/**
 * RetinaSafe — screening.js (v3)
 * Step 1  Medical History
 * Step 2  Fundus Image Upload
 * Step 3  Vision Games — 4 cards always visible, each opens in
 *         an iframe modal so the screening page stays alive.
 *         localStorage 'storage' events auto-update cards when
 *         a game completes inside the iframe.
 * Step 4  Final Report
 */
'use strict';

const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => [...ctx.querySelectorAll(s)];

const state = { currentStep: 1, modelPolling: null, reportData: null, currentLang: 'en', cameraFacing: 'environment' };

// ── TRANSLATIONS ───────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    s1_heading: "Patient Information",
    s1_desc: "Enter your medical background to calibrate the diagnostic weights.",
    s2_heading: "Upload Fundus Image",
    s2_desc: "Upload a retinal fundus photograph. This can be captured via a fundus camera, smartphone adapter, or provided by your clinic.",
    s3_heading: "Vision Challenges",
    s3_desc: "Complete all 4 screening games to measure functional vision performance across different retinal zones.",
    s4_heading: "Clinical Analysis Report",
    s4_desc: "Your screening results have been generated using professional-grade TFLite AI models.",
    warn_title: "Important Requirement",
    warn_text: "Please upload only clear, clinically valid retinal fundus images. Providing unrelated images will lead to unexpected results.",
    btn_next: "Next Step",
    btn_prev: "Previous",
    btn_capture: "Capture",
    btn_switch: "Switch Camera",
    btn_cancel: "Cancel",
    btn_upload: "Select File",
    err_step_upload: "You must upload a valid retinal image before proceeding.",
    err_step_games: "Please complete all 4 vision games before generating your report.",
    toast_welcome: "RetinaSafe: Multilingual support activated."
  },
  hi: {
    s1_heading: "रोगी की जानकारी",
    s1_desc: "डायग्नोस्टिक वेट्स को कैलिब्रेट करने के लिए अपनी चिकित्सा पृष्ठभूमि दर्ज करें।",
    s2_heading: "फंडस इमेज अपलोड करें",
    s2_desc: "रेटिनल फंडस फोटोग्राफ अपलोड करें। इसे फंडस कैमरा या स्मार्टफोन एडाप्टर के माध्यम से लिया जा सकता है।",
    s3_heading: "दृष्टि चुनौतियाँ",
    s3_desc: "विभिन्न रेटिनल ज़ोन में दृष्टि प्रदर्शन को मापने के लिए सभी 4 स्क्रीनिंग गेम पूरे करें।",
    s4_heading: "नैदानिक विश्लेषण रिपोर्ट",
    s4_desc: "आपकी स्क्रीनिंग के परिणाम पेशेवर TFLite AI मॉडल का उपयोग करके तैयार किए गए हैं।",
    warn_title: "महत्वपूर्ण आवश्यकता",
    warn_text: "कृपया केवल स्पष्ट और मान्य रेटिनल फंडस छवियां अपलोड करें। असंबंधित चित्र गलत परिणाम देंगे।",
    btn_next: "अगला कदम",
    btn_prev: "पिछला",
    btn_capture: "फोटो लें",
    btn_switch: "कैमरा बदलें",
    btn_cancel: "रद्द करें",
    btn_upload: "फाइल चुनें",
    err_step_upload: "आगे बढ़ने से पहले आपको एक रेटिनल छवि अपलोड करनी होगी।",
    err_step_games: "रिपोर्ट तैयार करने से पहले कृपया सभी 4 विजन गेम पूरे करें।",
    toast_welcome: "रेटीनासेफ: बहुभाषी समर्थन सक्रिय।"
  },
  or: {
    s1_heading: "ରୋଗୀ ସୂଚନା",
    s1_desc: "ଡାଇଗ୍ନୋଷ୍ଟିକ୍ ଓଜନକୁ କାଲିବ୍ରେଟ୍ କରିବା ପାଇଁ ଆପଣଙ୍କର ଚିକିତ୍ସା ପୃଷ୍ଠଭୂମି ପ୍ରବେଶ କରନ୍ତୁ |",
    s2_heading: "ଫଣ୍ଡସ୍ ଚିତ୍ର ଅପଲୋଡ୍ କରନ୍ତୁ",
    s2_desc: "ଏକ ରେଟିନାଲ୍ ଫଣ୍ଡସ୍ ଆଲୋକଚିତ୍ର ଅପଲୋଡ୍ କରନ୍ତୁ | ଏହା ଏକ କ୍ୟାମେରା କିମ୍ବା ସ୍ମାର୍ଟଫୋନ୍ ମାଧ୍ୟମରେ ନିଆଯାଇପାରେ |",
    s3_heading: "ଦୃଷ୍ଟି ଆହ୍ୱାନ",
    s3_desc: "ଦୃଷ୍ଟି ପ୍ରଦର୍ଶନ ମାପିବା ପାଇଁ ସମସ୍ତ 4 ଟି ସ୍କ୍ରିନିଂ ଗେମ୍ ସମାପ୍ତ କରନ୍ତୁ |",
    s4_heading: "କ୍ଲିନିକାଲ୍ ବିଶ୍ଳେଷଣ ରିପୋର୍ଟ",
    s4_desc: "ଆପଣଙ୍କର ସ୍କ୍ରିନିଂ ଫଳାଫଳ ପ୍ରଫେସନାଲ୍ TFLite AI ମଡେଲ୍ ବ୍ୟବହାର କରି ପ୍ରସ୍ତୁତ କରାଯାଇଛି |",
    warn_title: "ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଆବଶ୍ୟକତା",
    warn_text: "ଦୟାକରି କେବଳ ସ୍ପଷ୍ଟ ଏବଂ ବୈଧ ରେଟିନାଲ୍ ଚିତ୍ର ଅପଲୋଡ୍ କରନ୍ତୁ | ଅସମ୍ବନ୍ଧିତ ଚିତ୍ରଗୁଡ଼ିକ ଭୁଲ ଫଳାଫଳ ଦେବ |",
    btn_next: "ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ",
    btn_prev: "ପୂର୍ବବର୍ତ୍ତୀ",
    btn_capture: "ଫଟୋ ଉଠାନ୍ତୁ",
    btn_switch: "କ୍ୟାମେରା ବଦଳାନ୍ତୁ",
    btn_cancel: "ବାତିଲ୍ କରନ୍ତୁ",
    btn_upload: "ଫାଇଲ୍ ବାଛନ୍ତୁ",
    err_step_upload: "ଆଗକୁ ବଢିବା ପାଇଁ ଆପଣଙ୍କୁ ଏକ ରେଟିନାଲ୍ ଚିତ୍ର ଅପଲୋଡ୍ କରିବାକୁ ପଡିବ |",
    err_step_games: "ରିପୋର୍ଟ ପ୍ରସ୍ତୁତ କରିବା ପୂର୍ବରୁ ଦୟାକରି ସମସ୍ତ 4 ଟି ଭିଜନ ଗେମ୍ ସମାପ୍ତ କରନ୍ତୁ |",
    toast_welcome: "ରେଟିନାସେଫ୍: ବହୁଭାଷୀ ସମର୍ଥନ ସକ୍ରିୟ |"
  }
};

function updateLanguage(lang) {
  state.currentLang = lang;
  const t = TRANSLATIONS[lang];
  if (!t) return;

  const map = {
    '#s1-heading': t.s1_heading, '#s1-desc': t.s1_desc,
    '#s2-heading': t.s2_heading, '#s2-desc': t.s2_desc,
    '#s3-heading': t.s3_heading, '#s3-desc': t.s3_desc,
    '#s4-heading': t.s4_heading, '#s4-desc': t.s4_desc,
    '#warn-title': t.warn_title, '#warn-text': t.warn_text,
    '#capture-image': t.btn_capture, '#switch-camera': t.btn_switch, '#close-camera': t.btn_cancel,
    '#upload-link-text': t.btn_upload
  };

  Object.entries(map).forEach(([sel, val]) => {
    const el = qs(sel);
    if (el) {
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT') el.placeholder = val;
      else el.innerHTML = val;
    }
  });

  qsa('.btn-next-step').forEach(btn => btn.textContent = t.btn_next);
  qsa('.btn-prev-step').forEach(btn => btn.textContent = t.btn_prev);

  showToast(t.toast_welcome);
}

function showToast(msg) {
  const toast = qs('#rs-toast');
  const text = qs('#rs-toast-text');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ── GAME DEFINITIONS ───────────────────────────────────────────
const GAMES = [
  {
    id: 1, game_name: 'Contrast Discrimination',
    label: 'Contrast Discrimination', detects: 'Diabetic Retinopathy',
    url: 'contrast_discrimination_challenge.html', emoji: '🌫️',
    accent: 'var(--dr-color)', specs: ['10 levels', '30+ trials', '~3 min'],
    description: 'Identify a subtly fading object against a grey background across 10 difficulty levels — testing contrast sensitivity loss caused by early diabetic retinopathy.',
  },
  {
    id: 2, game_name: 'Amsler Grid',
    label: 'Dynamic Amsler Grid', detects: 'Macular Degeneration',
    url: 'dynamic_amsler_grid.html', emoji: '⊞',
    accent: 'var(--amd-color)', specs: ['Both eyes', '4 weight zones', '~2 min'],
    description: 'Mark lines that appear wavy, bent, or missing. Tested monocularly — central foveal markings carry 4× the weight, matching AMD\'s characteristic central damage pattern.',
  },
  {
    id: 3, game_name: 'Peripheral Reaction',
    label: 'Peripheral Reaction Tester', detects: 'Glaucoma',
    url: 'peripheral_reaction_tester.html', emoji: '✦',
    accent: 'var(--glauc-color)', specs: ['8 zones', '32 flashes', '~1 min'],
    description: 'Fixate on the centre dot while flashes appear in 8 peripheral zones. Consistent misses in a zone indicate a probable scotoma — the arcuate pattern characteristic of glaucoma.',
  },
  {
    id: 4, game_name: 'Hue Sorting',
    label: 'Color Hue Sorting', detects: 'Cataract',
    url: 'color_hue_sorting.html', emoji: '🎨',
    accent: 'var(--cat-color)', specs: ['10 rounds', '30 s limit', '~30 sec'],
    description: 'Find the tile whose hue has shifted along the blue-yellow tritan axis — the colour discrimination impairment produced as the crystalline lens yellows with cataract.',
  },
];

// ── STEP NAVIGATION ────────────────────────────────────────────
function goToStep(n) {
  if (n < 1 || n > 4) return;

  const session = window.RetinaSafeSession ? RetinaSafeSession.get() : null;
  const t = TRANSLATIONS[state.currentLang];

  // STRICT VALIDATION
  if (n === 2 && !session) return;

  if (n === 3) {
    if (!session || !session.imageUploaded) {
      showToast(t?.err_step_upload || "Please upload an image first.");
      return;
    }
  }

  if (n === 4) {
    const done = Object.keys(RetinaSafeSession.getGameResults()).length;
    if (done < 4) {
      showToast(t?.err_step_games || "Please complete all 4 games first.");
      return;
    }
  }

  qsa('.screen-step').forEach(el => el.classList.remove('ps-step-active'));
  qs(`#step-${n}`)?.classList.add('ps-step-active');

  qsa('.progress-step').forEach((el, i) => {
    el.classList.remove('ps-active', 'ps-done');
    if (i + 1 === n) el.classList.add('ps-active');
    if (i + 1 < n) el.classList.add('ps-done');
  });

  qsa('.progress-connector').forEach((el, i) => el.classList.toggle('pc-done', i + 1 < n));
  qs('.progress-bar-wrapper')?.setAttribute('aria-valuenow', n);
  state.currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (n === 3) renderGamesStep();
  if (n === 4) buildReport();
}

// ── STEP 1 ─────────────────────────────────────────────────────
function initStep1() {
  qs('#step1-next')?.addEventListener('click', () => {
    const h = {
      age_group: qs('#age-group')?.value || '',
      gender: qs('#gender')?.value || '',
      last_exam: qs('#last-exam')?.value || '',
      conditions: Array.from(document.querySelectorAll('.checkbox-grid .checkbox-input:checked')).map(cb => cb.name),
      rememberMe: qs('#remember-me')?.checked || false
    };
    if (window.RetinaSafeSession) RetinaSafeSession.init(h);
    goToStep(2);
  });

  // Language Switch Listener
  qs('#lang-select')?.addEventListener('change', (e) => {
    updateLanguage(e.target.value);
  });
}

// ── STEP 2 ─────────────────────────────────────────────────────
function initStep2() {
  const uploadArea = qs('#upload-area');
  const fileInput = qs('#file-input');
  const uploadIdle = qs('#upload-idle');
  const uploadPrev = qs('#upload-preview');
  const previewImg = qs('#preview-img');
  const previewName = qs('#preview-filename');
  const previewSize = qs('#preview-size');
  const step2Next = qs('#step2-next');

  // Camera elements
  const openCamBtn = qs('#open-camera');
  const switchCamBtn = qs('#switch-camera');
  const camView = qs('#camera-view');
  const camFeed = qs('#camera-feed');
  const captureBtn = qs('#capture-image');
  const closeCamBtn = qs('#close-camera');
  const captureCanvas = qs('#capture-canvas');

  let camStream = null;

  function getStatusEl() {
    let el = qs('#upload-status');
    if (!el) {
      el = document.createElement('p');
      el.id = 'upload-status'; el.className = 'upload-status upload-status-info'; el.hidden = true;
      uploadArea?.after(el);
    }
    return el;
  }
  const showStatus = (msg, type = 'info') => { const el = getStatusEl(); el.textContent = msg; el.className = `upload-status upload-status-${type}`; el.hidden = false; };
  const hideStatus = () => { const el = qs('#upload-status'); if (el) el.hidden = true; };
  const fmtBytes = b => b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

  function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    // Preview
    const reader = new FileReader();
    reader.onload = e => {
      if (previewImg) previewImg.src = e.target.result;
      if (previewName) previewName.textContent = file.name;
      if (previewSize) previewSize.textContent = fmtBytes(file.size);
      uploadIdle?.classList.add('hidden');
      camView?.classList.add('hidden'); // Ensure camera view is hidden if shown
      uploadPrev?.classList.remove('hidden');
    };
    reader.readAsDataURL(file);

    showStatus('Analyzing image with AI... This may take a minute.', 'info');
    if (step2Next) step2Next.disabled = true;

    try {
      const session = window.RetinaSafeSession ? RetinaSafeSession.get() : RetinaSafeSession.init();
      if (!window.RetinaSafeAPI) throw new Error("API Bridge not loaded");

      const rawRes = await RetinaSafeAPI.uploadImage(file);
      const res = RetinaSafeAPI.mapBackendToPredictions(rawRes);

      if (window.RetinaSafeSession) {
        RetinaSafeSession.setImageUploaded({ filename: file.name, size: file.size, serverSessionId: session.sessionId });
        RetinaSafeSession.setModelOutput(res);
      }

      showStatus('AI analysis complete ✓', 'success');
      if (step2Next) step2Next.disabled = false;
    } catch (err) {
      console.error(err);
      showStatus(`Analysis failed: ${err.message}. Please check if Backend is running.`, 'error');
    }
  }

  const stopCamera = () => {
    if (camStream) {
      camStream.getTracks().forEach(t => t.stop());
      camStream = null;
    }
    if (camFeed) camFeed.srcObject = null;
    camView?.classList.add('hidden');
    uploadIdle?.classList.remove('hidden');
    // Also remove warning when camera is closed
    qs('#upload-warning')?.classList.remove('hidden');
  };

  const startCamera = async () => {
    try {
      if (camStream) {
        camStream.getTracks().forEach(t => t.stop());
      }
      camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (camFeed) {
        camFeed.srcObject = camStream;
        // Mirror the feed if it's the front camera
        camFeed.style.transform = state.cameraFacing === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
      }
      uploadIdle?.classList.add('hidden');
      qs('#upload-warning')?.classList.add('hidden'); // Hide warning while camera is active to save space
      camView?.classList.remove('hidden');
    } catch (err) {
      showToast("Camera access denied.");
      console.error(err);
    }
  };

  openCamBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    state.cameraFacing = 'environment'; // Default to back camera
    await startCamera();
  });

  switchCamBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    state.cameraFacing = state.cameraFacing === 'user' ? 'environment' : 'user';
    await startCamera();
  });

  captureBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!camFeed || !captureCanvas) return;
    captureCanvas.width = camFeed.videoWidth;
    captureCanvas.height = camFeed.videoHeight;
    const ctx = captureCanvas.getContext('2d');

    // If mirrored, we need to mirror the capture too
    if (state.cameraFacing === 'user') {
      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(camFeed, 0, 0);
    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.95);
    const file = dataURLtoFile(dataUrl, 'retina_capture.jpg');

    stopCamera();
    handleFile(file);
  });

  closeCamBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    stopCamera();
  });

  step2Next?.addEventListener('click', () => {
    const session = RetinaSafeSession.get();
    const t = TRANSLATIONS[state.currentLang];
    if (!session || !session.imageUploaded) {
      showToast(t?.err_step_upload || "Please upload an image first.");
      return;
    }
    goToStep(3);
  });

  uploadArea?.addEventListener('click', e => {
    if (e.target.id === 'preview-replace') return;
    // Don't trigger file input if camera is active
    if (!camView?.classList.contains('hidden')) return;
    fileInput?.click();
  });

  uploadArea?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!camView?.classList.contains('hidden')) return;
      e.preventDefault();
      fileInput?.click();
    }
  });

  fileInput?.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

  uploadArea?.addEventListener('dragover', e => {
    e.preventDefault();
    if (camView?.classList.contains('hidden')) uploadArea.classList.add('drag-over');
  });

  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));

  uploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (!camView?.classList.contains('hidden')) return;
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  qs('#preview-replace')?.addEventListener('click', e => {
    e.stopPropagation();
    uploadPrev?.classList.add('hidden');
    uploadIdle?.classList.remove('hidden');
    hideStatus();
    if (step2Next) step2Next.disabled = true;
    if (fileInput) fileInput.value = '';
  });

  step2Next?.addEventListener('click', () => goToStep(3));
}

// ── STEP 3: GAME CARD GRID ─────────────────────────────────────
function renderGamesStep() {
  const grid = qs('#game-cards-grid');
  if (!grid) return;

  grid.innerHTML = GAMES.map(g => {
    const done = window.RetinaSafeSession ? RetinaSafeSession.isGameDone(g.game_name) : false;
    const results = done && window.RetinaSafeSession ? RetinaSafeSession.getGameResults()[g.game_name] : null;
    const score = results
      ? (results.dr_contrast_score ?? results.amd_amsler_score ?? results.glaucoma_peripheral_score ?? results.cataract_hue_score ?? results.score ?? '—')
      : null;

    return `
      <div class="gc-card${done ? ' gc-done' : ''}" id="gc-${g.id}" role="listitem">
        <div class="gc-card-stripe" style="background:${g.accent}"></div>
        <div class="gc-card-body">
          <div class="gc-card-top">
            <div class="gc-card-icon-num">
              <span class="gc-num">0${g.id}</span>
              <span class="gc-emoji" aria-hidden="true">${g.emoji}</span>
            </div>
            ${done
        ? `<span class="gc-done-badge">✓ Complete</span>`
        : `<span class="gc-pending-badge">Not started</span>`}
          </div>
          <h3 class="gc-title">${g.label}</h3>
          <span class="gc-detects-tag">Detects: ${g.detects}</span>
          <p class="gc-desc">${g.description}</p>
          <div class="gc-specs">${g.specs.map(s => `<span class="gc-spec">${s}</span>`).join('')}</div>
        </div>
        <div class="gc-card-footer">
          ${done
        ? `<span class="gc-score-label">Score: <span class="gc-score-value">${score}/100</span></span>
               <button class="btn btn-outline btn-sm" data-launch="${g.id}">↺ Redo</button>`
        : `<span class="gc-score-label">Ready to begin</span>
               <button class="btn btn-primary btn-sm" data-launch="${g.id}">▶ Launch Game</button>`}
        </div>
      </div>`;
  }).join('');

  updateGamesProgress();

  grid.querySelectorAll('[data-launch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const game = GAMES.find(g => g.id === parseInt(btn.dataset.launch, 10));
      if (game) openGameModal(game);
    });
  });
}

// ── IFRAME MODAL ───────────────────────────────────────────────
function openGameModal(game) {
  const modal = qs('#game-modal');
  const iframe = qs('#game-iframe');
  if (!modal || !iframe) return;

  qs('#gm-title') && (qs('#gm-title').textContent = game.label);
  qs('#gm-tag') && (qs('#gm-tag').textContent = 'Detects: ' + game.detects);
  qs('#gm-icon') && (qs('#gm-icon').textContent = game.emoji);

  if (window.RetinaSafeSession) RetinaSafeSession.setReturnUrl('screening.html');

  iframe.src = game.url;
  modal.hidden = false;
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  qs('#game-modal-close')?.focus();
}

function closeGameModal() {
  const modal = qs('#game-modal');
  const iframe = qs('#game-iframe');
  if (!modal) return;
  if (iframe) iframe.src = 'about:blank';
  modal.hidden = true;
  document.body.style.overflow = '';
  renderGamesStep(); // refresh card states
}

// Auto-close modal when a game saves its result (storage event from iframe)
window.addEventListener('storage', e => {
  if (e.key === 'rs_session_v1' && state.currentStep === 3) {
    const modal = qs('#game-modal');
    if (modal && !modal.hidden) {
      setTimeout(closeGameModal, 1400);
    } else {
      renderGamesStep();
    }
  }
});

function updateGamesProgress() {
  const done = GAMES.filter(g => window.RetinaSafeSession && RetinaSafeSession.isGameDone(g.game_name)).length;
  const total = GAMES.length;
  const bar = qs('#gpr-bar');
  const label = qs('#gpr-label');
  const next = qs('#step3-next');
  if (bar) bar.style.width = `${(done / total) * 100}%`;
  if (label) label.textContent = `${done} of ${total} games completed`;
  if (next) next.disabled = done < total;
}

// ── STEP 4: REPORT ─────────────────────────────────────────────
async function buildReport() {
  const session = window.RetinaSafeSession ? RetinaSafeSession.get() : null;
  const loadingDiv = qs('#report-loading');
  const contentDiv = qs('#report-content');

  // Show loading state immediately
  if (loadingDiv) loadingDiv.hidden = false;
  if (contentDiv) contentDiv.hidden = true;

  try {
    if (!window.RetinaSafeAPI) throw new Error("Connection Bridge (API) is missing. Please refresh.");

    // Validate we have AI results
    if (!session || !session.modelOutput) {
      console.warn("No AI results found. Using baseline vision data.");
    }

    // Compute result (fusing game results and AI output)
    const r = await RetinaSafeAPI.computeReport(
      session?.sessionId || 'new-session',
      RetinaSafeSession.getGameResults(),
      session?.modelOutput,
      session?.medicalHistory
    );

    state.reportData = r;
    if (window.RetinaSafeSession) RetinaSafeSession.setReportReady(true);

    // Transition UI
    if (loadingDiv) loadingDiv.hidden = true;
    if (contentDiv) {
      contentDiv.hidden = false;
      renderReport(r);
      console.info("[RetinaSafe] Report generated successfully.");
    }
  } catch (err) {
    console.error('[RetinaSafe] Report failed:', err);
    if (loadingDiv) loadingDiv.hidden = true;
    if (contentDiv) {
      contentDiv.hidden = false;
      contentDiv.innerHTML = `
        <div class="report-disclaimer" style="border-left: 4px solid #ef4444;">
          <p><strong>⚠ Report Generation Error:</strong> ${err.message}</p>
          <button class="btn btn-outline btn-sm" onclick="window.location.reload()">Refresh Page</button>
        </div>
      `;
    }
  }
}

function getRiskInfo(s) {
  if (s < 35) return { label: 'Low Risk', cls: 'badge-low', action: 'No immediate action required. Continue annual eye health screening.', urgency: 'ROUTINE' };
  if (s < 60) return { label: 'Borderline', cls: 'badge-borderline', action: 'Monitor symptoms and rescreen with RetinaSafe in 6 months.', urgency: 'MONITOR' };
  if (s < 75) return { label: 'Moderate Risk', cls: 'badge-moderate', action: 'Schedule an ophthalmology consultation within 4–6 weeks.', urgency: 'RECOMMENDED' };
  if (s < 90) return { label: 'High Risk', cls: 'badge-high', action: 'Book an urgent ophthalmology appointment within 1–2 weeks.', urgency: 'URGENT' };
  return { label: 'Critical', cls: 'badge-critical', action: 'Attend emergency ophthalmology or A&E eye department immediately.', urgency: 'CRITICAL' };
}

function renderReport(r) {
  const { label, cls, action, urgency } = getRiskInfo(r.overall_risk_score);
  const se = qs('#rsc-score'), be = qs('#rsc-badge'), ae = qs('#rsc-action'), ue = qs('#rsc-urgency');
  if (se) se.textContent = r.overall_risk_score;
  if (be) { be.textContent = label; be.className = `rsc-badge ${cls}`; }
  if (ae) ae.textContent = action;
  if (ue) { ue.textContent = urgency; ue.className = `rsc-urgency ${cls}`; }

  const cmap = { dr: r.conditions?.diabetic_retinopathy, amd: r.conditions?.macular_degeneration, glauc: r.conditions?.glaucoma, cat: r.conditions?.cataract };
  const glbls = { dr: 'Contrast score', amd: 'Amsler score', glauc: 'Peripheral score', cat: 'Hue score' };

  Object.entries(cmap).forEach(([k, d]) => {
    if (!d) return;
    const pct = Math.round(d.final_probability * 100);
    const lvl = d.risk_level;
    const col = pct < 35 ? 'var(--glauc-color)' : pct < 65 ? 'var(--cat-color)' : 'var(--risk-high)';
    const pe = qs(`#dc-${k}-prob`), be = qs(`#dc-${k}-bar`), ge = qs(`#dc-${k}-game`), le = qs(`#dc-${k}-level`);
    if (pe) pe.textContent = `${pct}%`;
    if (ge) ge.textContent = `${glbls[k]}: ${d.game_score ?? '—'}/100`;
    if (le) { le.textContent = lvl; le.style.color = col; }
    requestAnimationFrame(() => { if (be) be.style.width = `${pct}%`; });
  });

  const fc = qs('#report-game-flags');
  if (fc) {
    const flags = Object.values(r.conditions || {}).filter(c => c?.game_flag).map(c => c.game_flag);
    if (flags.length) { fc.innerHTML = flags.map(f => `<p class="report-flag-item">⚠ ${f}</p>`).join(''); fc.hidden = false; }
  }
}

// ── PDF GENERATION ─────────────────────────────────────────────
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const r = state.reportData;
  if (!r) return;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("RetinaSafe Screening Report", 20, 30);

  doc.setFontSize(12);
  doc.setFont("Helvetica", "normal");
  doc.text(`Generated: ${new Date(r.generated_at).toLocaleString()}`, 20, 40);
  doc.text(`Report ID: ${r.report_id}`, 20, 47);

  doc.setLineWidth(0.5);
  doc.line(20, 52, 190, 52);

  doc.setFontSize(16);
  doc.text("Overall Risk Assessment", 20, 65);
  doc.setFontSize(14);
  doc.text(`Risk Score: ${r.overall_risk_score}/100`, 20, 75);
  doc.text(`Classification: ${r.risk_label}`, 20, 83);

  doc.setFontSize(12);
  doc.setFont("Helvetica", "italic");
  doc.text("Recommended Action:", 20, 95);
  doc.setFont("Helvetica", "normal");
  doc.text(doc.splitTextToSize(r.recommended_action, 160), 20, 102);

  doc.setFontSize(16);
  doc.text("Breakdown per Condition", 20, 125);

  let y = 135;
  Object.entries(r.conditions).forEach(([key, data]) => {
    const name = key.replace(/_/g, ' ').toUpperCase();
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text(name, 25, y);
    doc.setFont("Helvetica", "normal");
    doc.text(`Probability: ${Math.round(data.final_probability * 100)}%`, 100, y);
    doc.text(`Level: ${data.risk_level}`, 150, y);
    y += 10;
  });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 260, 190, 260);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Disclaimer: RetinaSafe is an AI-assisted screening tool, not a medical device.", 20, 270);
  doc.text("Please consult a qualified ophthalmologist for a clinical diagnosis.", 20, 275);

  doc.save(`RetinaSafe_Report_${r.report_id}.pdf`);
}

// ── DOM READY ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initStep1();
  initStep2();

  qs('#game-modal-close')?.addEventListener('click', closeGameModal);
  qs('#game-modal')?.addEventListener('click', e => { if (e.target === qs('#game-modal')) closeGameModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && qs('#game-modal') && !qs('#game-modal').hidden) closeGameModal(); });

  const step3Next = qs('#step3-next');
  step3Next?.addEventListener('click', () => {
    const done = GAMES.filter(g => window.RetinaSafeSession && RetinaSafeSession.isGameDone(g.game_name)).length;
    const t = TRANSLATIONS[state.currentLang];
    if (done < 4) {
      showToast(t?.err_step_games || "Please complete all 4 vision games first.");
      return;
    }
    goToStep(4);
  });
  qs('#download-report')?.addEventListener('click', generatePDF);

  qs('#restart-screening')?.addEventListener('click', () => {
    if (window.RetinaSafeSession) RetinaSafeSession.clear();
    // Use a clean reload to ensure all UI states and memory are reset
    window.location.reload();
  });

  const session = window.RetinaSafeSession ? RetinaSafeSession.get() : null;
  // If there's an existing session, ask to continue or refresh
  if (session && !session.reportReady) {
    if (confirm("We found a previous screening in progress. Would you like to continue? \n\nClick 'OK' to continue, or 'Cancel' to start fresh.")) {
      if (session.modelOutput && session.imageUploaded) {
        goToStep(3);
      } else if (session.imageUploaded) {
        goToStep(3); // or 2 if you prefer
      } else {
        goToStep(2);
      }
    } else {
      RetinaSafeSession.clear();
      goToStep(1);
    }
  } else {
    // Set default language
    updateLanguage('en');

    goToStep(1);
  }
});
// ── SESSION PERSISTENCE ───────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (!window.RetinaSafeSession) return;
  const session = RetinaSafeSession.get();
  // If user unclicked "Remember Me", clear session on exit/refresh
  if (session && session.medicalHistory && session.medicalHistory.rememberMe === false) {
    RetinaSafeSession.clear();
  }
});
