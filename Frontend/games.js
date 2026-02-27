/**
 * RetinaSafe — Games Controller
 * ==============================
 * Implements all four vision games exactly per the RetinaSafe Vision Game
 * Scoring System & Level Design Specification (Document 1 of 2).
 *
 * Game 1: Contrast Discrimination Challenge (Diabetic Retinopathy) §2
 * Game 2: Dynamic Amsler Grid (AMD) §3
 * Game 3: Peripheral Reaction Tester (Glaucoma) §4
 * Game 4: Colour Hue Sorting (Cataract) §5
 */

const GameController = (() => {

  // ── Shared state ────────────────────────────────────────────────────────
  let currentGame = 0;

  // Show/hide game screens and update progress indicator
  function showScreen(id) {
    document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  }

  function updateProgress(gameNum) {
    document.querySelectorAll('.gp-step').forEach(s => {
      const n = parseInt(s.dataset.game);
      s.classList.remove('active', 'done');
      if (n === gameNum) s.classList.add('active');
      if (n < gameNum)   s.classList.add('done');
    });
  }

  function startGame(n) {
    currentGame = n;
    updateProgress(n);
    const map = { 1: game1, 2: game2, 3: game3, 4: game4 };
    showScreen(`screen-game${n}`);
    map[n] && map[n].init();
  }

  function finishGame(n, result) {
    Scoring.saveGameResult(
      ['','contrast','amsler','peripheral','hue'][n],
      result
    );
    if (n < 4) {
      startGame(n + 1);
    } else {
      showCompleteScreen();
    }
  }

  function showCompleteScreen() {
    updateProgress(5); // all done
    document.querySelectorAll('.gp-step').forEach(s => s.classList.add('done'));
    showScreen('screen-complete');
    renderScorePreview();
  }

  function renderScorePreview() {
    const payload = Scoring.load();
    const games   = payload.games;
    const wrap    = document.getElementById('score-preview');
    if (!wrap) return;

    const items = [
      { label: 'Contrast (DR)',      key: 'contrast',   score: games.contrast?.score },
      { label: 'Amsler (AMD)',        key: 'amsler',     score: games.amsler?.score },
      { label: 'Peripheral (Glauc)', key: 'peripheral', score: games.peripheral?.score },
      { label: 'Hue Sorting (Cat)',   key: 'hue',        score: games.hue?.score }
    ];

    wrap.innerHTML = items.map(it => {
      const score = it.score ?? '—';
      const cls   = score >= 75 ? 'good' : score >= 45 ? 'warn' : 'bad';
      return `
        <div class="sp-item">
          <div class="sp-label">${it.label}</div>
          <div class="sp-score ${cls}">${score}</div>
        </div>`;
    }).join('');
  }

  // ══════════════════════════════════════════════════════════════════════
  // GAME 1 — CONTRAST DISCRIMINATION CHALLENGE
  // Spec §2: 10 levels × 3 attempts, early exit on 3 consecutive fails
  // ══════════════════════════════════════════════════════════════════════
  const game1 = (() => {

    // Level design table (§2.3)
    // Each level: { rgbDiff: contrast difference, timeMs: allowed time }
    const LEVELS = [
      { rgbDiff: 80,  timeMs: 5000 },  // Level 1  — very easy
      { rgbDiff: 65,  timeMs: 5000 },  // Level 2
      { rgbDiff: 50,  timeMs: 5000 },  // Level 3
      { rgbDiff: 40,  timeMs: 5000 },  // Level 4
      { rgbDiff: 32,  timeMs: 6000 },  // Level 5
      { rgbDiff: 24,  timeMs: 6000 },  // Level 6
      { rgbDiff: 18,  timeMs: 7000 },  // Level 7
      { rgbDiff: 13,  timeMs: 7000 },  // Level 8
      { rgbDiff: 9,   timeMs: 8000 },  // Level 9
      { rgbDiff: 6,   timeMs: 8000 }   // Level 10 — very hard
    ];

    const MAX_ATTEMPTS     = 3;  // attempts per level
    const CONSEC_FAIL_EXIT = 3;  // consecutive failures → early exit

    let state = {};
    let timerRAF = null;
    let shapeStartTime = 0;
    let reactionTimes  = [];

    function init() {
      document.getElementById('g1-start-btn').onclick = startLevel;
    }

    function resetState() {
      state = {
        level:           0,   // 0-indexed
        attemptsLeft:    MAX_ATTEMPTS,
        consecutiveFails: 0,
        levelsPassed:    0,
        running:         false
      };
    }

    function startLevel() {
      if (!state.running) {
        resetState();
        reactionTimes = [];
      }
      state.running = true;

      // Hide instructions, show arena
      document.getElementById('g1-instructions').style.display = 'none';
      document.getElementById('g1-result').style.display      = 'none';
      document.getElementById('g1-arena').style.display       = 'flex';

      updateMeta();
      drawLevel();
    }

    function updateMeta() {
      document.getElementById('g1-level').textContent    = state.level + 1;
      document.getElementById('g1-attempts').textContent = state.attemptsLeft;
      document.getElementById('g1-fails').textContent    = state.consecutiveFails;
    }

    function drawLevel() {
      const canvas  = document.getElementById('g1-canvas');
      const ctx     = canvas.getContext('2d');
      const lvl     = LEVELS[state.level];

      // Responsive canvas
      canvas.width  = Math.min(600, window.innerWidth - 48);
      canvas.height = Math.round(canvas.width * 0.65);

      // Random background shade in mid-range grey (not too dark, not too bright)
      const bgBase = 80 + Math.floor(Math.random() * 60);
      const bgColor = `rgb(${bgBase},${bgBase},${bgBase})`;

      // Shape colour = background + contrast diff
      const shapeBase  = bgBase + lvl.rgbDiff;
      const shapeColor = `rgb(${shapeBase},${shapeBase},${shapeBase})`;

      // Fill background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Random shape position (avoid edges)
      const margin   = 60;
      const shapeSize = 50 + Math.floor(Math.random() * 30);
      const shapeX   = margin + Math.random() * (canvas.width  - margin * 2 - shapeSize);
      const shapeY   = margin + Math.random() * (canvas.height - margin * 2 - shapeSize);

      // Draw shape (circle or square, random)
      ctx.fillStyle = shapeColor;
      if (Math.random() > 0.5) {
        ctx.beginPath();
        ctx.arc(shapeX + shapeSize/2, shapeY + shapeSize/2, shapeSize/2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(shapeX, shapeY, shapeSize, shapeSize);
      }

      // Store shape bounds for hit detection
      state.shapeBounds = { x: shapeX, y: shapeY, w: shapeSize, h: shapeSize };
      state.shapeSize   = shapeSize;

      // Start timer
      shapeStartTime = performance.now();
      startTimer(lvl.timeMs);

      // Click handler
      canvas.onclick = handleClick;
      document.getElementById('g1-feedback').textContent = '';
      document.getElementById('g1-feedback').className   = 'g1-feedback';
    }

    function handleClick(e) {
      const canvas = document.getElementById('g1-canvas');
      const rect   = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx     = (e.clientX - rect.left)  * scaleX;
      const cy     = (e.clientY - rect.top)   * scaleY;
      const b      = state.shapeBounds;

      // Allow click anywhere within shapeSize + 20px tolerance
      const tol = 20;
      const hit = cx >= b.x - tol && cx <= b.x + b.w + tol &&
                  cy >= b.y - tol && cy <= b.y + b.h + tol;

      const reactionMs = performance.now() - shapeStartTime;
      stopTimer();
      canvas.onclick = null;

      if (hit) {
        onCorrect(reactionMs);
      } else {
        onWrong();
      }
    }

    function onTimeout() {
      const canvas = document.getElementById('g1-canvas');
      canvas.onclick = null;
      onWrong();
    }

    function onCorrect(reactionMs) {
      reactionTimes.push(reactionMs);
      state.levelsPassed++;
      state.consecutiveFails = 0;
      state.attemptsLeft = MAX_ATTEMPTS;  // reset attempts on new level

      showFeedback('✓ Found it!', 'correct');

      setTimeout(() => {
        state.level++;
        if (state.level >= LEVELS.length) {
          endGame();
        } else {
          updateMeta();
          drawLevel();
        }
      }, 700);
    }

    function onWrong() {
      state.attemptsLeft--;
      state.consecutiveFails++;

      if (state.consecutiveFails >= CONSEC_FAIL_EXIT || state.attemptsLeft <= 0) {
        showFeedback('✗ Missed — level threshold reached', 'wrong');
        setTimeout(() => endGame(), 900);
        return;
      }

      showFeedback(`✗ Try again (${state.attemptsLeft} attempts left)`, 'wrong');
      updateMeta();
      setTimeout(() => drawLevel(), 900);
    }

    function showFeedback(msg, cls) {
      const el = document.getElementById('g1-feedback');
      el.textContent = msg;
      el.className   = `g1-feedback ${cls}`;
    }

    function startTimer(durationMs) {
      const fill  = document.getElementById('g1-timer-fill');
      const start = performance.now();

      function tick() {
        const elapsed = performance.now() - start;
        const pct     = Math.max(0, 1 - elapsed / durationMs);
        fill.style.width = `${pct * 100}%`;

        if (pct < 0.25) fill.className = 'g1-timer-fill critical';
        else if (pct < 0.5) fill.className = 'g1-timer-fill warning';
        else fill.className = 'g1-timer-fill';

        if (elapsed >= durationMs) {
          onTimeout();
          return;
        }
        timerRAF = requestAnimationFrame(tick);
      }
      timerRAF = requestAnimationFrame(tick);
    }

    function stopTimer() {
      if (timerRAF) {
        cancelAnimationFrame(timerRAF);
        timerRAF = null;
      }
    }

    function endGame() {
      stopTimer();
      document.getElementById('g1-arena').style.display = 'none';

      const avgReactionMs = reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 3000;

      const result = Scoring.computeContrastScore({
        levelsPassed: state.levelsPassed,
        avgReactionMs
      });

      // Show result card
      const icon = document.getElementById('g1-result-icon');
      const msg  = document.getElementById('g1-result-msg');
      icon.textContent = result.score >= 75 ? '✓' : result.score >= 45 ? '~' : '✗';
      msg.innerHTML    = `
        <strong>Contrast Score: ${result.score}/100</strong><br/>
        Levels passed: ${result.levelsPassed}/10 · 
        Avg reaction: ${Math.round(avgReactionMs)}ms<br/>
        <em>${result.interpretation}</em>
      `;

      document.getElementById('g1-result').style.display = 'block';
      document.getElementById('g1-next-btn').onclick = () => finishGame(1, result);
    }

    return { init };
  })();

  // ══════════════════════════════════════════════════════════════════════
  // GAME 2 — DYNAMIC AMSLER GRID
  // Spec §3: Single session, both eyes separately, centre-weighted scoring
  // ══════════════════════════════════════════════════════════════════════
  const game2 = (() => {

    const CANVAS_SIZE  = 480;
    const GRID_CELLS   = 20;      // 20×20 grid lines
    const DOT_RADIUS   = 6;       // central fixation dot radius
    const BRUSH_RADIUS = 14;      // paint brush size

    let painting   = false;
    let markedData = { right: [], left: [] };
    let currentEye = 'right';

    function init() {
      document.getElementById('g2-start-btn').onclick = startRightEye;
    }

    function startRightEye() {
      currentEye = 'right';
      document.getElementById('g2-instructions').style.display = 'none';
      document.getElementById('g2-arena').style.display        = 'flex';
      document.getElementById('g2-remind').textContent =
        'RIGHT eye — cover your LEFT eye. Stare at the dot. Paint distorted areas.';
      setupCanvas();
    }

    function startLeftEye() {
      currentEye = 'left';
      // Update cover prompt
      document.getElementById('g2-remind').textContent =
        'LEFT eye — cover your RIGHT eye. Stare at the dot. Paint distorted areas.';
      setupCanvas();
    }

    function setupCanvas() {
      const canvas = document.getElementById('g2-canvas');
      // Responsive
      const size = Math.min(CANVAS_SIZE, window.innerWidth - 48);
      canvas.width  = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      drawGrid(ctx, size);

      painting = false;
      // Drawing events (mouse + touch)
      canvas.onmousedown  = () => { painting = true; };
      canvas.onmouseup    = () => { painting = false; };
      canvas.onmouseleave = () => { painting = false; };
      canvas.onmousemove  = (e) => { if (painting) paint(e, canvas, ctx, size); };
      canvas.onclick      = (e) => paint(e, canvas, ctx, size);

      canvas.ontouchstart = (e) => { e.preventDefault(); painting = true; paintTouch(e, canvas, ctx, size); };
      canvas.ontouchend   = () => { painting = false; };
      canvas.ontouchmove  = (e) => { e.preventDefault(); if (painting) paintTouch(e, canvas, ctx, size); };

      document.getElementById('g2-clear-btn').onclick = () => {
        markedData[currentEye] = [];
        drawGrid(ctx, size);
      };
      document.getElementById('g2-done-btn').onclick = () => {
        if (currentEye === 'right') {
          startLeftEye();
        } else {
          endGame();
        }
      };
      document.getElementById('g2-eye-label').textContent =
        currentEye === 'right' ? 'Right Eye' : 'Left Eye';
      document.getElementById('g2-phase-label').textContent =
        currentEye === 'right' ? 'Phase 1 of 2' : 'Phase 2 of 2';
    }

    function drawGrid(ctx, size) {
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Grid lines
      ctx.strokeStyle = '#000000';
      ctx.lineWidth   = 0.75;
      const step = size / GRID_CELLS;

      for (let i = 0; i <= GRID_CELLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * step, 0);
        ctx.lineTo(i * step, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * step);
        ctx.lineTo(size, i * step);
        ctx.stroke();
      }

      // Central fixation dot
      const cx = size / 2, cy = size / 2;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Redraw any existing marks
      const marks = markedData[currentEye] || [];
      marks.forEach(m => {
        ctx.fillStyle = 'rgba(220, 50, 50, 0.35)';
        ctx.beginPath();
        ctx.arc(m.x, m.y, BRUSH_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function paint(e, canvas, ctx, size) {
      const rect  = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const x     = (e.clientX - rect.left) * scale;
      const y     = (e.clientY - rect.top)  * scale;
      applyPaint(x, y, ctx);
    }

    function paintTouch(e, canvas, ctx, size) {
      const rect  = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const touch = e.touches[0];
      const x     = (touch.clientX - rect.left) * scale;
      const y     = (touch.clientY - rect.top)  * scale;
      applyPaint(x, y, ctx);
    }

    function applyPaint(x, y, ctx) {
      ctx.fillStyle = 'rgba(220, 50, 50, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      markedData[currentEye].push({ x, y });
    }

    function endGame() {
      // Combine both eyes' data
      const allMarked = [
        ...markedData.right,
        ...markedData.left
      ];

      const result = Scoring.computeAmslerScore({
        markedPixels: allMarked,
        totalPixels:  CANVAS_SIZE * CANVAS_SIZE,
        canvasSize:   CANVAS_SIZE
      });

      finishGame(2, result);
    }

    return { init };
  })();

  // ══════════════════════════════════════════════════════════════════════
  // GAME 3 — PERIPHERAL REACTION TESTER
  // Spec §4: 8 zones × 4 flashes = 32 total, ~64 seconds
  // ══════════════════════════════════════════════════════════════════════
  const game3 = (() => {

    // 8 peripheral zones with approximate positions (% of container)
    const ZONES = {
      NW: { xRange: [3,  15], yRange: [3,  15] },
      N:  { xRange: [40, 60], yRange: [2,  10] },
      NE: { xRange: [85, 97], yRange: [3,  15] },
      E:  { xRange: [88, 97], yRange: [40, 60] },
      SE: { xRange: [85, 97], yRange: [85, 97] },
      S:  { xRange: [40, 60], yRange: [90, 97] },
      SW: { xRange: [3,  15], yRange: [85, 97] },
      W:  { xRange: [2,  10], yRange: [40, 60] }
    };

    const FLASHES_PER_ZONE = 4;        // §4.2
    const FLASH_DURATION   = 600;      // ms — dot visible time
    const INTER_FLASH_MS   = 1500;     // ms between flashes
    const RESPONSE_WINDOW  = 1500;     // ms after flash to accept response

    let flashQueue = [];
    let flashIndex = 0;
    let currentFlash = null;
    let flashTimeout  = null;
    let responseWindow = false;
    let zoneHits   = {};
    let zoneMisses = {};

    function init() {
      // Initialise zone counters
      Object.keys(ZONES).forEach(z => { zoneHits[z] = 0; zoneMisses[z] = 0; });
      document.getElementById('g3-start-btn').onclick = startGame3;
    }

    function buildFlashQueue() {
      // Generate 4 flashes per zone, then shuffle
      const queue = [];
      Object.keys(ZONES).forEach(zone => {
        for (let i = 0; i < FLASHES_PER_ZONE; i++) queue.push(zone);
      });
      // Fisher-Yates shuffle
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
      return queue;
    }

    function startGame3() {
      flashQueue = buildFlashQueue();
      flashIndex = 0;
      zoneHits   = {};
      zoneMisses = {};
      Object.keys(ZONES).forEach(z => { zoneHits[z] = 0; zoneMisses[z] = 0; });

      document.getElementById('g3-instructions').style.display = 'none';
      document.getElementById('g3-arena').style.display        = 'flex';
      document.getElementById('g3-arena').focus();

      // Keyboard + tap response
      document.addEventListener('keydown', handleResponse);
      document.getElementById('g3-arena').addEventListener('click', handleResponse);

      animateCentralTarget();
      scheduleNextFlash();
    }

    // Gently move the central target to enforce fixation
    function animateCentralTarget() {
      const target = document.getElementById('g3-target');
      const field  = document.getElementById('g3-field');

      function moveTarget() {
        const w   = field.clientWidth;
        const h   = field.clientHeight;
        // Small wander around centre (30–70% of field)
        const x   = 38 + Math.random() * 24;
        const y   = 38 + Math.random() * 24;
        target.style.left = `${x}%`;
        target.style.top  = `${y}%`;
      }

      target.style.left = '50%';
      target.style.top  = '50%';
      // Move every 1.5s
      setInterval(moveTarget, 1500);
    }

    function scheduleNextFlash() {
      if (flashIndex >= flashQueue.length) {
        endGame3();
        return;
      }
      flashTimeout = setTimeout(showFlash, INTER_FLASH_MS);
    }

    function showFlash() {
      const zone      = flashQueue[flashIndex];
      const zoneConf  = ZONES[zone];
      const field     = document.getElementById('g3-field');

      // Position dot within zone range
      const xPct = zoneConf.xRange[0] + Math.random() * (zoneConf.xRange[1] - zoneConf.xRange[0]);
      const yPct = zoneConf.yRange[0] + Math.random() * (zoneConf.yRange[1] - zoneConf.yRange[0]);

      const dot = document.createElement('div');
      dot.className = 'g3-dot';
      dot.style.left = `${xPct}%`;
      dot.style.top  = `${yPct}%`;
      field.appendChild(dot);

      currentFlash   = { zone, dot, responded: false };
      responseWindow = true;

      // Remove dot after flash duration
      setTimeout(() => {
        dot.remove();
        // After dot gone, close response window and score this flash
        setTimeout(() => {
          if (!currentFlash.responded) {
            zoneMisses[zone] = (zoneMisses[zone] || 0) + 1;
          }
          responseWindow = false;
          currentFlash   = null;
          flashIndex++;
          updateMeta();
          scheduleNextFlash();
        }, RESPONSE_WINDOW - FLASH_DURATION);
      }, FLASH_DURATION);
    }

    function handleResponse(e) {
      if (e.type === 'keydown' && e.code !== 'Space') return;
      if (!responseWindow || !currentFlash || currentFlash.responded) return;
      currentFlash.responded = true;
      zoneHits[currentFlash.zone] = (zoneHits[currentFlash.zone] || 0) + 1;
    }

    function updateMeta() {
      const total    = flashIndex;
      const detected = Object.values(zoneHits).reduce((a,b) => a+b, 0);
      const missed   = Object.values(zoneMisses).reduce((a,b) => a+b, 0);
      document.getElementById('g3-flash-count').textContent = total;
      document.getElementById('g3-detected').textContent    = detected;
      document.getElementById('g3-missed').textContent      = missed;
    }

    function endGame3() {
      clearTimeout(flashTimeout);
      document.removeEventListener('keydown', handleResponse);

      const result = Scoring.computePeripheralScore({ zoneHits, zoneMisses });
      finishGame(3, result);
    }

    return { init };
  })();

  // ══════════════════════════════════════════════════════════════════════
  // GAME 4 — COLOUR HUE SORTING
  // Spec §5: 10 rounds in 30 seconds, HSL tritan-axis hue discrimination
  // ══════════════════════════════════════════════════════════════════════
  const game4 = (() => {

    const TOTAL_ROUNDS    = 10;    // §5.2
    const TOTAL_TIME_SEC  = 30;
    const GRID_SIZE       = 9;     // 3×3 grid of tiles

    // Level design (§5.3): hue difference decreases each round
    // Base hue on blue-purple axis (200–260 deg) — tritan axis for cataract
    const ROUND_HUE_DIFFS = [25, 22, 19, 16, 14, 12, 10, 8, 6, 4];

    let round        = 0;
    let roundResults = [];
    let gameTimerInterval;
    let timeLeft     = TOTAL_TIME_SEC;
    let roundStart   = 0;
    let imposterIdx  = -1;
    let answered     = false;

    function init() {
      document.getElementById('g4-start-btn').onclick = startGame4;
    }

    function startGame4() {
      round        = 0;
      roundResults = [];
      timeLeft     = TOTAL_TIME_SEC;

      document.getElementById('g4-instructions').style.display = 'none';
      document.getElementById('g4-arena').style.display        = 'flex';

      startGlobalTimer();
      showRound();
    }

    function startGlobalTimer() {
      const fillEl = document.getElementById('g4-timer-fill');
      gameTimerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('g4-timer').textContent = Math.max(timeLeft, 0);
        fillEl.style.width = `${(timeLeft / TOTAL_TIME_SEC) * 100}%`;
        if (timeLeft <= 0) {
          clearInterval(gameTimerInterval);
          endGame4();
        }
      }, 1000);
    }

    function showRound() {
      if (round >= TOTAL_ROUNDS) {
        endGame4();
        return;
      }

      answered = false;
      document.getElementById('g4-round').textContent    = round + 1;
      document.getElementById('g4-feedback').textContent = '';
      document.getElementById('g4-feedback').className   = 'g4-feedback';

      const hueDiff   = ROUND_HUE_DIFFS[round];
      const baseHue   = 210 + Math.floor(Math.random() * 50);  // blue-purple band
      const sat       = 55;
      const lig       = 55;
      imposterIdx     = Math.floor(Math.random() * GRID_SIZE);

      // Determine grid columns
      const cols = Math.ceil(Math.sqrt(GRID_SIZE));
      const grid = document.getElementById('g4-grid');
      const tileSize = Math.min(70, Math.floor((Math.min(420, window.innerWidth - 48) - cols * 8) / cols));
      grid.style.gridTemplateColumns = `repeat(${cols}, ${tileSize}px)`;
      grid.innerHTML = '';

      for (let i = 0; i < GRID_SIZE; i++) {
        const tile = document.createElement('div');
        tile.className = 'g4-tile';
        tile.style.width  = `${tileSize}px`;
        tile.style.height = `${tileSize}px`;

        const hue = i === imposterIdx ? baseHue + hueDiff : baseHue;
        tile.style.background = `hsl(${hue}, ${sat}%, ${lig}%)`;
        tile.dataset.idx = i;
        tile.onclick = handleTileClick;
        grid.appendChild(tile);
      }

      roundStart = performance.now();
    }

    function handleTileClick(e) {
      if (answered || timeLeft <= 0) return;
      answered = true;
      const idx        = parseInt(e.currentTarget.dataset.idx);
      const reactionMs = performance.now() - roundStart;
      const correct    = (idx === imposterIdx);

      // Highlight all tiles
      document.querySelectorAll('.g4-tile').forEach((t, i) => {
        if (i === imposterIdx) t.classList.add('correct');
        else if (i === idx && !correct) t.classList.add('wrong');
      });

      roundResults.push({ correct, reactionMs });

      // Update score display
      const score = roundResults.filter(r => r.correct).length;
      document.getElementById('g4-score').textContent = score;

      const fb = document.getElementById('g4-feedback');
      if (correct) {
        fb.textContent = `✓ Correct! (${Math.round(reactionMs)}ms)`;
        fb.className   = 'g4-feedback correct';
      } else {
        fb.textContent = '✗ Not quite — that was the imposter tile';
        fb.className   = 'g4-feedback wrong';
      }

      round++;
      setTimeout(showRound, 900);
    }

    function endGame4() {
      clearInterval(gameTimerInterval);

      // Fill in any unplayed rounds as incorrect (ran out of time)
      while (roundResults.length < TOTAL_ROUNDS) {
        roundResults.push({ correct: false, reactionMs: 3000 });
      }

      const result = Scoring.computeHueScore({ roundResults });
      finishGame(4, result);
    }

    return { init };
  })();

  // ── Public API ───────────────────────────────────────────────────────
  return { startGame };

})();

// Start on page load — show intro screen
window.addEventListener('DOMContentLoaded', () => {
  // Intro screen is active by default (set in HTML)
  // GameController.startGame() called from button in intro screen
});