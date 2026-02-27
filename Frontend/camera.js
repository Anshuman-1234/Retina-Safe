/**
 * RetinaSafe — Camera & Upload Controller
 * ========================================
 * Handles:
 *   - Drag-and-drop file upload
 *   - File browser selection
 *   - Live camera capture (getUserMedia)
 *   - Basic client-side image quality check
 *   - Simulated analysis pipeline (mocked CNN + real scoring)
 *
 * Privacy guarantee: no image data is ever sent to a server.
 * All processing is performed entirely in the browser session.
 */

const ScanController = (() => {

  let uploadedFile    = null;    // File object from upload
  let capturedDataUrl = null;    // base64 data URL from camera
  let cameraStream    = null;    // MediaStream from getUserMedia
  let currentMethod   = 'upload';

  // ── Initialise on DOM ready ──────────────────────────────────────────
  function init() {
    setupDropzone();
    setupFileInput();
  }

  // ─────────────────────────────────────────────────────────────────────
  // METHOD TOGGLE
  // ─────────────────────────────────────────────────────────────────────
  function switchMethod(method) {
    currentMethod = method;

    // Toggle nav buttons
    document.getElementById('btn-upload').classList.toggle('active', method === 'upload');
    document.getElementById('btn-camera').classList.toggle('active', method === 'camera');

    // Toggle panels
    const uploadPanel  = document.getElementById('panel-upload');
    const cameraPanel  = document.getElementById('panel-camera');
    uploadPanel.style.display = method === 'upload' ? 'block' : 'none';
    cameraPanel.style.display = method === 'camera' ? 'block' : 'none';

    // If switching away from camera, stop stream
    if (method !== 'camera') stopCamera();
  }

  // ─────────────────────────────────────────────────────────────────────
  // DRAG & DROP UPLOAD
  // ─────────────────────────────────────────────────────────────────────
  function setupDropzone() {
    const dz = document.getElementById('dropzone');
    if (!dz) return;

    // Drag events
    dz.addEventListener('dragover',  (e) => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', ()  => { dz.classList.remove('dragover'); });
    dz.addEventListener('drop',      (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    });

    // Keyboard accessibility
    dz.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.getElementById('file-input').click();
      }
    });
  }

  function setupFileInput() {
    const input = document.getElementById('file-input');
    if (!input) return;
    input.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    });
  }

  function processFile(file) {
    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, WEBP, or BMP image.');
      return;
    }
    // Validate size (20 MB max)
    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be under 20 MB.');
      return;
    }

    uploadedFile    = file;
    capturedDataUrl = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      showPreview(e.target.result, file.name, file.size);
    };
    reader.readAsDataURL(file);
  }

  function showPreview(dataUrl, filename, size) {
    document.getElementById('dz-idle').style.display    = 'none';
    document.getElementById('dz-preview').style.display = 'block';
    document.getElementById('preview-img').src          = dataUrl;
    document.getElementById('preview-filename').textContent = filename || 'image';
    document.getElementById('preview-size').textContent =
      size ? `${(size / 1024).toFixed(1)} KB` : '';

    showAnalyseButton();
  }

  function clearImage() {
    uploadedFile    = null;
    capturedDataUrl = null;
    document.getElementById('dz-idle').style.display    = 'block';
    document.getElementById('dz-preview').style.display = 'none';
    document.getElementById('file-input').value         = '';
    document.getElementById('scan-action').style.display = 'none';
  }

  // ─────────────────────────────────────────────────────────────────────
  // CAMERA CAPTURE
  // ─────────────────────────────────────────────────────────────────────
  function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera access is not supported by this browser. Please use the upload option instead.');
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',  // Rear camera on mobile
        width:  { ideal: 1280 },
        height: { ideal: 960 }
      }
    })
    .then((stream) => {
      cameraStream = stream;
      const video  = document.getElementById('cam-video');
      video.srcObject = stream;

      document.getElementById('cam-idle').style.display     = 'none';
      document.getElementById('cam-live').style.display     = 'block';
      document.getElementById('cam-captured').style.display = 'none';
    })
    .catch((err) => {
      console.error('Camera error:', err);
      alert('Could not access camera. Please check permissions or use the upload option.');
    });
  }

  function capturePhoto() {
    const video  = document.getElementById('cam-video');
    const canvas = document.getElementById('cam-canvas');

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 960;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl       = canvas.toDataURL('image/jpeg', 0.92);
    capturedDataUrl     = dataUrl;
    uploadedFile        = null;

    // Stop live feed
    stopCameraStream();

    // Show captured preview
    document.getElementById('cam-live').style.display     = 'none';
    document.getElementById('cam-captured').style.display = 'block';
    document.getElementById('cam-preview').src            = dataUrl;

    // Basic quality note
    const qualityNote = document.getElementById('cam-quality-note');
    qualityNote.textContent = canvas.width >= 640
      ? '✓ Image captured. Check it looks clear before proceeding.'
      : '⚠ Low resolution — consider uploading a photo instead for best results.';
  }

  function acceptCapture() {
    showAnalyseButton();
    // Update the upload panel's preview to show we have an image
  }

  function retakePhoto() {
    capturedDataUrl = null;
    document.getElementById('cam-captured').style.display = 'none';
    document.getElementById('cam-idle').style.display     = 'block';
    document.getElementById('scan-action').style.display  = 'none';
  }

  function stopCamera() {
    stopCameraStream();
    if (document.getElementById('cam-live')) {
      document.getElementById('cam-live').style.display     = 'none';
      document.getElementById('cam-captured').style.display = 'none';
      document.getElementById('cam-idle').style.display     = 'block';
    }
  }

  function stopCameraStream() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
      const video = document.getElementById('cam-video');
      if (video) video.srcObject = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // ANALYSE BUTTON
  // ─────────────────────────────────────────────────────────────────────
  function showAnalyseButton() {
    document.getElementById('scan-action').style.display = 'block';
  }

  // ─────────────────────────────────────────────────────────────────────
  // IMAGE ANALYSIS PIPELINE
  // ─────────────────────────────────────────────────────────────────────
  /**
   * In production this would:
   *   1. Send the image to the Python/TensorFlow backend API
   *   2. Receive CNN probability scores per class
   *   3. Combine with game scores from sessionStorage
   *   4. Redirect to report.html
   *
   * In this frontend demo, we simulate the CNN output with plausible
   * random values that are influenced by the game scores already computed,
   * so the report logic is fully exercised.
   */
  function analyseImage() {
    const hasImage = uploadedFile || capturedDataUrl;
    if (!hasImage) {
      alert('Please upload or capture a retinal image first.');
      return;
    }

    // Hide action button, show progress
    document.getElementById('scan-action').style.display       = 'none';
    document.getElementById('analysis-progress').style.display = 'block';

    runAnalysisPipeline();
  }

  function runAnalysisPipeline() {
    const steps = [
      { id: 'ap1', label: 'Preprocessing image…',     delay: 800  },
      { id: 'ap2', label: 'Running CNN model…',        delay: 1800 },
      { id: 'ap3', label: 'Combining game scores…',    delay: 900  },
      { id: 'ap4', label: 'Generating report…',        delay: 600  }
    ];

    let elapsed = 0;
    steps.forEach((step, i) => {
      setTimeout(() => {
        // Mark previous steps done
        if (i > 0) {
          const prev = document.getElementById(steps[i-1].id);
          if (prev) prev.className = 'ap-step done';
        }
        const current = document.getElementById(step.id);
        if (current) current.className = 'ap-step active';
      }, elapsed);
      elapsed += step.delay;
    });

    // After all steps
    setTimeout(() => {
      const lastStep = document.getElementById(steps[steps.length - 1].id);
      if (lastStep) lastStep.className = 'ap-step done';

      const cnnProbs = simulateCNNOutput();
      Scoring.saveCNNResult(cnnProbs);

      // Short pause then redirect
      setTimeout(() => {
        window.location.href = 'report.html';
      }, 400);
    }, elapsed + 200);
  }

  /**
   * Simulates CNN model output probabilities.
   * In production: replaced by actual API response.
   *
   * The simulation is informed by game scores so the report is coherent:
   * low game scores correlate with slightly elevated CNN probabilities
   * for the relevant disease class.
   */
  function simulateCNNOutput() {
    const payload = Scoring.load();
    const games   = payload.games;

    function jitter(base, range) {
      return Math.min(Math.max(base + (Math.random() - 0.5) * range, 0.01), 0.95);
    }

    // Base probabilities (realistic low-risk baseline for a healthy fundus)
    let diabBase    = 0.12;
    let amdBase     = 0.10;
    let glaucBase   = 0.09;
    let catBase     = 0.11;
    let normBase    = 0.58;

    // Adjust based on game scores (correlated but independent signals)
    if (games.contrast   && games.contrast.score < 50)   diabBase  += 0.15;
    if (games.amsler     && games.amsler.score < 50)      amdBase   += 0.18;
    if (games.peripheral && games.peripheral.score < 50)  glaucBase += 0.16;
    if (games.hue        && games.hue.score < 50)         catBase   += 0.14;

    return {
      diabetes: jitter(diabBase,  0.08),
      amd:      jitter(amdBase,   0.08),
      glaucoma: jitter(glaucBase, 0.08),
      cataract: jitter(catBase,   0.08),
      normal:   jitter(normBase,  0.10)
    };
  }

  // Expose on global ScanController
  return {
    switchMethod,
    startCamera,
    capturePhoto,
    acceptCapture,
    retakePhoto,
    stopCamera,
    clearImage,
    analyseImage
  };

})();

// Initialise when DOM is ready
window.addEventListener('DOMContentLoaded', ScanController.init || (() => {}));