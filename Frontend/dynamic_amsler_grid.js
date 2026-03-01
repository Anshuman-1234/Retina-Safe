document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('amslerCanvas');
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clearBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsDiv = document.getElementById('results');
    const jsonOutput = document.getElementById('jsonOutput');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const canvasWrapper = document.getElementById('canvasWrapper');
    const lightLabel = document.getElementById('lightLabel');
    const darkLabel = document.getElementById('darkLabel');
    const timedModeToggle = document.getElementById('timedModeToggle');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerStartBtn = document.getElementById('timerStartBtn');
    const timerValue = document.getElementById('timerValue');
    const timerProgress = document.getElementById('timerProgress');

    // Score UI Elements
    const distAreaEl = document.getElementById('distAreaVal');
    const proxScoreEl = document.getElementById('proxScoreVal');
    const compositeEl = document.getElementById('compositeVal');
    const timeValEl = document.getElementById('timeVal');
    const timeCard = document.getElementById('timeCard');
    const riskBadge = document.getElementById('riskBadge');
    const riskTier = document.getElementById('riskTier');
    const riskIcon = document.getElementById('riskIcon');
    const riskDescription = document.getElementById('riskDescription');
    const gaugeFill = document.getElementById('gaugeFill');
    const gaugeMarker = document.getElementById('gaugeMarker');

    // Density buttons
    const densityBtns = document.querySelectorAll('.density-btn');

    // ── State ──
    let gridSize = 20;
    let width, height, cellW, cellH, dpr;
    const PADDING = 12;
    let isDrawing = false;
    let paintedGrid = initGrid(gridSize);
    let isDarkGrid = false;
    let needsRedraw = true;

    // Timer state
    const TIMER_DURATION = 30;
    const CIRCUMFERENCE = 2 * Math.PI * 44; // r=44 from SVG
    let timerEnabled = false;
    let timerRunning = false;
    let timerSeconds = TIMER_DURATION;
    let timerInterval = null;
    let testStartTime = null;

    // ── Initialization ──
    lightLabel.classList.add('active');
    timerProgress.style.strokeDasharray = CIRCUMFERENCE;
    timerProgress.style.strokeDashoffset = 0;

    function initGrid(size) {
        return Array.from({ length: size }, () => new Array(size).fill(false));
    }

    // ── Grid Density ──
    densityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newSize = parseInt(btn.dataset.size);
            if (newSize === gridSize) return;

            densityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            gridSize = newSize;
            paintedGrid = initGrid(gridSize);
            resizeManager();
            needsRedraw = true;

            // Hide results when switching
            resultsDiv.style.display = 'none';
        });
    });

    // ── Dark Mode ──
    darkModeToggle.addEventListener('change', () => {
        isDarkGrid = darkModeToggle.checked;
        canvasWrapper.classList.toggle('dark-grid', isDarkGrid);
        lightLabel.classList.toggle('active', !isDarkGrid);
        darkLabel.classList.toggle('active', isDarkGrid);
        needsRedraw = true;
    });

    // ── Timer Mode ──
    timedModeToggle.addEventListener('change', () => {
        timerEnabled = timedModeToggle.checked;
        timerDisplay.classList.toggle('visible', timerEnabled);
        if (!timerEnabled) {
            stopTimer();
            resetTimer();
        }
    });

    timerStartBtn.addEventListener('click', () => {
        if (timerRunning) {
            stopTimer();
            // Auto-submit when stopped manually
            analyzeBtn.click();
        } else {
            startTimer();
        }
    });

    function startTimer() {
        // Clear canvas for fresh test
        paintedGrid = initGrid(gridSize);
        needsRedraw = true;
        resultsDiv.style.display = 'none';

        timerRunning = true;
        timerSeconds = TIMER_DURATION;
        testStartTime = performance.now();

        timerStartBtn.innerHTML = `
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            Stop`;
        timerStartBtn.classList.add('running');

        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();

            if (timerSeconds <= 0) {
                stopTimer();
                analyzeBtn.click(); // Auto-submit
            }
        }, 1000);
    }

    function stopTimer() {
        timerRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;

        timerStartBtn.innerHTML = `
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Start`;
        timerStartBtn.classList.remove('running');
    }

    function resetTimer() {
        timerSeconds = TIMER_DURATION;
        testStartTime = null;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        timerValue.textContent = timerSeconds;

        const progress = (TIMER_DURATION - timerSeconds) / TIMER_DURATION;
        timerProgress.style.strokeDashoffset = CIRCUMFERENCE * progress;

        // Color transitions
        timerProgress.classList.remove('warning', 'critical');
        if (timerSeconds <= 5) {
            timerProgress.classList.add('critical');
        } else if (timerSeconds <= 10) {
            timerProgress.classList.add('warning');
        }
    }

    // ── Canvas Resize ──
    function resizeManager() {
        const rect = canvas.getBoundingClientRect();
        dpr = window.devicePixelRatio || 1;

        width = (rect.width - PADDING * 2) * dpr;
        height = (rect.height - PADDING * 2) * dpr;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        cellW = width / gridSize;
        cellH = height / gridSize;

        needsRedraw = true;
    }

    window.addEventListener('resize', resizeManager);
    resizeManager();

    // ── Coordinate Mapping ──
    function getGridCoordinates(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX - (PADDING * dpr);
        const y = (clientY - rect.top) * scaleY - (PADDING * dpr);

        const col = Math.floor(x / cellW);
        const row = Math.floor(y / cellH);

        return { row, col };
    }

    function paintArea(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const { row, col } = getGridCoordinates(clientX, clientY);

        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
            if (!paintedGrid[row][col]) {
                paintedGrid[row][col] = true;
                needsRedraw = true;
            }
        }
    }

    // ── Input Handlers ──
    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDrawing = true;
        paintArea(e);
        canvasWrapper.style.transform = '';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        if (e.target === canvas) paintArea(e);
    });

    window.addEventListener('mouseup', () => {
        isDrawing = false;
        canvasWrapper.style.transform = '';
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        paintArea(e);
        canvasWrapper.style.transform = '';
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        paintArea(e);
    }, { passive: false });

    window.addEventListener('touchend', () => {
        isDrawing = false;
        canvasWrapper.style.transform = '';
    });

    window.addEventListener('touchcancel', () => {
        isDrawing = false;
        canvasWrapper.style.transform = '';
    });

    // ── Render Loop ──
    function renderLoop() {
        if (needsRedraw) {
            drawAmslerGrid();
            needsRedraw = false;
        }
        requestAnimationFrame(renderLoop);
    }

    function drawAmslerGrid() {
        const colors = isDarkGrid
            ? { bg: '#0a0a0a', grid: '#93C5FD', dot: '#ffffff', dotGlow: 'rgba(59, 130, 246, 0.6)', highlight: 'rgba(96, 165, 250, 0.40)' }
            : { bg: '#ffffff', grid: '#1E3A5F', dot: '#1E3A5F', dotGlow: 'rgba(37, 99, 235, 0.5)', highlight: 'rgba(37, 99, 235, 0.35)' };

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(PADDING * dpr, PADDING * dpr);

        // Background
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, width, height);

        // Highlights
        ctx.fillStyle = colors.highlight;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (paintedGrid[r][c]) {
                    ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
                }
            }
        }

        // Grid lines
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = (gridSize >= 40 ? 0.8 : 1.5) * dpr;
        ctx.beginPath();
        for (let i = 0; i <= gridSize; i++) {
            let x = Math.round(i * cellW);
            let y = Math.round(i * cellH);
            ctx.moveTo(x, 0); ctx.lineTo(x, height);
            ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Central fixation dot
        const centerX = width / 2;
        const centerY = height / 2;
        const dotRadius = Math.max(width * 0.012, 3 * dpr);

        ctx.shadowColor = colors.dotGlow;
        ctx.shadowBlur = 10 * dpr;
        ctx.fillStyle = colors.dot;
        ctx.beginPath();
        ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    requestAnimationFrame(renderLoop);

    // ── Number Animation ──
    function animateValue(el, start, end, duration, suffix) {
        let startTs = null;
        const step = (ts) => {
            if (!startTs) startTs = ts;
            const p = Math.min((ts - startTs) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            const val = (start + ease * (end - start)).toFixed(1);
            el.innerHTML = val + `<span>${suffix}</span>`;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // ── AMD Risk Classification ──
    function classifyRisk(compositeScore) {
        if (compositeScore <= 15) {
            return {
                tier: 'LOW', css: 'low', icon: '✓',
                description: 'No significant distortion detected. Continue routine monitoring.',
                color: 'var(--risk-low)'
            };
        } else if (compositeScore <= 40) {
            return {
                tier: 'MODERATE', css: 'moderate', icon: '⚠',
                description: 'Mild distortion present. Schedule an ophthalmologist consult.',
                color: 'var(--risk-moderate)'
            };
        } else if (compositeScore <= 70) {
            return {
                tier: 'HIGH', css: 'high', icon: '▲',
                description: 'Significant distortion detected. Urgent ophthalmological evaluation recommended.',
                color: 'var(--risk-high)'
            };
        } else {
            return {
                tier: 'CRITICAL', css: 'critical', icon: '✕',
                description: 'Severe distortion across central vision. Immediate clinical intervention required.',
                color: 'var(--risk-critical)'
            };
        }
    }

    // ── Analysis ──
    analyzeBtn.addEventListener('click', () => {
        analyzeBtn.style.transform = 'scale(0.95)';
        setTimeout(() => analyzeBtn.style.transform = '', 150);

        const totalCells = gridSize * gridSize;
        let markedCells = 0;
        let totalPossibleRisk = 0;
        let currentRiskScore = 0;

        const centerR = (gridSize - 1) / 2;
        const centerC = (gridSize - 1) / 2;

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const dist = Math.sqrt(Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2));
                const weight = Math.exp(-dist * 0.25);
                totalPossibleRisk += weight;

                if (paintedGrid[r][c]) {
                    markedCells++;
                    currentRiskScore += weight;
                }
            }
        }

        const distortedAreaPercentage = (markedCells / totalCells) * 100;
        const proximityCenterScore = (currentRiskScore / totalPossibleRisk) * 100;

        // Composite score: weighted blend (proximity matters more clinically)
        const compositeScore = Math.min(100,
            (distortedAreaPercentage * 0.35) + (proximityCenterScore * 0.65)
        );

        // Response time
        let responseTime = null;
        if (timerEnabled && testStartTime) {
            responseTime = ((performance.now() - testStartTime) / 1000).toFixed(1);
        }

        // Risk classification
        const risk = classifyRisk(compositeScore);

        // Build JSON
        const jsonObject = {
            gridDensity: `${gridSize}x${gridSize}`,
            distortedAreaPercentage: Number(distortedAreaPercentage.toFixed(2)),
            proximityCenterScore: Number(proximityCenterScore.toFixed(2)),
            compositeAMDScore: Number(compositeScore.toFixed(2)),
            riskClassification: risk.tier
        };

        if (responseTime !== null) {
            jsonObject.responseTimeSeconds = Number(responseTime);
        }

        // ── Update UI ──
        // Risk badge
        riskBadge.className = 'risk-badge ' + risk.css;
        riskTier.textContent = risk.tier;
        riskIcon.textContent = risk.icon;
        riskDescription.textContent = risk.description;

        // Severity gauge
        const gaugePercent = Math.min(100, compositeScore);
        gaugeFill.style.width = gaugePercent + '%';
        gaugeMarker.style.left = gaugePercent + '%';
        gaugeMarker.style.borderColor = risk.color;

        // Score cards
        jsonOutput.textContent = JSON.stringify(jsonObject, null, 2);

        // Show / animate results
        resultsDiv.style.display = 'block';
        resultsDiv.style.animation = 'none';
        void resultsDiv.offsetWidth;
        resultsDiv.style.animation = 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards';

        animateValue(distAreaEl, 0, distortedAreaPercentage, 800, '%');
        animateValue(proxScoreEl, 0, proximityCenterScore, 800, '%');
        animateValue(compositeEl, 0, compositeScore, 1000, '/100');

        // Timer card
        if (responseTime !== null) {
            timeCard.style.display = '';
            animateValue(timeValEl, 0, parseFloat(responseTime), 600, 's');
        } else {
            timeCard.style.display = 'none';
        }

        // Stop timer if running
        if (timerRunning) stopTimer();

        setTimeout(() => {
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        // Save result to RetinaSafe session
        if (window.RetinaSafeCollector) {
            RetinaSafeCollector.submit({
                game_name          : 'Amsler Grid',
                amd_amsler_score   : compositeScore,
                distorted_area_pct : distortedAreaPercentage,
                proximity_score    : proximityCenterScore,
                amd_risk_modifier  : compositeScore < 40 ? 0.28 : compositeScore < 70 ? 0.18 : compositeScore < 90 ? 0.05 : -0.05,
            });
        }
    });

    // ── Clear ──
    clearBtn.addEventListener('click', () => {
        clearBtn.style.transform = 'scale(0.95)';
        setTimeout(() => clearBtn.style.transform = '', 150);

        paintedGrid = initGrid(gridSize);
        needsRedraw = true;

        if (timerEnabled) resetTimer();

        resultsDiv.style.animation = 'slideUpFade 0.3s reverse ease-in forwards';
        setTimeout(() => { resultsDiv.style.display = 'none'; }, 300);
    });
});

