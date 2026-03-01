import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import os

def batch_predict(folder_path):
    model_path = "../models/yes_no_classifier.keras"
    if not os.path.exists(model_path):
        print("Model not found! Run train.py first.")
        return

    model = tf.keras.models.load_model(model_path)
    
    # Get all image files in the test folder
    valid_extensions = ('.jpg', '.jpeg', '.png','.jfif')
    images = [f for f in os.listdir(folder_path) if f.lower().endswith(valid_extensions)]
    
    print(f"\n{'FILENAME':<20} | {'RESULT':<10} | {'CONFIDENCE'}")
    print("-" * 50)

    for img_name in images:
        img_path = os.path.join(folder_path, img_name)
        
        # Load and preprocess
        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = (img_array / 127.5) - 1.0 # Manual scaling for MobileNetV2
        img_array = np.expand_dims(img_array, axis=0)
        
        # Prediction
        prediction = model.predict(img_array, verbose=0)[0][0]
        result = "YES" if prediction > 0.5 else "NO"
        confidence = prediction if result == "YES" else (1 - prediction)
        
        print(f"{img_name:<20} | {result:<10} | {confidence*100:.2f}%")

if __name__ == "__main__":
    # Point this to your new test folder
    test_folder = "../data/raw/test_samples" 
    if os.path.exists(test_folder):
        batch_predict(test_folder)
    else:
        print(f"Folder not found: {test_folder}")