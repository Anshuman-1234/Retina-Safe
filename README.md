# 👁️ RetinaSafe — AI-Powered Retinal Screening & Risk Stratification

**RetinaSafe** is a premium, end-to-end medical screening platform designed to detect and stratify the risk of major retinal diseases. By fusing **Deep Learning (Computer Vision)** with **Specialized Vision Games**, it provides a unique "Objective + Functional" assessment of eye health.

---

## 🚀 Key Features

### 🧠 Multi-Disease AI Hub
Simultaneous analysis for **AMD, Cataract, Diabetic Retinopathy, Glaucoma, and Hypertensive Retinopathy** using optimized MobileNetV2-based Keras models.

### 🎮 Functional Vision Testing
Four interactive games designed to detect clinical visual biomarkers:
- **Central Field Distortion**: A dynamic Amsler Grid for AMD/Macular monitoring.
- **Contrast Sensitivity**: A low-contrast discrimination challenge.
- **Peripheral Awareness**: Reaction speed testing across the visual field (Glaucoma markers).
- **Hue Sorting**: Blue-yellow color discrimination (Tritanomaly assessment).

### 🌓 Advanced Theme & Accessibility
- **Dark Mode**: Integrated system-wide for reduced eye strain.
- **Colorblind Simulation**: Real-time SVG-filtered views for Protanopia, Deuteranopia, Tritanopia, and Achromatopsia to assist clinicians and patients.

### 📱 Full Mobile Optimization
- **Responsive Audit**: All game modules and the core dashboard have been audited and optimized for mobile devices (375px+).
- **Touch Interaction**: Precision-calibrated input for mobile web browsers.

### 📊 Clinical Fusion Engine
Proprietary logic that adjusts AI predictions based on real-time functional performance, generating professional **PDF Reports** with **Risk Stratification** (Low → Critical).

---

## 📁 Project Structure

```text
Retina_Safe/
├── Backend/
│   ├── app.py                  # Flask API & Model Inference Hub
│   ├── requirements.txt        # Backend dependencies
│   └── [Disease_Models]/       # 6 Disease-specific Keras models
└── Frontend/
    ├── screening.html          # Core 4-step workflow UI
    ├── dashboard.html          # Patient health tracking dashboard
    ├── theme.js                # Global theme & accessibility engine
    ├── Api bridge.js           # API Connector & Fusion Logic
    ├── session.js              # State management & LocalStorage
    ├── screening.js            # Workflow controller
    └── [Game_Modules].html/.js # Specialized vision assessment games
```

---

## 🛠️ Getting Started

### **1. Setup the Backend (AI Inference Server)**
```powershell
cd Backend
pip install -r requirements.txt
python app.py
```
*Port 5000: Handles `/predict` and `/health` endpoints.*

### **2. Setup the Frontend (Web Dashboard)**
```powershell
cd Frontend
# Use any static server (Live Server, Python HTTP, etc.)
python -m http.server 8080
```
*Access via `http://localhost:8080`*

---

## ☁️ Deployment

RetinaSafe is configured for monorepo deployment on **Vercel**:
-   `/api/*` targets the Python/Flask backend.
-   Static routes serve the `Frontend` directory.
-   Automatic builds handle Python dependencies via `requirements.txt`.

---

## 🧪 Scoring & Risk Calculation

The AI's raw probability ($P_{model}$) is adjusted by functional vision performance:

$$Risk_{final} = P_{model} \times \left( 1.3 - \frac{\text{Game Score}}{100} \times 0.5 \right)$$

- **Positive Reinforcement**: High game scores reduce AI risk prediction by up to 20%.
- **Clinical Buffer**: Poor performance acts as a confirmation of high risk, increasing the score by up to 30%.

---

## ⚠️ Medical Disclaimer

> [!WARNING]
> RetinaSafe is a **screening and risk stratification tool**. It is NOT a medical device or a diagnostic replacement. All results are preliminary and MUST be reviewed by a qualified ophthalmologist.

---

© 2026 RetinaSafe · Built with ❤️ for better eye health.
