import webbrowser
from threading import Timer
from flask import Flask, render_template, redirect
import subprocess
import os

app = Flask(__name__)

# Start subprocesses during Flask app startup
def pre_start_subprocesses():
    print("Starting subprocesses...")
    # Start chatbot.py on port 5001
    subprocess.Popen(['python', 'chatbot.py'])
    # Start crop.py on port 5002
    subprocess.Popen(['python', 'crop.py'])
    # Start crop.py on port 5003
    subprocess.Popen(['python','disease.py'])

# Call the pre-initialization function to start subprocesses
pre_start_subprocesses()

# Root route for the landing page
@app.route('/')
def home():
    return render_template('index.html')  # Main landing page

# Route for chatbot
@app.route('/chatbot')
def chatbot():
    # Simply redirect to the chatbot server
    return redirect("http://127.0.0.1:5001/")

# Route for crop recommendation
@app.route('/crop-recommendation')
def crop_recommendation():
    # Simply redirect to the crop recommendation server
    return redirect("http://127.0.0.1:5002/")

# Route for crop recommendation
@app.route('/disease-detection')
def disease_detection():
    # Simply redirect to the crop recommendation server
    return redirect("http://127.0.0.1:5003/")

# Function to open the browser
def open_browser():
    webbrowser.open_new('http://127.0.0.1:5000/')  # Opens the main landing page

if __name__ == '__main__':
    # Use a timer to delay opening the browser until the server starts
    Timer(1, open_browser).start()

    # Run the main Flask server
    app.run(debug=True, use_reloader=False)
