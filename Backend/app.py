from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import os
import io
from PIL import Image

app = Flask(__name__)
CORS(app)  # Allow frontend to access the API

# Model paths configuration
BASE_PATH = os.path.dirname(os.path.abspath(__file__))
MODEL_CONFIG = {
    'amd': os.path.join(BASE_PATH, 'AMD', 'models', 'yes_no_classifier.keras'),
    'cataract': os.path.join(BASE_PATH, 'Cataract', 'models', 'yes_no_classifier.keras'),
    'diabetes': os.path.join(BASE_PATH, 'Diabetes', 'models', 'yes_no_classifier.keras'),
    'glaucoma': os.path.join(BASE_PATH, 'Glaucoma', 'models', 'yes_no_classifier.keras'),
    'hypertensive': os.path.join(BASE_PATH, 'Hypertensive_Retinopathy', 'models', 'yes_no_classifier.keras'),
    'normal': os.path.join(BASE_PATH, 'Normal', 'models', 'yes_no_classifier.keras')
}

# Pre-load models for performance
models = {}
print("Loading models... This may take a moment.")
for key, path in MODEL_CONFIG.items():
    if os.path.exists(path):
        try:
            models[key] = tf.keras.models.load_model(path)
            print(f"Loaded {key} model from {path}")
        except Exception as e:
            print(f"Error loading {key} model: {e}")
    else:
        print(f"Warning: Model not found for {key} at {path}")

def preprocess_image(img_bytes):
    # Load image from bytes
    img = Image.open(io.BytesIO(img_bytes))
    # Convert to RGB if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')
    # Resize to model input size
    img = img.resize((224, 224))
    # Convert to array
    img_array = image.img_to_array(img)
    # Scale to [-1, 1] as MobileNetV2 expects
    img_array = (img_array / 127.5) - 1.0
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    img_bytes = file.read()
    
    try:
        img_array = preprocess_image(img_bytes)
        results = []
        
        # Run prediction for each model
        for key in MODEL_CONFIG.keys():
            if key in models:
                prediction = models[key].predict(img_array, verbose=0)
                # For yes/no classifier, usually index 0 is high score for positive
                score = float(prediction[0][0])
                results.append({
                    'id': key,
                    'score': score
                })
            else:
                results.append({
                    'id': key,
                    'score': 0.0,
                    'error': 'Model not loaded'
                })
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'models_loaded': list(models.keys())
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
