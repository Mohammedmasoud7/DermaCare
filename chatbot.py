import os
import base64
from gtts import gTTS
from io import BytesIO
from googletrans import Translator
import speech_recognition as sr
import google.generativeai as gen
import re
from flask import Flask, jsonify, request, render_template

app = Flask(__name__, template_folder='./templates')

# Configure Google Gemini API
GOOGLE_API_KEY = "AIzaSyDCapi1v1_v-KFJ1HCgpgnw3gjfY6JICH0"
gen.configure(api_key=GOOGLE_API_KEY)
model = gen.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction="You are DermaCare's AI assistant, designed exclusively to assist users with dermatology-related queries. Your expertise includes skin conditions, skincare routines, treatments, and general dermatological health advice. Always prioritize professional, evidence-based information and promote consulting licensed dermatologists for personalized care. Kindly decline to address non-dermatology-related questions, politely explaining your specialized role. For greetings or repeated queries like hello or hi, respond with varied, friendly, and professional replies each time to maintain engagement. Avoid discussing backend or operational details about yourself.")

translator = Translator()

# Root route to serve the chatbot page
@app.route('/')
def home():
    return render_template("chatbot.html")  # Serve the chatbot HTML page

# Route for translating text
@app.route('/translate', methods=['POST'])
def translate_text():
    data = request.json
    text = data.get('text')
    dest_lang = data.get('dest_lang')
    translation = translator.translate(text, dest=dest_lang)
    return jsonify({"translated_text": translation.text})

# Route for text-to-speech
@app.route('/text_to_speech', methods=['POST'])
def text_to_speech():
    data = request.json
    text = re.sub(r'[^a-zA-Z0-9_]', '', data.get('text'))
    lang = data.get('lang', 'en')
    tts = gTTS(text=text, lang=lang)
    audio_fp = BytesIO()
    tts.write_to_fp(audio_fp)
    audio_fp.seek(0)
    audio_data = audio_fp.read()
    audio_base64 = base64.b64encode(audio_data).decode()
    return jsonify({"audio_base64": audio_base64})


# Route for recognizing speech
@app.route('/recognize_speech', methods=['POST'])
def recognize_speech():
    recognizer = sr.Recognizer()
    with sr.AudioFile(request.files['audio']) as source:
        audio = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio, language=request.form['language_code'])
            return jsonify({"text": text})
        except sr.UnknownValueError:
            return jsonify({"error": "Could not understand audio"})
        except sr.RequestError:
            return jsonify({"error": "Request error"})

# Route for chatbot interaction
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_prompt = data.get('user_prompt')
    chat_session = model.start_chat(history=[])
    gemini_response = chat_session.send_message(user_prompt)
    return jsonify({"response": gemini_response.text})

if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Run chatbot server on port 5001
