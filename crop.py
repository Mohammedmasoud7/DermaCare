from flask import Flask, request, jsonify, render_template
from joblib import load
import os
import json

app = Flask(__name__)

# Load your model
model = load('model/RandomForest.joblib')

# Load crop descriptions
with open('model/crop_descriptions.json') as f:
    crop_descriptions = json.load(f)

# Route for crop recommendation
@app.route('/')
def index():
    return render_template('crop.html')  # Renders the crop.html template

# Predict route
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Parse incoming JSON data
        data = request.get_json()

        # Existing parameters
        N = data.get('N')
        P = data.get('P')
        K = data.get('K')
        temperature = data.get('temperature')
        humidity = data.get('humidity')
        ph = data.get('ph')
        rainfall = data.get('rainfall')

        # Convert input to the model's expected format
        features = [[N, P, K, temperature, humidity, ph, rainfall]]

        # Get model predictions
        predictions = model.predict_proba(features)[0]

        # Get top 5 crop predictions
        top_crops = sorted(zip(model.classes_, predictions), key=lambda x: x[1], reverse=True)[:5]

        # Prepare response with images and descriptions
        response = []
        for crop, prob in top_crops:
            crop_data = {
                "crop": crop,
                "probability": round(prob * 100, 2),
                "image_path": f"static/images/{crop}.png",  # Image for crop
                "description": crop_descriptions.get(crop, "Description not available.")  # Description from JSON
            }
            response.append(crop_data)

        # Return top 5 predictions as JSON
        return jsonify(response)
    
    except Exception as e:
        # Handle errors and return error message
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(port=5002, debug=True)
