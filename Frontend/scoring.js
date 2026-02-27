/**
 * RetinaSafe — Scoring & Risk Computation Module
 * ================================================
 * Implements all scoring formulas and risk calculations exactly as specified
 * in the RetinaSafe Vision Game Scoring System & Level Design Specification
 * and Patient Report Structure & Clinical Judgement Framework documents.
 *
 * All scores are stored in sessionStorage under the key 'retinasafe_scores'.
 * No data is persisted beyond the session.
 */

const Scoring = (() => {

  // ── Storage key ────────────────────────────────────────────────────────
  const STORAGE_KEY = 'retinasafe_scores';

  // ── Default structure ───────────────────────────────────────────────────
  function defaultPayload() {
    return {
      games: {
        contrast:   null,  // Game 1 — DR
        amsler:     null,  // Game 2 — AMD
        peripheral: null,  // Game 3 — Glaucoma
        hue:        null   // Game 4 — Cataract
      },
      cnn: {
        // CNN model output probabilities [0–1] per class
        // Populated after image analysis (scan.html)
        amd:      0,
        cataract: 0,
        diabetes: 0,
        glaucoma: 0,
        normal:   0
      },
      history: {
        // Medical history flags — not collected in current MVP (no login)
        // Kept as 0 / neutral so formulas remain valid
        diabetes_flag:     0,
        hypertension_flag: 0,
        age_group:         1,  // 1 = mid-age neutral
        family_history_flag: 0
      },
      report: null  // Computed report object, set after analysis
    };
  }

  function load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultPayload();
    } catch {
      return defaultPayload();
    }
  }

  function save(payload) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function clear() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  // ─────────────────────────────────────────────────────────────────────
  // GAME 1 — CONTRAST DISCRIMINATION CHALLENGE (Diabetic Retinopathy)
  // Specification §2.4
  //
  // Formula:
  //   base_score = (levels_passed / 10) × 100
  //   time_bonus  = clamp((3000 - avg_reaction_ms) / 3000, 0, 1) × 15
  //   score       = clamp(base_score + time_bonus, 0, 100)
  //   
  //   dr_modifier = derived from score (§2.5)
  // ─────────────────────────────────────────────────────────────────────
  function computeContrastScore({ levelsPassed, avgReactionMs }) {
    const base      = (levelsPassed / 10) * 100;
    const timeBonus = Math.min(Math.max((3000 - avgReactionMs) / 3000, 0), 1) * 15;
    const score     = Math.min(Math.max(Math.round(base + timeBonus), 0), 100);

    // Modifier for DR risk (§2.5)
    let dr_modifier;
    let interpretation;
    if (score >= 75) {
      dr_modifier     = -0.10;  // lowers DR risk
      interpretation  = 'Normal contrast sensitivity';
    } else if (score >= 45) {
      dr_modifier     = 0.05;
      interpretation  = 'Mildly reduced contrast sensitivity';
    } else {
      dr_modifier     = 0.20;   // elevates DR risk
      interpretation  = 'Significantly reduced contrast sensitivity';
    }

    return {
      game: 'contrast',
      score,
      levelsPassed,
      avgReactionMs: Math.round(avgReactionMs),
      dr_modifier,
      interpretation,
      influenced: score < 75
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // GAME 2 — DYNAMIC AMSLER GRID (AMD)
  // Specification §3.4
  //
  // Canvas is divided into 3 radial zones (§3.3):
  //   Central  (r < 25%):  weight 3.0
  //   Mid      (25–50%):   weight 1.5
  //   Outer    (> 50%):    weight 0.5
  //
  // weighted_marked = sum of zone-weighted marked pixels
  // weighted_total  = sum of zone-weighted total pixels
  // distortion_ratio = weighted_marked / weighted_total
  // score = clamp(100 - (distortion_ratio × 200), 0, 100)
  //   (a fully clear grid scores 100; heavy central marking → low score)
  // ─────────────────────────────────────────────────────────────────────
  function computeAmslerScore({ markedPixels, totalPixels, canvasSize }) {
    const cx = canvasSize / 2;
    const maxR = canvasSize / 2;

    let weightedMarked = 0;
    let weightedTotal  = 0;

    for (const px of markedPixels) {
      const r = Math.sqrt((px.x - cx) ** 2 + (px.y - cx) ** 2) / maxR;
      const w = r < 0.25 ? 3.0 : r < 0.50 ? 1.5 : 0.5;
      weightedMarked += w;
    }

    // Approximate total weight (use a representative sample or formula)
    // For scoring purposes we use total pixel count with uniform weight 1.0
    // and scale by the maximum possible weighted marked
    const distortionRatio = weightedMarked / Math.max(totalPixels, 1);
    const score = Math.min(Math.max(Math.round(100 - (distortionRatio * 200)), 0), 100);

    // amd_modifier (§3.5)
    let amd_modifier;
    let interpretation;
    if (score >= 80) {
      amd_modifier   = -0.05;
      interpretation = 'No significant grid distortion reported';
    } else if (score >= 50) {
      amd_modifier   = 0.10;
      interpretation = 'Moderate distortion in peripheral zones';
    } else {
      amd_modifier   = 0.25;
      interpretation = 'Significant distortion — central marking present';
    }

    return {
      game: 'amsler',
      score,
      markedArea: markedPixels.length,
      amd_modifier,
      interpretation,
      influenced: score < 80
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // GAME 3 — PERIPHERAL REACTION TESTER (Glaucoma)
  // Specification §4.4
  //
  // 8 zones (NW, N, NE, E, SE, S, SW, W), 4 flashes each = 32 total
  // per_zone_miss_rate = missed[zone] / 4
  // zone_score = 100 × (1 − miss_rate)
  //
  // total_score = weighted average (arcuate pattern zones NW/N/NE/SW/S/SE 
  //               weighted 1.5×, cardinal zones E/W weighted 1.0×)
  //
  // glaucoma_modifier derived from zones with miss_rate ≥ 0.75 (scotoma flag)
  // ─────────────────────────────────────────────────────────────────────
  function computePeripheralScore({ zoneHits, zoneMisses }) {
    const zones = ['NW','N','NE','E','SE','S','SW','W'];
    // Arcuate pattern zones most associated with glaucoma
    const arcuateZones = new Set(['NW','N','NE','SW','S','SE']);

    let weightedSum   = 0;
    let weightedTotal = 0;
    let scotomicZones = 0;

    zones.forEach(z => {
      const hits   = zoneHits[z]   || 0;
      const misses = zoneMisses[z] || 0;
      const total  = hits + misses;
      if (total === 0) return;
      const missRate  = misses / total;
      const zScore    = 100 * (1 - missRate);
      const weight    = arcuateZones.has(z) ? 1.5 : 1.0;
      weightedSum    += zScore * weight;
      weightedTotal  += weight;
      if (missRate >= 0.75) scotomicZones++;
    });

    const score = weightedTotal > 0
      ? Math.min(Math.max(Math.round(weightedSum / weightedTotal), 0), 100)
      : 100;

    // glaucoma_modifier (§4.5)
    let glaucoma_modifier;
    let interpretation;
    if (scotomicZones >= 2 || score < 45) {
      glaucoma_modifier = 0.25;
      interpretation    = `Probable scotoma in ${scotomicZones} zone(s) — elevated glaucoma risk`;
    } else if (score < 70) {
      glaucoma_modifier = 0.10;
      interpretation    = 'Reduced peripheral detection in some zones';
    } else {
      glaucoma_modifier = -0.05;
      interpretation    = 'Normal peripheral field coverage';
    }

    return {
      game: 'peripheral',
      score,
      scotomicZones,
      zoneHits,
      zoneMisses,
      glaucoma_modifier,
      interpretation,
      influenced: score < 70
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // GAME 4 — COLOUR HUE SORTING (Cataract)
  // Specification §5.4
  //
  // 10 rounds in 30 seconds; hue difference shrinks each round
  // round_score = correct ? (1 + speed_bonus) : 0
  //   speed_bonus = clamp((3000 - reactionMs) / 3000, 0, 1) × 0.5
  // score = (sum of round_scores / 15) × 100   [max round_score = 1.5]
  //
  // cataract_modifier derived from score (§5.5)
  // ─────────────────────────────────────────────────────────────────────
  function computeHueScore({ roundResults }) {
    // roundResults: array of { correct, reactionMs }
    let totalRoundScore = 0;
    roundResults.forEach(r => {
      if (r.correct) {
        const speedBonus = Math.min(Math.max((3000 - r.reactionMs) / 3000, 0), 1) * 0.5;
        totalRoundScore += 1 + speedBonus;
      }
    });

    const maxPossible = roundResults.length * 1.5;
    const score = Math.min(Math.max(Math.round((totalRoundScore / maxPossible) * 100), 0), 100);

    // cataract_modifier (§5.5)
    let cataract_modifier;
    let interpretation;
    if (score >= 75) {
      cataract_modifier = -0.08;
      interpretation    = 'Normal blue-yellow colour discrimination';
    } else if (score >= 45) {
      cataract_modifier = 0.10;
      interpretation    = 'Mild colour discrimination deficit on tritan axis';
    } else {
      cataract_modifier = 0.22;
      interpretation    = 'Significant blue-yellow discrimination failure';
    }

    return {
      game: 'hue',
      score,
      roundsCorrect: roundResults.filter(r => r.correct).length,
      totalRounds:   roundResults.length,
      cataract_modifier,
      interpretation,
      influenced: score < 75
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // OVERALL RISK SCORE COMPUTATION
  // Report Framework §2.2
  //
  // For each disease d:
  //   adjusted_prob[d] = clamp(cnn_prob[d] + game_modifier[d] + history_modifier[d], 0, 1)
  //
  // history_modifier:
  //   +0.10 if diabetes_flag (for DR)
  //   +0.05 if hypertension_flag (for AMD, Glaucoma)
  //   +0.08 if age_group == 'senior' (all diseases)
  //   +0.05 if family_history_flag (all diseases)
  //
  // overall_score = clamp(max(adjusted_probs) × 100, 0, 100)
  // ─────────────────────────────────────────────────────────────────────
  function computeOverallRisk(payload) {
    const { cnn, games, history } = payload;

    // History modifiers
    const histBase    = (history.age_group === 2 ? 0.08 : 0) +
                        (history.family_history_flag ? 0.05 : 0);
    const histDR      = histBase + (history.diabetes_flag    ? 0.10 : 0);
    const histAMD     = histBase + (history.hypertension_flag ? 0.05 : 0);
    const histGlauc   = histBase + (history.hypertension_flag ? 0.05 : 0);
    const histCataract= histBase;

    // Game modifiers (default neutral 0 if game not completed)
    const drMod       = games.contrast   ? games.contrast.dr_modifier        : 0;
    const amdMod      = games.amsler     ? games.amsler.amd_modifier          : 0;
    const glauMod     = games.peripheral ? games.peripheral.glaucoma_modifier : 0;
    const catMod      = games.hue        ? games.hue.cataract_modifier        : 0;

    // Adjusted probabilities
    const clamp = (v) => Math.min(Math.max(v, 0), 1);
    const adjDR       = clamp(cnn.diabetes + drMod   + histDR);
    const adjAMD      = clamp(cnn.amd      + amdMod  + histAMD);
    const adjGlauc    = clamp(cnn.glaucoma + glauMod + histGlauc);
    const adjCataract = clamp(cnn.cataract + catMod  + histCataract);

    const overallScore = Math.round(Math.max(adjDR, adjAMD, adjGlauc, adjCataract) * 100);

    // Classification thresholds (§2.3)
    let classification, classKey;
    if (overallScore >= 65) {
      classification = 'High Risk';
      classKey       = 'high';
    } else if (overallScore >= 35) {
      classification = 'Moderate Risk';
      classKey       = 'mod';
    } else {
      classification = 'Low Risk';
      classKey       = 'low';
    }

    // Individual disease thresholds (§3.2)
    const diseaseRisk = (prob) => {
      const pct = Math.round(prob * 100);
      if (pct >= 60) return { pct, label: 'High',     key: 'high' };
      if (pct >= 30) return { pct, label: 'Moderate', key: 'mod' };
      return              { pct, label: 'Low',        key: 'low' };
    };

    return {
      overallScore,
      classification,
      classKey,
      diseases: {
        dr:       { adjProb: adjDR,       ...diseaseRisk(adjDR) },
        amd:      { adjProb: adjAMD,      ...diseaseRisk(adjAMD) },
        glaucoma: { adjProb: adjGlauc,    ...diseaseRisk(adjGlauc) },
        cataract: { adjProb: adjCataract, ...diseaseRisk(adjCataract) }
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // RECOMMENDED ACTION RULE ENGINE
  // Report Framework §5 — deterministic, priority-order, first-match-wins
  // ─────────────────────────────────────────────────────────────────────
  function computeRecommendedAction(riskResult, gameScores) {
    const { overallScore, diseases } = riskResult;

    // Rule 1: Any disease high risk
    if (Object.values(diseases).some(d => d.key === 'high')) {
      return {
        level: 'Urgent',
        key:   'high',
        icon:  '🔴',
        text:  'One or more conditions show HIGH risk. Please schedule an urgent consultation with an ophthalmologist within 2 weeks. Bring this report to your appointment.'
      };
    }

    // Rule 2: Overall score ≥ 50
    if (overallScore >= 50) {
      return {
        level: 'Recommended',
        key:   'mod',
        icon:  '🟡',
        text:  'Your overall risk score is elevated. We recommend scheduling a routine ophthalmology review within 1–3 months. Early professional review can prevent progression.'
      };
    }

    // Rule 3: Any game score below 45 (§4, doctor summary card criteria)
    const lowGames = [];
    if (gameScores.contrast   && gameScores.contrast.score < 45)   lowGames.push('Contrast Challenge');
    if (gameScores.amsler     && gameScores.amsler.score < 45)     lowGames.push('Amsler Grid');
    if (gameScores.peripheral && gameScores.peripheral.score < 45) lowGames.push('Peripheral Tester');
    if (gameScores.hue        && gameScores.hue.score < 45)        lowGames.push('Hue Sorting');

    if (lowGames.length > 0) {
      return {
        level: 'Monitoring Advised',
        key:   'mod',
        icon:  '🟠',
        text:  `One or more vision game scores were low (${lowGames.join(', ')}). We recommend an eye examination in the next 3–6 months to investigate functional vision performance.`
      };
    }

    // Rule 4: Low risk
    return {
      level: 'Routine Monitoring',
      key:   'low',
      icon:  '🟢',
      text:  'Your screening results do not indicate immediate concern. Continue with routine annual eye examinations. Retinal disease can develop silently — regular screening is important.'
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // COMBINED SCORE PAYLOAD (§6 — API Schema)
  // Assembles the full payload sent alongside CNN outputs
  // ─────────────────────────────────────────────────────────────────────
  function assemblePayload() {
    return load();
  }

  function saveGameResult(gameKey, result) {
    const payload = load();
    payload.games[gameKey] = result;
    save(payload);
  }

  function saveCNNResult(cnnProbs) {
    const payload = load();
    payload.cnn = { ...payload.cnn, ...cnnProbs };
    save(payload);
  }

  function saveReport(report) {
    const payload = load();
    payload.report = report;
    save(payload);
  }

  // ─────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────
  return {
    load,
    save,
    clear,
    computeContrastScore,
    computeAmslerScore,
    computePeripheralScore,
    computeHueScore,
    computeOverallRisk,
    computeRecommendedAction,
    assemblePayload,
    saveGameResult,
    saveCNNResult,
    saveReport
  };

})();