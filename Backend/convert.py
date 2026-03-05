import os
import tensorflow as tf

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
MODEL_CONFIG = {
    'amd': os.path.join(BASE_PATH, 'AMD', 'models', 'yes_no_classifier.keras'),
    'cataract': os.path.join(BASE_PATH, 'Cataract', 'models', 'yes_no_classifier.keras'),
    'diabetes': os.path.join(BASE_PATH, 'Diabetes', 'models', 'yes_no_classifier.keras'),
    'glaucoma': os.path.join(BASE_PATH, 'Glaucoma', 'models', 'yes_no_classifier.keras'),
    'hypertensive': os.path.join(BASE_PATH, 'Hypertensive_Retinopathy', 'models', 'yes_no_classifier.keras'),
    'normal': os.path.join(BASE_PATH, 'Normal', 'models', 'yes_no_classifier.keras')
}

for key, keras_path in MODEL_CONFIG.items():
    if not os.path.exists(keras_path):
        print(f"Skipping {keras_path}, not found.")
        continue

    print(f"Loading {keras_path}...")
    model = tf.keras.models.load_model(keras_path)
    
    # Convert to tflite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    
    # Save the model
    tflite_path = keras_path.replace('.keras', '.tflite')
    with open(tflite_path, 'wb') as f:
        f.write(tflite_model)
    print(f"Saved {tflite_path} ({len(tflite_model)} bytes = {len(tflite_model)/(1024*1024):.2f} MB)")

