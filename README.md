# 👁️ RetinaSafe — AI-Powered Retinal Screening & Risk Stratification

**RetinaSafe** is a premium, end-to-end medical screening platform designed to detect and stratify the risk of major retinal diseases. By fusing **Deep Learning (Computer Vision)** with **Specialized Vision Games**, it provides a unique "Objective + Functional" assessment of eye health.

---

## ✨ Key Features

- **🧠 Multi-Disease AI Hub**: Simultaneous analysis for **AMD, Cataract, Diabetic Retinopathy, Glaucoma, and Hypertensive Retinopathy** using MobileNetV2-based Keras models.
- **🎮 Functional Vision Testing**: Four interactive games designed to detect clinical visual biomarkers:
  - Central field distortion (Amsler Grid)
  - Contrast sensitivity (Contrast Discrimination)
  - Peripheral awareness (Peripheral Reaction)
  - Blue-yellow color discrimination (Hue Sorting)
- **📊 Risk Fusion Engine**: Proprietary logic that adjusts AI predictions based on real-time vision performance.
- **📄 Clinical Report Generation**: Professional PDF reports generated via `jsPDF`, including risk levels and recommended actions.
- **� Healthcare Connectivity**: One-click redirection to find the nearest Eye Hospitals via Google Maps integration.
- **🎨 Premium Experience**: A high-end user interface featuring **Glassmorphism**, smooth micro-animations, and a fully responsive design.

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
    ├── Api bridge.js           # API Connector & Fusion Logic
    ├── session.js              # State management & LocalStorage persistence
    ├── screening.js            # Workflow controller
    ├── Game collector.js       # Global result collector for vision games
    └── [Game_Modules].html/js  # Specialized vision assessment games
```

---

## 🚀 Getting Started

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

## 🌩️ Deployment to Vercel

RetinaSafe is configured for seamless monorepo deployment on **Vercel**:

1.  **Project Settings**: Connect your repository to Vercel.
2.  **Configuration**: The root `vercel.json` handles routing:
    -   `/api/*` targets the Python/Flask backend.
    -   All other routes serve the static `Frontend` directory.
3.  **Automatic Builds**: Vercel will install the Python dependencies from `Backend/requirements.txt` and serve the site globally.

## 🔬 The 4-Step Screening Workflow

1.  **Medical History**: Patient provides baseline information (age, gender, existing conditions).
2.  **Fundus Analysis**: High-resolution retinal image upload. Your AI models analyze the image for objective disease markers.
3.  **Vision Games**: Four specialized games test how the patient *actually sees*. Results are collected and scored out of 100.
4.  **Integrated Report**: The system fuses AI probabilities with game scores to generate a final risk classification (Low → Critical).

---

## 🧬 Scoring & Risk Calculation

RetinaSafe uses a **Multi-Modal Risk Stratification** approach:

### **Fusion Algorithm**
The AI's raw probability ($P_{model}$) is adjusted by the patient's functional vision performance:

$$Risk_{final} = P_{model} \times \left( 1.3 - \frac{\text{Game Score}}{100} \times 0.5 \right)$$

- **Positive Reinforcement**: A perfect game score (100) reduces AI risk prediction by **20%**.
- **Clinical Buffer**: Poor game performance (0 score) increases AI risk prediction by **30%**, acting as a confirmation of high risk.

---

## 🏥 Actionable Insights
After screening, the system provides:
- **Risk Score (0-100)**: A unified "Eye Health Index".
- **Dynamic Recommendations**: From "Routine Screening" to "Urgent Consultation".
- **Nearby Care**: Integrated Google Maps link for Govt Eye Hospitals.

---

## ⚠️ Medical Disclaimer

> [!WARNING]
> RetinaSafe is a **screening and risk stratification tool**. It is NOT a medical device or a diagnostic replacement. All results are preliminary and MUST be reviewed by a qualified ophthalmologist before any clinical action is taken.

---

© 2026 RetinaSafe · Built with ❤️ for better eye health.
