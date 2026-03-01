# 👁️ Retina Safe

**Retina Safe** is a cutting-edge, AI-powered medical screening application designed to detect various retinal diseases from fundus images. Using advanced Deep Learning models (MobileNetV2), it provides instant analysis for 6 major eye conditions with professional PDF report generation.

---

## ✨ Key Features

- **🧠 Multi-Disease AI Analysis**: Simultaneously analyzes images for:
  - Age-Related Macular Degeneration (AMD)
  - Cataract
  - Diabetic Retinopathy
  - Glaucoma
  - Hypertensive Retinopathy
  - Normal (Healthy) Eye Health
- **📸 Real-time Capture & Upload**: Supports high-resolution image uploads or real-time camera capture.
- **📊 Interactive Dashboard**: Visualizes confidence scores for each condition with animated progress bars.
- **📄 Professional PDF Reports**: Generates downloadable clinical-style reports including patient data, the analyzed image, and AI findings.
- **🎨 Premium Dark UI**: Modern glassmorphism interface with smooth animations and responsive design.

---

## 🛠️ Technology Stack

### **Frontend**
- **Structure**: Semantic HTML5
- **Styling**: Vanilla CSS (Modern Design System, Glassmorphism)
- **Logic**: Vanilla JavaScript (ES6+)
- **Reporting**: jsPDF

### **Backend (AI Hub)**
- **Framework**: Python 3.x, Flask
- **AI/ML**: TensorFlow 2.x, Keras
- **Image Processing**: Pillow (PIL), NumPy
- **Security**: Flask-CORS

---

## 📁 Project Structure

```text
Retina_Safe/
├── Backend/
│   ├── app.py              # Main Flask API Hub
│   ├── requirements.txt    # Python dependencies
│   └── [Disease_Name]/     # Individual model directories
│       └── models/         # Trained .keras files
└── Frontend/
    ├── index.html          # Web UI Structure
    ├── styles.css          # Design System
    └── app.js              # Frontend logic & API integration
```

---

## 🚀 Getting Started

### **1. Prerequisites**
Ensure you have Python 3.8+ installed on your system.

### **2. Setup the Backend (AI Server)**
```powershell
cd Backend
pip install -r requirements.txt
python app.py
```
*The server will start at `http://localhost:5000`*

### **3. Setup the Frontend (Web UI)**
```powershell
cd Frontend
python -m http.server 8080
```
*Access the application at `http://localhost:8080`*

---

## 🔬 How to Use

1. **Launch**: Start both servers and open the browser.
2. **Input**: Either drag-and-drop a fundus image (JPG/PNG) or use the **"Use Camera"** feature to capture one.
3. **Analyze**: Click the **"Analyze"** button. The frontend will communicate with the AI models.
4. **Review**: Check the results in the sidebar. The model with the highest confidence will be highlighted.
5. **Export**: Click **"Download PDF Report"**, enter patient details, and save your results.

---

## ⚠️ Medical Disclaimer

> [!WARNING]
> This application is intended for **screening and educational purposes only**. It NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified ophthalmologist or healthcare provider with any questions you may have regarding a medical condition.

---

## 📄 License & Credits
© 2026 Retina Safe Team. Built with ❤️ for better eye health.
