from flask import Flask, render_template, request, jsonify
import os
import base64
import google.generativeai as genai  # Assuming this is the correct library for interacting with the Generative AI API

# Initialize Flask app
app = Flask(__name__, template_folder="templates")

# Route to serve the index page
@app.route('/')
def home():
    return render_template('disease.html')

# Configure Generative AI API
api_key = "AIzaSyCN0rSGcrpDluSCGpfBnxnfWOXo5CxRk00"  # Your actual API key
genai.configure(api_key=api_key)

generation_config = {
    "temperature": 0.4,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 4096,
}

safety_settings = [
    {"category": f"HARM_CATEGORY_{category}", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
    for category in ["HARASSMENT", "HATE_SPEECH", "SEXUALLY_EXPLICIT", "DANGEROUS_CONTENT"]
]

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
    safety_settings=safety_settings,
    system_instruction="Analyze the dermatological data and generate a structured report with the following details: Analyst (Dermatology AI Diagnostic Model), Disease name, Condition Identified (or state 'Skin appears healthy'), Impact Assessment (severity, affected areas, health implications), Treatment Method (recommend treatments and instructions,,medicine recommendation with dosage), and Prevention Method (advice to prevent recurrence)."
)

# Route to analyze uploaded image and display the prediction result
@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({"error": "No image file found."})

    image = request.files['image']
    
    if image.filename == '':
        return jsonify({"error": "No selected file."})

    # Save the uploaded image to a temporary location
    image_path = os.path.join('uploads', image.filename)
    image.save(image_path)

    # Read the image and encode it in base64
    with open(image_path, "rb") as img_file:
        image_data = base64.b64encode(img_file.read()).decode('utf-8')

    # Generate AI response for analysis
    prompt = "Analyze the uploaded image and identify the cause and any diseases present."
    ai_response = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_data}])

    # Get the prediction text from the AI response
    prediction = ai_response.text

    # Return the prediction and image directly on the same page
    uploaded_image = f"data:image/{image.filename.split('.')[-1]};base64,{image_data}"
    return jsonify({
        'prediction': prediction,
        'uploaded_image': uploaded_image
    })

if __name__ == '__main__':
    app.run(debug=True,port=5003)
