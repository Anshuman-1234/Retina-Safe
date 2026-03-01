# Changelog — Contrast Discrimination Challenge

## [2.0.2] — 2026-02-28 — Remove Retest Option

Removed the "Retest" button from the Test Complete screen so the challenge is single-attempt only.

### 🏗️ HTML (`index.html`)
- **Removed** `<button id="restartBtn">Retest</button>` from the game-over overlay.

### ⚡ JavaScript (`script.js`)
- **Removed** `restartBtn` DOM reference and its `click → initGame` event listener.

---

## [2.0.1] — 2026-02-28 — Test Complete Panel Size Fix

The "Test Complete" panel overflowed the viewport at 100% browser zoom. Compacted all vertical spacing so the entire panel (heading, results, disclaimer, Retest button) fits comfortably without scrolling.

### 🎨 CSS (`style.css`)
- **Reduced** glass panel padding from `2.75rem 3.5rem` → `2rem 2.75rem` and max-width from `680px` → `580px`.
- **Shrunk** heading font-size max from `2.1rem` → `1.8rem`, margin-bottom `1rem` → `0.75rem`.
- **Tightened** body text margin-bottom from `2rem` → `1.5rem`.
- **Compacted** results container: padding `1.75rem` → `1.25rem 1.5rem`, row spacing `0.6rem` → `0.4rem`, min-width `340px` → `300px`.
- **Reduced** disclaimer padding and font-size (`0.82rem` → `0.78rem`), margin-top `1.5rem` → `1rem`.
- **Added** `overflow-y: auto` and `padding: 1.5rem 0` on overlay as a safety net for small viewports.

### 🏗️ HTML (`index.html`)
- **Removed** `<br>` spacer between disclaimer and Retest button.
- **Added** `margin-top: 0.75rem` on Retest button for controlled spacing.

---

## [2.0.0] — 2026-02-28 — RetinaSafe Design System Overhaul

Complete UI/theme rewrite to align with the RetinaSafe Design Philosophy.  
All medical game logic (contrast convergence, shape morphing, scoring) is **unchanged**.

---

### 🎨 CSS (`style.css`) — Full Rewrite

#### Design Tokens
- **Added** complete RetinaSafe colour palette as CSS custom properties (`--blue-900` through `--blue-50`, `--page-bg`, `--white`).
- **Added** text colour variables: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-light`.
- **Added** status/risk colour variables: `--status-low`, `--status-moderate`, `--status-high` with tinted background variants.
- **Added** warning/disclaimer colour variables: `--warning-bg`, `--warning-border`, `--warning-text`.
- **Added** shadow tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) and border radius tokens (`--radius`, `--radius-lg`, `--radius-xl`).
- **Preserved** `--bg-color` and `--target-color` (medical contrast logic — not altered).

#### Typography
- **Replaced** Outfit with **Lora** (display/headings) and **Source Sans 3** (body/buttons).
- **Changed** base font size from browser default (16px) to **18px** for low-vision accessibility.
- **Set** body `line-height: 1.75` and heading `line-height: 1.25`.
- **Applied** `clamp()` fluid scaling to panel headings.

#### Overlays & Panels
- **Replaced** dark glassmorphism (`rgba(20,20,25,0.65)`) with clean **white card** (`#FFFFFF`) + `--blue-200` border.
- **Changed** overlay scrim from black to **navy tint** (`rgba(30,58,95,0.35)`).
- **Updated** headings to `--blue-900` navy instead of gradient-clip white.
- **Updated** body text to `--text-secondary` instead of white.

#### Buttons
- **Replaced** cyan gradient with solid `--blue-600` + white text.
- **Changed** border-radius from `50px` (pill) to `10px` (consistent with cards).
- **Removed** uppercase text-transform.
- **Added** `translateY(-1px)` hover lift + deeper shadow.
- **Added** explicit `focus-visible` ring: `3px solid --blue-400 offset 3px`.

