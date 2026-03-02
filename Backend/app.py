from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import io
from PIL import Image

# Use ai-edge-litert (modern TFLite successor)
try:
    import ai_edge_litert.interpreter as tflite
except ImportError:
    try:
        import tflite_runtime.interpreter as tflite
    except ImportError:
        import tensorflow.lite as tflite

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
MODEL_CONFIG = {
    'amd': os.path.join(BASE_PATH, 'AMD', 'models', 'yes_no_classifier.tflite'),
    'cataract': os.path.join(BASE_PATH, 'Cataract', 'models', 'yes_no_classifier.tflite'),
    'diabetes': os.path.join(BASE_PATH, 'Diabetes', 'models', 'yes_no_classifier.tflite'),
    'glaucoma': os.path.join(BASE_PATH, 'Glaucoma', 'models', 'yes_no_classifier.tflite'),
    'hypertensive': os.path.join(BASE_PATH, 'Hypertensive_Retinopathy', 'models', 'yes_no_classifier.tflite'),
    'normal': os.path.join(BASE_PATH, 'Normal', 'models', 'yes_no_classifier.tflite')
}

# Pre-load TFLite Interpreters
interpreters = {}
print("Loading TFLite models...")
for key, path in MODEL_CONFIG.items():
    if os.path.exists(path):
        try:
            interpreter = tflite.Interpreter(model_path=path)
            interpreter.allocate_tensors()
            interpreters[key] = {
                'interpreter': interpreter,
                'input_details': interpreter.get_input_details(),
                'output_details': interpreter.get_output_details()
            }
            print(f"Loaded {key} TFLite model.")
        except Exception as e:
            print(f"Error loading {key}: {e}")

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
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    img_bytes = file.read()
    
    try:
        import time
        start_time = time.time()
        
        input_data = preprocess_image(img_bytes)
        results = []
        
        for key, model_info in interpreters.items():
            m_start = time.time()
            interpreter = model_info['interpreter']
            input_details = model_info['input_details']
            output_details = model_info['output_details']
            
            interpreter.set_tensor(input_details[0]['index'], input_data)
            interpreter.invoke()
            
            prediction = interpreter.get_tensor(output_details[0]['index'])
            score = float(prediction[0][0])
            results.append({'id': key, 'score': score})
            print(f"Model {key} took {time.time() - m_start:.3f}s")
            
        print(f"Total prediction time: {time.time() - start_time:.3f}s")
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'models_loaded': list(interpreters.keys())
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
