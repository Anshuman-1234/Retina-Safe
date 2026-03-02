
const DISEASES = [
    { id: 'amd', name: 'Age-Related Macular Degeneration (AMD)', icon: '🔴', color: '#ff6b6b', colorLight: 'rgba(255,107,107,0.15)' },
    { id: 'cataract', name: 'Cataract', icon: '🔵', color: '#54a0ff', colorLight: 'rgba(84,160,255,0.15)' },
    { id: 'diabetes', name: 'Diabetic Retinopathy', icon: '🟣', color: '#6c63ff', colorLight: 'rgba(108,99,255,0.15)' },
    { id: 'glaucoma', name: 'Glaucoma', icon: '🔴', color: '#ff4757', colorLight: 'rgba(255,71,87,0.15)' },
    { id: 'hypertensive', name: 'Hypertensive Retinopathy', icon: '🟡', color: '#ffa502', colorLight: 'rgba(255,165,2,0.15)' },
    { id: 'normal', name: 'Normal (Healthy)', icon: '🟢', color: '#2ed573', colorLight: 'rgba(46,213,115,0.15)' },
];


let currentFile = null;
let currentImageData = null;
let analysisResults = null;
let cameraStream = null;


const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Nav
const navbar = $('#navbar');
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');

// Upload
const dropZone = $('#dropZone');
const fileInput = $('#fileInput');
const previewImage = $('#previewImage');
const removeImageBtn = $('#removeImageBtn');
const analyzeBtn = $('#analyzeBtn');
const openCameraBtn = $('#openCameraBtn');

// Camera
const cameraSection = $('#cameraSection');
const cameraFeed = $('#cameraFeed');
const captureBtn = $('#captureBtn');
const stopCameraBtn = $('#stopCameraBtn');
const captureCanvas = $('#captureCanvas');

// Results
const resultsEmpty = $('#resultsEmpty');
const resultsLoading = $('#resultsLoading');
const resultsPanel = $('#resultsPanel');
const resultSummary = $('#resultSummary');
const diseaseCards = $('#diseaseCards');
const progressBar = $('#progressBar');
const analyzingText = $('#analyzingText');
const analyzingSub = $('#analyzingSub');

// Actions
const downloadPdfBtn = $('#downloadPdfBtn');
const newScanBtn = $('#newScanBtn');

// Modal
const reportModal = $('#reportModal');
const modalClose = $('#modalClose');
const modalCancelBtn = $('#modalCancelBtn');
const generatePdfBtn = $('#generatePdfBtn');

// Toast
const toastContainer = $('#toastContainer');



// Scroll effect
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// Mobile toggle
navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

// Active link tracking
const navAnchors = $$('.nav-links a:not(.nav-cta)');
const sections = ['home', 'how-it-works', 'scan', 'diseases'].map(id => document.getElementById(id));

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
        if (sec && sec.offsetTop - 200 <= window.scrollY) {
            current = sec.id;
        }
    });
    navAnchors.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
});

// Close mobile nav on link click
navAnchors.forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));



const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

$$('.fade-up').forEach(el => observer.observe(el));



// Click to browse
dropZone.addEventListener('click', (e) => {
    if (e.target.closest('#removeImageBtn')) return;
    if (cameraSection.style.display === 'flex') return;
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

// Drag events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
    const valid = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!valid.includes(file.type)) {
        showToast('Please upload a JPG or PNG image', 'error');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be under 10MB', 'error');
        return;
    }
    currentFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
        currentImageData = ev.target.result;
        previewImage.src = currentImageData;
        dropZone.classList.add('has-image');
        analyzeBtn.disabled = false;

        showState('empty');
    };
    reader.readAsDataURL(file);
}

// Remove image
removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearImage();
});

function clearImage() {
    currentFile = null;
    currentImageData = null;
    previewImage.src = '';
    dropZone.classList.remove('has-image');
    analyzeBtn.disabled = true;
    fileInput.value = '';
    showState('empty');
}




openCameraBtn.addEventListener('click', async () => {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        cameraFeed.srcObject = cameraStream;
        cameraSection.style.display = 'flex';
        dropZone.classList.add('has-image'); // hide drop text
        dropZone.querySelector('.drop-icon').style.display = 'none';
        dropZone.querySelector('.drop-text').style.display = 'none';
    } catch (err) {
        showToast('Camera access denied or not available', 'error');
        console.error(err);
    }
});