#### HUD Pills
- **Replaced** dark glass background with semi-transparent white (`rgba(255,255,255,0.92)`).
- **Changed** border to `--blue-200` instead of `rgba(255,255,255,0.1)`.
- **Updated** text colour from white to `--text-primary` navy.
- **Adjusted** padding and gap for the new typography scale.

#### Results Screen
- **Changed** background from translucent black to `--blue-50` with `--blue-200` border.
- **Updated** row dividers to `--blue-100` instead of white-alpha.
- **Styled** status badges as coloured pills with tinted backgrounds (green / amber / red).
- **Added** `.result-score` class for blue-accented score value.
- **Added** `.result-footnote` class for dev-console note.

#### Score Pill
- **Replaced** gold gradient accent with `--blue-300` border + subtle blue shadow ring.

#### Miss Flash
- **Added** `.miss-flash` class using `box-shadow: inset` red border glow (replaces background colour change that would interfere with medical grey).

#### Accessibility
- **Added** `.skip-link` styles (off-screen until focused).
- **Added** global `*:focus-visible` ring: `3px solid --blue-500 offset 3px`.
- **Added** `@media (prefers-reduced-motion: reduce)` — disables all animations and transitions.

#### Responsive
- **Added** responsive breakpoint at `680px`: stacked HUD, reduced panel padding, full-width results.

---

### 🏗️ HTML (`index.html`) — Semantic Restructure

#### Fonts & Meta
- **Replaced** Google Fonts load from Outfit to **Lora + Source Sans 3** with `preconnect`.
- **Added** `<meta name="description">` with medical screening context.
- **Updated** `<title>` to "Contrast Discrimination Challenge — RetinaSafe".

#### Semantic Landmarks
- **Wrapped** all content in `<main id="main">`.
- **Added** `<a href="#main" class="skip-link">` as first focusable element.

#### ARIA Attributes
- **Added** `aria-live="polite"` on HUD container for screen-reader updates.
- **Added** `aria-hidden="true"` on decorative emoji spans (❤️, 🏆, ⏱️).
- **Added** `aria-label="Click the target shape"` and `role="button"` on target div.
- **Added** `aria-hidden="true"` on game area (decorative click receptor).

#### Medical Disclaimers
- **Added** `role="note"` disclaimer on start screen: screening-only statement, no data storage.
- **Added** `role="note"` disclaimer on results screen: not a medical diagnosis.

---

### ⚡ JavaScript (`script.js`)

#### Miss Feedback
- **Replaced** `document.body.style.backgroundColor = "rgb(180, 80, 80)"` with CSS class toggle (`miss-flash`) to preserve the medical grey game background.

#### Results Rendering
- **Removed** inline `style` attributes from result heading and score value.
- **Added** `.result-score` CSS class for score styling.
- **Added** `.result-footnote` CSS class for dev-console note.
- **Status badges** now render as pill elements via CSS classes (`.status-normal`, `.status-elevated`, `.status-high`) with tinted backgrounds.

#### HUD Updates
- **Added** `aria-hidden="true"` to all decorative emoji in dynamically rendered HUD HTML.

#### Preserved (No Changes)
- Contrast convergence formula (Phase 1 + Phase 2).
- Shape morphing cycle (circle → rounded-square → diamond → ellipse).
- Scoring algorithm (`level × 10`).
- Risk multiplier thresholds (`>30` → High, `>15` → Elevated, else Normal).
- Timer, lives, and throttling logic.
- Console export of `scoreObject`.

---
---

## [1.1.0] — 2026-02-27 — Progressive Fading & Score System

Added scoring, level display, shape morphing, and a two-phase fading system to make the target progressively harder to see.

---

### ⚡ JavaScript (`script.js`)

#### Score System
- **Added** `score` state variable (starts at 0).
- **Added** scoring formula: `score += level × 10` per successful click — harder levels reward more points.
- **Added** score display in HUD pill with 🏆 icon.
- **Added** score in end-screen results readout.

