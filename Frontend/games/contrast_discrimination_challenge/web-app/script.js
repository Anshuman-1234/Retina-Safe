// ===================================================================
// RetinaSafe — Contrast Discrimination Challenge
// Game Logic & Scoring Engine
// ===================================================================

// --- State Variables ---
let level = 1;
let lives = 3;
let score = 0;
let timeLeft = 30;
let timerInterval = null;
let isPlaying = false;
let lastClickTime = 0;
let currentContrastDiff = 50; // Started at 150 vs 100
const BACKGROUND_RGB = 100;

// Shape rotation — changes every 5 levels
const SHAPES = ['shape-circle', 'shape-rounded-square', 'shape-diamond', 'shape-ellipse'];

// --- DOM Elements ---
const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const gameUI = document.getElementById('gameUI');
const startBtn = document.getElementById('startBtn');

const target = document.getElementById('target');
const gameArea = document.getElementById('gameArea');

const livesDisplay = document.getElementById('livesDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const resultText = document.getElementById('resultText');

// --- Core Logic ---
function initGame() {
  level = 1;
  lives = 3;
  score = 0;
  timeLeft = 30;
  currentContrastDiff = 50;
  isPlaying = true;

  updateHUD();
  applyContrastDiff();
  applyShape();
  moveTarget();

  startOverlay.classList.add('hidden');
  endOverlay.classList.add('hidden');
  gameUI.classList.remove('hidden');

  // Display target and trigger animation
  target.style.display = 'block';
  target.classList.remove('pop');
  void target.offsetWidth; // trigger reflow
  target.classList.add('pop');

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  timeLeft--;
  updateHUD();
  if (timeLeft <= 0) {
    endGame("Time Expired");
  }
}

function updateHUD() {
  livesDisplay.innerHTML = `<span class="icon" aria-hidden="true">❤️</span><span class="value">${lives}</span>`;
  scoreDisplay.innerHTML = `<span class="icon" aria-hidden="true">🏆</span><span class="value">${score.toLocaleString()}</span>`;
  levelDisplay.innerHTML = `<span class="label">Level</span><span class="value">${level}</span>`;
  timeDisplay.innerHTML = `<span class="icon" aria-hidden="true">⏱️</span><span class="value">00:${timeLeft.toString().padStart(2, '0')}</span>`;
}

function applyContrastDiff() {
  // === PHASE 1: Color convergence ===
  // RGB difference drops linearly from 50 → 0 over 25 levels
  const MAX_LEVEL_FOR_COLOR = 25;
  currentContrastDiff = Math.max(0, Math.round(50 * (1 - (level - 1) / MAX_LEVEL_FOR_COLOR)));

  const targetRGB = BACKGROUND_RGB + currentContrastDiff;

  // === PHASE 2: Opacity fade ===
  // Opacity starts decreasing from level 10 onward (1.0 → 0.0 by level 25)
  const OPACITY_FADE_START = 10;
  const OPACITY_FADE_END = 25;
  let opacity = 1.0;
  if (level >= OPACITY_FADE_START) {
    opacity = Math.max(0, 1.0 - (level - OPACITY_FADE_START) / (OPACITY_FADE_END - OPACITY_FADE_START));
  }

  // Apply both — color AND opacity converge to background simultaneously
  document.documentElement.style.setProperty('--target-color', `rgba(${targetRGB}, ${targetRGB}, ${targetRGB}, ${opacity.toFixed(2)})`);
}

function applyShape() {
  // Cycle through shapes every 5 levels
  const shapeIndex = Math.min(Math.floor((level - 1) / 5), SHAPES.length - 1);
  const shapeClass = SHAPES[shapeIndex];

  // Remove all shape classes first
  SHAPES.forEach(cls => target.classList.remove(cls));
  target.classList.add(shapeClass);
}

function moveTarget() {
  // Keeps the target completely within the viewport bounds (approx 5% to 90%)
  const randomTop = Math.floor(Math.random() * 85) + 5;
  const randomLeft = Math.floor(Math.random() * 85) + 5;

  target.style.top = `${randomTop}vh`;
  target.style.left = `${randomLeft}vw`;

  // Retrigger pop animation
  target.classList.remove('pop');
  void target.offsetWidth;
  target.classList.add('pop');
}

// --- Micro-animations on HUD pills ---
function triggerLevelPulse() {
  levelDisplay.classList.remove('level-up-pulse');
  void levelDisplay.offsetWidth;
  levelDisplay.classList.add('level-up-pulse');
}

function triggerScorePop() {
  scoreDisplay.classList.remove('score-pop');
  void scoreDisplay.offsetWidth;
  scoreDisplay.classList.add('score-pop');
}

// --- Throttling Utility ---
function isThrottled() {
  const now = Date.now();
  if (now - lastClickTime < 350) {
    return true; // Prevents accidental double click fast-forwards
  }
  lastClickTime = now;
  return false;
}

// --- Event Handlers ---
function handleTargetClick(e) {
  if (!isPlaying) return;
  e.stopPropagation(); // Prevents triggering the game area's miss handler

  if (isThrottled()) return;

  // Award points — harder levels give more
  score += level * 10;

  level++;
  applyContrastDiff();
  applyShape();
  moveTarget();
  updateHUD();

  // Trigger HUD animations
  triggerLevelPulse();
  triggerScorePop();
}

function handleMissClick(e) {
  if (!isPlaying || isThrottled()) return;

  lives--;
  updateHUD();

  // Visual miss feedback — inset border flash (preserves game-area grey)
  document.body.classList.add('miss-flash');
  setTimeout(() => { document.body.classList.remove('miss-flash'); }, 180);

  if (lives <= 0) {
    endGame("Loss of Visual Tracking");
  }
}

// --- Finish & Performance Output ---
function endGame(reason) {
  isPlaying = false;
  clearInterval(timerInterval);

  target.style.display = 'none';
  gameUI.classList.add('hidden');
  endOverlay.classList.remove('hidden');

  let riskMultiplier = 1.0;
  let riskClass = "Normal";
  let statusClass = "status-normal";

  if (currentContrastDiff > 30) {
    riskMultiplier = 3.0;
    riskClass = "High Risk";
    statusClass = "status-high";
  } else if (currentContrastDiff > 15) {
    riskMultiplier = 1.8;
    riskClass = "Elevated Risk";
    statusClass = "status-elevated";
  }

  // Output Expected Object
  const scoreObject = {
    score: score,
    lowestContrastReached: currentContrastDiff,
    riskMultiplier: riskMultiplier,
    levelsCleared: level - 1
  };

  // Push to standard output for parent application to read
  console.log("[Medical-Logic] Session Object Export: ", scoreObject);

  // Render results readout
  resultText.innerHTML = `
    <h2>${reason}</h2>
    <div class="result-row">
      <span class="result-label">Score</span>
      <span class="result-value result-score">🏆 ${score.toLocaleString()}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Levels Cleared</span>
      <span class="result-value">${level - 1}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Lowest Threshold</span>
      <span class="result-value">Δ${currentContrastDiff} RGB</span>
    </div>
    <div class="result-row">
      <span class="result-label">Diagnostic Multiplier</span>
      <span class="result-value">x${riskMultiplier.toFixed(1)}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Predicted Status</span>
      <span class="result-value ${statusClass}">${riskClass}</span>
    </div>
    <p class="result-footnote">Test object emitted to Dev Console.</p>
  `;
}

// --- Event Listeners ---
startBtn.addEventListener('click', initGame);

target.addEventListener('click', handleTargetClick);
gameArea.addEventListener('click', handleMissClick);
