from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import io
from PIL import Image

import tensorflow as tf
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
MODEL_CONFIG = {
    'amd': os.path.join(BASE_PATH, 'AMD', 'models', 'yes_no_classifier.keras'),
    'cataract': os.path.join(BASE_PATH, 'Cataract', 'models', 'yes_no_classifier.keras'),
    'diabetes': os.path.join(BASE_PATH, 'Diabetes', 'models', 'yes_no_classifier.keras'),
    'glaucoma': os.path.join(BASE_PATH, 'Glaucoma', 'models', 'yes_no_classifier.keras'),
    'hypertensive': os.path.join(BASE_PATH, 'Hypertensive_Retinopathy', 'models', 'yes_no_classifier.keras'),
    'normal': os.path.join(BASE_PATH, 'Normal', 'models', 'yes_no_classifier.keras')
}

# Create uploads directory and cleanup old files
UPLOAD_FOLDER = os.path.join(BASE_PATH, 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def cleanup_old_uploads():
    import time
    now = time.time()
    for f in os.listdir(UPLOAD_FOLDER):
        f_path = os.path.join(UPLOAD_FOLDER, f)
        if os.stat(f_path).st_mtime < now - 3600: # 1 hour
            try:
                os.remove(f_path)
            except: pass

# Pre-load Keras Models
models = {}
print("Loading Keras models...")
for key, path in MODEL_CONFIG.items():
    if os.path.exists(path):
        try:
            model = load_model(path)
            models[key] = model
            print(f"Loaded {key} Keras model.")
        except Exception as e:
            print(f"Error loading {key} from {path}: {e}")
    else:
        print(f"Warning: Model file not found for {key} at {path}")

def preprocess_image(img_bytes):
    img = Image.open(io.BytesIO(img_bytes))
    if img.mode != 'RGB':
        img = img.convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32)
    img_array = (img_array / 127.5) - 1.0  # Normalize to [-1, 1]
    return np.expand_dims(img_array, axis=0)

@app.route('/api/predict', methods=['POST'])
def predict():
    cleanup_old_uploads()
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    
    # Save image with a unique name
    import uuid
    filename = f"{uuid.uuid4()}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    img_bytes = file.read()
    with open(filepath, 'wb') as f:
        f.write(img_bytes)
    
    try:
        import time
        start_time = time.time()
        
        input_data = preprocess_image(img_bytes)
        results = []
        
        for key, model in models.items():
            m_start = time.time()
            
            # Using Keras model.predict
            prediction = model.predict(input_data, verbose=0)
            score = float(prediction[0][0])
            results.append({'id': key, 'score': score})
            print(f"Model {key} took {time.time() - m_start:.3f}s")
            
        print(f"Total prediction time: {time.time() - start_time:.3f}s")
        return jsonify({
            'results': results,
            'image_url': f"/api/uploads/{filename}"
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'models_loaded': list(models.keys())
    })

@app.route('/api/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    from flask import send_from_directory
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
