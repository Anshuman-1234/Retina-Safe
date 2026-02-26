import tensorflow as tf
from tensorflow.keras import layers, models
import os

DATA_DIR = "../data/raw" 
MODEL_SAVE_PATH = "../models/yes_no_classifier.keras" 
IMG_SIZE = (224, 224)
BATCH_SIZE = 32

# 1. Load Dataset
train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset="training", seed=123,
    image_size=IMG_SIZE, batch_size=BATCH_SIZE)

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset="validation", seed=123,
    image_size=IMG_SIZE, batch_size=BATCH_SIZE)

rescale_layer = layers.Rescaling(1./127.5, offset=-1)
train_ds = train_ds.map(lambda x, y: (rescale_layer(x), y))
val_ds = val_ds.map(lambda x, y: (rescale_layer(x), y))

# 2. Build Model
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3), include_top=False, weights='imagenet')
base_model.trainable = False

model = models.Sequential([
    layers.Input(shape=(224, 224, 3)),
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2),
    layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# 3. Train
print("Starting training...")
model.fit(train_ds, validation_data=val_ds, epochs=5)

# 4. Save
if not os.path.exists("../models"): os.makedirs("../models")
model.save(MODEL_SAVE_PATH)
print(f"Success! Model saved to {MODEL_SAVE_PATH}")