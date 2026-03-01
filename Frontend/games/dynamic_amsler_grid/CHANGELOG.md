# Changelog

All notable changes to the Dynamic Amsler Grid are documented in this file.

## [2.0.0] — 2026-02-28

### RetinaSafe UI & Theme Overhaul

Complete visual redesign from dark glassmorphism to RetinaSafe's accessible, calming medical design system.

---

### 🎨 Design System — `styles.css`

#### Colour System
- **Replaced** entire dark palette (`--bg-dark`, `--primary: #ff4757`, glass variables) with RetinaSafe blue palette (`--blue-50` through `--blue-900`)
- **Added** 4-tier text colour hierarchy: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-light`
- **Added** disease accent colours (`--dr-color`, `--amd-color`, `--glauc-color`, `--cat-color`)
- **Added** status/risk colours per spec: `--risk-low` (#34D399), `--risk-moderate` (#F59E0B), `--risk-high` (#EF4444)
- **Added** warning banner tokens (`--warn-bg`, `--warn-border`, `--warn-text`, `--warn-strong`)
- **Added** spacing/radius tokens: `--radius` (10px), `--radius-lg` (16px), `--radius-xl` (24px)
- **Added** shadow scale: `--shadow-sm`, `--shadow-md`, `--shadow-lg`

#### Typography
- **Replaced** Outfit font with **Lora** (serif, display) and **Source Sans 3** (sans-serif, body)
- **Set** base font size to **18px** (up from browser default 16px) — critical for low-vision users
- **Set** body line-height to **1.75** for improved readability
- **Applied** Lora 700 to all headings (h1–h3), Source Sans 3 to body, labels, and buttons
- **Added** fluid type scale with `clamp()` for h1 and h2
- **Added** eyebrow label utility class (0.75rem, uppercase, letter-spacing 0.12em)

#### Components
- **Body**: White/light-blue page background (`--page-bg: #F8FBFF`), removed dark radial gradients
- **App container**: White card with blue border and `border-radius: 16px`, removed glassmorphism (`backdrop-filter`, glass variables)
- **Instructions box**: Blue-50 background with blue-600 left border (was red with shimmer animation)
- **Settings panel**: Blue-50 background, blue borders, clean density buttons with blue active state
- **Toggle switches**: Blue-100 track → blue-600 active, white thumb. Removed gold/indigo gradients
- **Buttons**: Primary = blue-600 bg + white text. Secondary = transparent + blue-300 border. Removed red glow
- **Results panel**: Blue-50 background with crisp borders. Risk badges use tinted background + dark text for legibility
- **Score cards**: White background with blue borders
- **JSON output**: White background, navy text (was purple on dark glass)
- **Disclaimer banner**: Amber/white (#FFFBEB) with high-contrast brown text. New component
- **Footer**: Clean white with muted text. New component

#### Accessibility
- **Added** global `focus-visible` style: 3px solid blue-500 with 3px offset
- **Added** skip link component (`.skip-link`) for keyboard navigation
- **Added** `prefers-reduced-motion: reduce` media query disabling all animations
- **Removed** `outline: none` on buttons — all interactive elements now have visible focus styles
- **Ensured** minimum font size of 0.75rem (13.5px) across all text

#### Removed
- Ambient animated orbs (`.ambient-orb`, `.orb-1`, `.orb-2`)
- Float animation keyframes
- Shimmer animation on instructions
- Glass-effect `::after` overlay on primary button
- Red glow variables and box-shadows

---

### 🏗️ HTML Structure — `index.html`

#### Semantic HTML & ARIA
- **Wrapped** content in `<main id="main">` landmark
- **Added** `<header>` element around page title
- **Added** `<section>` elements with `aria-labelledby` for instructions, settings, and results
- **Added** `<footer>` landmark with site credit
- **Added** `aria-hidden="true"` to all decorative SVGs and icons
- **Added** `aria-label` on canvas wrapper and settings panel
- **Added** `aria-live="polite"` on timer display for screen reader announcements
- **Added** `role="note"` on medical disclaimer banner

#### Accessibility
- **Added** skip-to-content link as first focusable element
- **Added** unique `id` attributes on all density buttons (`density-coarse`, `density-standard`, `density-fine`)
- **Added** `role="group"` with `aria-labelledby` on density selector

#### SEO
- **Added** `<meta name="description">` tag
- **Updated** `<title>` to "Dynamic Amsler Grid — RetinaSafe"
- **Added** Google Fonts `<link rel="preconnect">` for performance

#### Content
- **Added** medical disclaimer banner with required legal text
- **Removed** ambient orb `<div>` elements

---

### ⚙️ JavaScript — `script.js`

#### Grid Colours
- **Light mode**: Grid lines now use deep navy (`#1E3A5F`), fixation dot uses navy, highlights use blue overlay (`rgba(37, 99, 235, 0.35)`) — replacing red highlights
- **Dark mode**: Grid lines use pale blue (`#93C5FD`), highlights use light blue overlay (`rgba(96, 165, 250, 0.40)`) — replacing red/indigo
- **Removed** aggressive `scale(1.01)` canvas transform on draw interaction

---

### Migration Notes

> **Breaking visual change**: The entire colour palette is different. Any external code referencing CSS variables like `--primary`, `--bg-dark`, or `--glass-*` will need updating to use `--blue-*` equivalents.

---

## [1.1.0] — 2026-02-27

### Feature Expansion — Grid Density, Dark Mode, Timed Mode & Risk Classification

Major feature additions transforming the basic Amsler Grid into a full clinical screening tool.

---

### 🌗 Dark Mode — `styles.css`, `script.js`, `index.html`

- **Added** dark/light grid theme toggle with animated toggle switch
- **Implemented** dark canvas colours: black background (`#0a0a0a`), light grid lines, white fixation dot
- **Added** `.dark-grid` CSS class with indigo glow box-shadows
- **Added** dark-mode-specific canvas frame styling (`.canvas-wrapper.dark-grid::after`)
- **Added** Sun/Moon SVG icons for toggle labels
- **Updated** `drawAmslerGrid()` to use conditional colour palettes based on dark mode state

### 📐 Grid Density Levels — `styles.css`, `script.js`, `index.html`

- **Added** 3 selectable density options: Coarse (10×10), Standard (20×20), Fine (40×40)
- **Implemented** segmented pill button UI (`.density-selector`, `.density-btn`)
- **Grid redraws** dynamically when density changes — painting data clears on switch
- **Added** density icons (▦, ▩, ▣) with sub-labels showing grid dimensions
- **Active state** highlight with blue glow (`rgba(59, 130, 246, 0.15)`)
- **Default** set to Standard (20×20)

### ⏱️ Timed Mode — `styles.css`, `script.js`, `index.html`

- **Added** 30-second countdown timer toggle
- **Implemented** circular SVG ring timer display with animated `stroke-dashoffset`
- **Timer colour transitions**: blue → amber (warning at ≤10s) → red (critical at ≤5s)
- **Auto-submit**: Results automatically calculated when timer expires
- **Manual stop**: Clicking Stop during countdown also auto-submits
- **Response time** tracked and included in JSON output payload
- **Timer resets** on grid clear

### 📊 AMD Risk Classification — `styles.css`, `script.js`, `index.html`

- **Added** 4-tier risk classification system: Low, Moderate, High, Critical
- **Implemented** composite scoring algorithm:
  - Distorted area percentage (35% weight)
  - Foveal proximity risk score with exponential distance decay (65% weight)
- **Added** colour-coded risk badge (pill with icon): green → amber → orange → red
- **Added** horizontal severity gauge with gradient track and animated marker
- **Added** score cards grid: Distorted Area %, Foveal Proximity Risk %, Composite AMD Score /100
- **Added** animated number counting on result display
- **Critical badge** pulses with red glow animation
- **JSON payload** output in formatted `<pre>` block

### 🎨 Settings Panel UI — `styles.css`, `index.html`

- **Added** `.settings-panel` container with grouped setting cards
- **Added** `.setting-row` for side-by-side compact settings
- **Added** `.setting-label` eyebrow-style labels (uppercase, letter-spaced)
- **Added** reusable `.toggle-switch` component with animated thumb (spring easing)
- **Toggle thumb** uses gold gradient (light mode active) → indigo gradient (dark mode active)

### 📱 Responsive

- **Added** mobile stacking for `.setting-row` (column layout below 768px)
- **Added** mobile stacking for `.density-selector`

---

## [1.0.0] — 2026-02-27

### Initial Release — Dynamic Amsler Grid

Core metamorphopsia assessment tool for Age-Related Macular Degeneration (AMD) screening.

---

### 🖼️ Core Application — `index.html`, `styles.css`, `script.js`

#### Canvas Grid
- **Implemented** interactive Amsler Grid on HTML5 Canvas
- **20×20 grid** with central fixation dot and grid lines
- **Drawing system**: Click and drag to "paint" distorted areas on the grid
- **Touch support**: Full touch event handling for mobile devices (`touchstart`, `touchmove`, `touchend`)
- **Coordinate mapping**: Accurate client-to-grid coordinate conversion with DPR scaling
- **Canvas padding**: 12px internal padding with proper clip handling

#### Scoring & Analysis
- **Distorted area** calculation as percentage of total grid cells
- **Foveal proximity score**: Weighted risk based on distance from grid centre (exponential decay)
- **Composite AMD score**: Blended metric (35% area + 65% proximity), capped at 100
- **JSON output**: Structured payload with all metrics for downstream integration

#### Visual Design
- **Dark glassmorphism** theme with animated ambient orbs
- **Glass container**: `backdrop-filter: blur(20px)`, semi-transparent background
- **Gradient heading**: White-to-grey text gradient
- **Instructions panel**: Red-accented left border with shimmer animation
- **Canvas wrapper**: Hover scale effect with glow shadow
- **Buttons**: Red primary CTA with glow, glass secondary button
- **Results panel**: Dark glass card with animated slide-up entrance
- **Font**: Outfit (Google Fonts)

#### Animations
- **fadeUp**: Container entrance animation (0.8s cubic-bezier)
- **slideUpFade**: Results panel entrance with blur effect
- **float**: Ambient background orb movement (20s infinite)
- **shimmer**: Instructions panel light sweep (3s infinite)

#### Responsive
- **Mobile layout**: Adjusted padding, full-width canvas, single-column results grid below 768px