#### Two-Phase Progressive Fading
- **Replaced** original logarithmic contrast formula with a linear two-phase system:
  - **Phase 1 — Color convergence**: RGB difference drops linearly from 50 → 0 over 25 levels (~2 units/level).
  - **Phase 2 — Opacity fade**: Starting at level 10, opacity decreases from 1.0 → 0.0 by level 25.
- By level 25, the target has **identical colour AND zero opacity** — completely invisible.

#### Shape Morphing
- **Added** shape rotation every 5 levels: circle → rounded-square → diamond → ellipse.
- **Added** CSS classes `.shape-circle`, `.shape-rounded-square`, `.shape-diamond`, `.shape-ellipse`.

#### HUD Micro-Animations
- **Added** level-up pulse animation on the level pill when it increments.
- **Added** score pop animation on the score pill when points are awarded.

---

### 🏗️ HTML (`index.html`)

- **Added** score HUD pill (`🏆`) between lives and level displays.

---

### 🎨 CSS (`style.css`)

- **Added** shape morphing CSS classes with distinct border-radius and dimensions.
- **Added** diamond-specific `popInDiamond` keyframe (includes `rotate(45deg)`).
- **Added** `.hud-score` golden accent styling (gradient background, gold border glow).
- **Added** `levelPulse` and `scorePop` keyframe animations.

---
---

## [1.0.0] — 2026-02-27 — Initial Release

First production-ready build of the Contrast Discrimination Challenge — a clinical contrast-sensitivity screening game.

---

### 🏗️ HTML (`index.html`)

- **Created** single-page HTML structure with Outfit font from Google Fonts.
- **Added** fullscreen game area (`#gameArea`) for miss-click detection.
- **Added** clickable target element (`#target`) with circle shape.
- **Added** HUD with lives (❤️), level, and timer (⏱️) pills.
- **Added** start screen overlay with title, instructions, and "Begin Test" button.
- **Added** game-over overlay with dynamic results container and "Retest" button.

---

### 🎨 CSS (`style.css`)

- **Created** dark glassmorphism theme:
  - Glass panels: `rgba(20,20,25,0.65)` background with `backdrop-filter: blur(12px)`.
  - Cyan accent gradient (`#00f2fe` → `#4facfe`) for buttons.
  - White text on dark backgrounds.
- **Defined** CSS custom properties for game-core colours (`--bg-color: rgb(100,100,100)`, `--target-color: rgb(150,150,150)`).
- **Added** overlay transitions (opacity + visibility) with hidden state.
- **Added** glass-panel entrance animation (scale + translateY).
- **Added** gradient text effect on headings (`background-clip: text`).
- **Added** pill-shaped buttons (50px border-radius) with hover lift + glow.
- **Added** HUD pill styling with glass background and shadow.
- **Added** `popIn` keyframe animation for target appearance.
- **Added** results container with row layout and status colour classes (`status-normal`, `status-elevated`, `status-high`).
- **Set** `user-select: none` and `overflow: hidden` on body for distraction-free gameplay.

---

### ⚡ JavaScript (`script.js`)

- **Created** core game loop: `initGame()` → `updateTimer()` → `endGame()`.
- **Implemented** contrast convergence: target starts at `rgb(150,150,150)` on `rgb(100,100,100)` background, difference shrinks each level.
- **Added** 30-second countdown timer with `setInterval`.
- **Added** 3-life system — each miss-click deducts one life.
- **Added** random target positioning within viewport bounds (5%–90%).
- **Added** click throttling (350ms) to prevent accidental double-clicks.
- **Added** miss-click visual feedback (red background flash).
- **Added** risk classification engine:
  - `>30` Δ RGB → High Risk (×3.0 multiplier).
  - `>15` Δ RGB → Elevated Risk (×1.8 multiplier).
  - Otherwise → Normal (×1.0 multiplier).
- **Added** `scoreObject` export to console on game end for parent application integration.
- **Added** polished results readout with score, levels cleared, lowest threshold, diagnostic multiplier, and predicted status.
