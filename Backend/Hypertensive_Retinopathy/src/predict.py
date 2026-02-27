import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import os

def run_prediction(img_path):
    # Match the new .keras extension
    model_path = "../models/yes_no_classifier.keras"
    
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}. Run train.py first!")
        return

    # Load the modern Keras model
    model = tf.keras.models.load_model(model_path)
    
    # 1. Load image
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    
    # 2. Manual Preprocessing (Scale to [-1, 1])
    img_array = (img_array / 127.5) - 1.0
    img_array = np.expand_dims(img_array, axis=0)
    
    # 3. Predict
    prediction = model.predict(img_array)
    
    # 4. Show Result
    result = "YES" if prediction[0][0] > 0.5 else "NO"
    score = prediction[0][0] if result == "YES" else (1 - prediction[0][0])
    
    print("\n" + "="*30)
    print(f"FILE: {os.path.basename(img_path)}")
    print(f"PREDICTION: {result}")
    print(f"CONFIDENCE: {score*100:.2f}%")
    print("="*30 + "\n")

if __name__ == "__main__":
    # Test with one of your known images
    test_file = "../data/raw/yes/Hypertensive Retinopathy120_right_0_9544.jpeg"
    
    if os.path.exists(test_file):
        run_prediction(test_file)
    else:
        print(f"Error: Image {test_file} not found!")