captureBtn.addEventListener('click', () => {
    const video = cameraFeed;
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    captureCanvas.getContext('2d').drawImage(video, 0, 0);
    currentImageData = captureCanvas.toDataURL('image/jpeg', 0.9);
    previewImage.src = currentImageData;
    stopCamera();
    dropZone.classList.add('has-image');
    analyzeBtn.disabled = false;
    currentFile = dataURLtoFile(currentImageData, 'retina_capture.jpg');
    showToast('Image captured successfully!', 'success');
});

stopCameraBtn.addEventListener('click', () => {
    stopCamera();
    if (!currentImageData) {
        dropZone.classList.remove('has-image');
        dropZone.querySelector('.drop-icon').style.display = '';
        dropZone.querySelector('.drop-text').style.display = '';
    }
});

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    cameraSection.style.display = 'none';
    cameraFeed.srcObject = null;
}

function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
}




analyzeBtn.addEventListener('click', startAnalysis);

async function startAnalysis() {
    if (!currentImageData) {
        showToast('Please upload an image first', 'error');
        return;
    }

    showState('loading');
    analyzeBtn.disabled = true;

    try {
        // Prepare image data for upload
        let fileToUpload = currentFile;
        if (!fileToUpload && currentImageData) {
            fileToUpload = dataURLtoFile(currentImageData, 'retina_scan.jpg');
        }

        const formData = new FormData();
        formData.append('image', fileToUpload);

        analyzingSub.textContent = 'Uploading image to AI server...';
        progressBar.style.width = '20%';
        await sleep(500);

        // Call the real Backend API
        const response = await fetch('/api/predict', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        const apiResults = data.results;

        const results = apiResults.map(res => {
            const disease = DISEASES.find(d => d.id === res.id);
            return {
                disease: disease,
                score: res.score
            };
        });

        analyzingText.textContent = 'Processing results...';
        analyzingSub.textContent = 'Finalizing report...';
        progressBar.style.width = '100%';
        await sleep(500);

        results.sort((a, b) => b.score - a.score);
        analysisResults = results;

        showResults(results);
        showState('results');
        analyzeBtn.disabled = false;
        showToast('Analysis complete!', 'success');

    } catch (err) {
        console.error('Analysis failed:', err);
        showState('empty');
        showToast(`Analysis failed: ${err.message}. Make sure Backend is running!`, 'error');
        analyzeBtn.disabled = false;
    }
}


function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function pseudoRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }




function showResults(results) {
    const top = results[0];
    const isHealthy = top.disease.id === 'normal';

    // Summary
    resultSummary.innerHTML = `
    <div class="result-status ${isHealthy ? 'healthy' : 'detected'}">
      ${isHealthy ? '✅' : '⚠️'} ${isHealthy ? 'Healthy Retina Detected' : 'Condition Detected'}
    </div>
    <div class="result-condition">${top.disease.name}</div>
    <div class="result-confidence">
      Confidence: <strong>${(top.score * 100).toFixed(1)}%</strong>
    </div>
  `;

    // Disease cards
    diseaseCards.innerHTML = '';
    results.forEach((r, idx) => {
        const pct = (r.score * 100).toFixed(1);
        const barColor = r.disease.color;
        const isTop = idx === 0;

        const card = document.createElement('div');
        card.className = `disease-card${isTop ? ' top-match' : ''}`;
        card.innerHTML = `
      <div class="disease-icon" style="background:${r.disease.colorLight}">${r.disease.icon}</div>
      <div class="disease-info">
        <div class="disease-name">${r.disease.name}</div>
        <div class="disease-bar-track">
          <div class="disease-bar-fill" style="background:${barColor}" data-width="${pct}%"></div>
        </div>
      </div>
      <div class="disease-score" style="color:${barColor}">${pct}%</div>
    `;
        diseaseCards.appendChild(card);
    });


    requestAnimationFrame(() => {
        setTimeout(() => {
            $$('.disease-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        }, 50);
    });
}



function showState(state) {
    resultsEmpty.style.display = state === 'empty' ? 'flex' : 'none';
    resultsLoading.classList.toggle('active', state === 'loading');
    resultsPanel.classList.toggle('active', state === 'results');

    if (state === 'loading') {
        progressBar.style.width = '0%';
        analyzingText.textContent = 'Analyzing Retina...';
        analyzingSub.textContent = 'Initializing models...';
    }
}



newScanBtn.addEventListener('click', () => {
    clearImage();
    analysisResults = null;
    showState('empty');
    // Scroll to scan section
    document.getElementById('scan').scrollIntoView({ behavior: 'smooth' });
});


// ============================================
//  PDF REPORT GENERATION
// ============================================

downloadPdfBtn.addEventListener('click', () => {
    if (!analysisResults) return;
    reportModal.classList.add('active');
});

modalClose.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', closeModal);
reportModal.addEventListener('click', (e) => {
    if (e.target === reportModal) closeModal();
});

function closeModal() {
    reportModal.classList.remove('active');
}

generatePdfBtn.addEventListener('click', () => {
    generatePDF();
    closeModal();
});

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const patientName = $('#patientName').value || 'Not provided';
    const patientAge = $('#patientAge').value || 'Not provided';
    const patientGender = $('#patientGender').value || 'Not provided';
    const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // ---- Header ----
    doc.setFillColor(10, 14, 23);
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setTextColor(0, 212, 170);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RETINA SAFE', margin, y + 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(136, 146, 166);
    doc.text('AI-Powered Retinal Disease Detection Report', margin, y + 23);

    doc.setTextColor(136, 146, 166);
    doc.text(`Generated: ${dateStr}`, pageWidth - margin, y + 15, { align: 'right' });
    doc.text('Report ID: ' + generateReportId(), pageWidth - margin, y + 23, { align: 'right' });

    y = 60;

    // ---- Patient Info ----
    doc.setDrawColor(0, 212, 170);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Name: ${patientName}`, margin, y);
    doc.text(`Age: ${patientAge}`, margin + 70, y);
    doc.text(`Gender: ${patientGender}`, margin + 110, y);
    y += 12;

    // ---- Retina Image ----
    doc.setDrawColor(0, 212, 170);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Retinal Image', margin, y);
    y += 6;

    if (currentImageData) {
        try {
            const imgWidth = 60;
            const imgHeight = 60;
            doc.addImage(currentImageData, 'JPEG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 8;
        } catch (e) {
            y += 4;
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text('[Image could not be embedded]', margin, y);
            y += 8;
        }
    }

    // ---- Analysis Results ----
    doc.setDrawColor(0, 212, 170);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Results', margin, y);
    y += 10;

    // Top result
    const topResult = analysisResults[0];
    const isHealthy = topResult.disease.id === 'normal';

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (isHealthy) {
        doc.setTextColor(46, 213, 115);
        doc.text('✓ Healthy Retina Detected', margin, y);
    } else {
        doc.setTextColor(255, 71, 87);
        doc.text('⚠ Condition Detected: ' + topResult.disease.name, margin, y);
    }
    y += 6;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Highest Confidence: ${(topResult.score * 100).toFixed(1)}%`, margin, y);
    y += 12;

    // Results table
    // Header
    doc.setFillColor(240, 242, 245);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Rank', margin + 3, y + 5.5);
    doc.text('Condition', margin + 18, y + 5.5);
    doc.text('Confidence', pageWidth - margin - 5, y + 5.5, { align: 'right' });
    y += 10;

    analysisResults.forEach((r, i) => {
        const pct = (r.score * 100).toFixed(1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);

        if (i === 0) {
            doc.setFillColor(230, 255, 245);
            doc.rect(margin, y - 4, contentWidth, 8, 'F');
            doc.setFont('helvetica', 'bold');
        }

        doc.text(`#${i + 1}`, margin + 3, y + 1);
        doc.text(r.disease.name, margin + 18, y + 1);
        doc.text(`${pct}%`, pageWidth - margin - 5, y + 1, { align: 'right' });

        // Bar
        const barX = margin + 105;
        const barW = 40;
        const barH = 3;
        doc.setFillColor(230, 230, 230);
        doc.rect(barX, y - 2, barW, barH, 'F');
        const hex = r.disease.color;
        const rgb = hexToRgb(hex);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.rect(barX, y - 2, barW * r.score, barH, 'F');

        y += 9;
    });

    y += 6;

    // ---- Disclaimer ----
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(140, 140, 140);
    const disclaimer = 'DISCLAIMER: This report is generated by an AI-powered screening tool and is intended for informational purposes only. It does NOT constitute a medical diagnosis. Please consult a qualified ophthalmologist for professional evaluation and treatment. The accuracy of predictions depends on image quality and model training data.';
    const lines = doc.splitTextToSize(disclaimer, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 6;

    // ---- Footer ----
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text('Retina Safe — AI-Powered Retinal Disease Detection', pageWidth / 2, 285, { align: 'center' });
    doc.text('www.retinasafe.ai', pageWidth / 2, 290, { align: 'center' });

    // Save
    const fileName = `RetinaSafe_Report_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    showToast('PDF report downloaded successfully!', 'success');
}

function generateReportId() {
    return 'RS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}


// ============================================
//  TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    ${type === 'success' ? '✅' : '❌'} 
    <span>${message}</span>
  `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = '0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}


showState('empty');
