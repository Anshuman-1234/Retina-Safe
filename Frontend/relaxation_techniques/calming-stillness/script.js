/* ══════════════════════════════════════════════════
   RetinaSafe — Calming Stillness Logic
   ══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ── State & Elements ── */
    const STATE = {
        timer: null,
        timeRemaining: 180, // Default 3 minutes in seconds
        totalDuration: 180,
        cycles: 0,
        isExerciseActive: false,
        breathPhase: 'inhale', // 'inhale', 'hold', 'exhale', 'pause'
        phaseTimeout: null
    };

    // Screens
    const screenStart = document.getElementById('start-screen');
    const screenExercise = document.getElementById('exercise-screen');
    const screenResults = document.getElementById('results-screen');

    // Controls
    const btnStart = document.getElementById('btn-start');
    const btnEndEarly = document.getElementById('btn-end-early');
    const btnRestart = document.getElementById('btn-restart');

    // Exercise UI
    const timeRemainingDisplay = document.getElementById('time-remaining');
    const breathOrb = document.getElementById('breath-orb');
    const breathText = document.getElementById('breath-text');

    // Results UI
    const resTime = document.getElementById('res-time');
    const resCycles = document.getElementById('res-cycles');

    /* ── Navigation Logic ── */
    function switchScreen(fromScreen, toScreen) {
        // Fade out slightly
        fromScreen.style.opacity = '0';
        fromScreen.style.transition = 'opacity 0.4s ease';

        setTimeout(() => {
            fromScreen.classList.remove('active-screen');
            fromScreen.style.opacity = ''; // Reset inline style
            
            toScreen.classList.add('active-screen');
        }, 400); // Wait for transition
    }

    /* ── Exercise Flow ── */
    function startExercise() {
        STATE.timeRemaining = STATE.totalDuration;
        STATE.cycles = 0;
        STATE.isExerciseActive = true;
        
        switchScreen(screenStart, screenExercise);
        
        updateTimerDisplay();
        STATE.timer = setInterval(tick, 1000);
        
        // Start breathing cycle
        runBreathingCycle();
    }

    function endExercise() {
        STATE.isExerciseActive = false;
        clearInterval(STATE.timer);
        clearTimeout(STATE.phaseTimeout);
        
        // Populate results
        const timeSpent = STATE.totalDuration - STATE.timeRemaining;
        resTime.textContent = formatTime(timeSpent);
        resCycles.textContent = STATE.cycles;
        
        switchScreen(screenExercise, screenResults);
    }

    function restartApp() {
        switchScreen(screenResults, screenStart);
    }

    /* ── Timer Logic ── */
    function tick() {
        if (!STATE.isExerciseActive) return;
        
        STATE.timeRemaining--;
        updateTimerDisplay();
        
        if (STATE.timeRemaining <= 0) {
            endExercise();
        }
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateTimerDisplay() {
        timeRemainingDisplay.textContent = formatTime(STATE.timeRemaining);
    }

    /* ── Breathing Pacing Mechanic ── */
    // Simple 4-7-8 inspired or just a slow 4-in, 6-out cycle
    const BREATH_TIMING = {
        inhale: 4000,
        hold: 2000,
        exhale: 6000,
        pause: 2000
    };

    function runBreathingCycle() {
        if (!STATE.isExerciseActive) return;

        // Sequence: Inhale -> Hold -> Exhale -> Pause -> Repeat
        
        // 1. INHALE
        STATE.breathPhase = 'inhale';
        breathOrb.className = 'breath-orb inhaling'; 
        breathText.textContent = "Inhale...";
        
        STATE.phaseTimeout = setTimeout(() => {
            if (!STATE.isExerciseActive) return;
            
            // 2. HOLD
            STATE.breathPhase = 'hold';
            breathText.textContent = "Hold";
            
            STATE.phaseTimeout = setTimeout(() => {
                if (!STATE.isExerciseActive) return;
                
                // 3. EXHALE
                STATE.breathPhase = 'exhale';
                breathOrb.className = 'breath-orb exhaling';
                breathText.textContent = "Exhale...";
                
                STATE.phaseTimeout = setTimeout(() => {
                    if (!STATE.isExerciseActive) return;
                    
                    // 4. PAUSE
                    STATE.breathPhase = 'pause';
                    breathText.textContent = "Rest";
                    
                    STATE.phaseTimeout = setTimeout(() => {
                        if (!STATE.isExerciseActive) return;
                        STATE.cycles++;
                        runBreathingCycle(); // loop
                    }, BREATH_TIMING.pause);
                }, BREATH_TIMING.exhale);
            }, BREATH_TIMING.hold);
        }, BREATH_TIMING.inhale);
    }

    /* ── Event Listeners ── */
    btnStart.addEventListener('click', startExercise);
    btnEndEarly.addEventListener('click', endExercise);
    btnRestart.addEventListener('click', restartApp);

});
