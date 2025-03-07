let currentAudio = null;
let isAudioPlaying = false;
let isMuted = false; // Mute/unmute state

// Function to speak the bot's response using preloaded TTS audio chunks
async function speakResponse(text) {
    if (isMuted) return; // Skip if muted
    stopAudioImmediately();

    const sanitizedText = sanitizeTextForTTS(text); // Remove HTML tags
    const chunks = chunkText(sanitizedText); // Split text into chunks
    console.log(`Playing ${chunks.length} audio chunks.`);
    await playChunks(chunks);
}

// Function to play text chunks sequentially
async function playChunks(chunks) {
    isAudioPlaying = true;

    for (const chunk of chunks) {
        if (!isAudioPlaying || isMuted) break; // Stop playback if interrupted or muted
        try {
            currentAudio = await preloadAudio(chunk); // Fetch and load audio
            currentAudio.playbackRate = 1.3; // Set playback rate (1.0 = normal speed)
            currentAudio.play();
            await new Promise(resolve => {
                currentAudio.onended = resolve; // Wait for playback to finish
            });
        } catch (error) {
            console.error("Error playing audio chunk:", error);
            break;
        }
    }
    isAudioPlaying = false; // Reset the playback flag
}

// Helper to fetch and preload audio for a given chunk
async function preloadAudio(chunk) {
    try {
        const response = await fetch("/text_to_speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: chunk, lang: "en" })
        });
        if (!response.ok) throw new Error(`TTS API error: ${response.statusText}`);
        const data = await response.json();
        const audio = new Audio("data:audio/mp3;base64," + data.audio_base64);
        audio.load();
        return audio;
    } catch (error) {
        console.error("Error preloading audio:", error);
        throw error;
    }
}

// Split text into manageable chunks for TTS
function chunkText(text) {
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const chunks = [];
    let match;
    while ((match = sentenceRegex.exec(text)) !== null) {
        const chunk = match[0].trim();
        if (chunk.length > 0) chunks.push(chunk);
    }
    return chunks;
}

// Sanitize input text by stripping HTML tags
function sanitizeTextForTTS(text) {
    const div = document.createElement("div");
    div.innerHTML = text;
    return div.textContent || div.innerText || "";
}

// Function to immediately stop all audio playback
function stopAudioImmediately() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    isAudioPlaying = false;
}

// Function to record audio and convert it to text
async function recordAudio() {
    stopAudioImmediately(); // Stop any ongoing audio or queued playback
    if (!('webkitSpeechRecognition' in window)) {
        alert('Your browser does not support speech recognition');
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = function () {
        console.log("Listening...");
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("chat-input").value = transcript; // Populate text input
        sendText(); // Send the transcribed text to the chatbot
    };

    recognition.onerror = function (event) {
        alert("Error with speech recognition: " + event.error);
    };

    recognition.start();
}

// Event listener for voice input
document.getElementById("voice-btn").addEventListener("click", recordAudio);

// Mute/Unmute button toggle logic
function toggleMute() {
    isMuted = !isMuted; // Toggle mute state
    stopAudioImmediately(); // Stop any ongoing playback if muting

    const muteIcon = document.getElementById("mute-icon");
    muteIcon.src = isMuted ? "/static/images/mute.png" : "/static/images/unmute.png";
    muteIcon.alt = isMuted ? "Muted" : "Unmute";
    console.log(`Audio ${isMuted ? "muted" : "unmuted"}`);
}

// Event listener for the mute/unmute button
document.getElementById("mute-btn").addEventListener("click", toggleMute);

// Send text message to chatbot
async function sendText() {
    stopAudioImmediately(); // Stop any ongoing audio or queued playback
    const userPrompt = document.getElementById("chat-input").value.trim();
    if (!userPrompt) return;

    displayMessage(userPrompt, "user-bubble");
    document.getElementById("chat-input").value = "";

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_prompt: userPrompt })
        });

        if (!response.ok) throw new Error(`Chat API error: ${response.statusText}`);

        const data = await response.json();
        const botResponse = data.response.replace(/\*(.*?)\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
        displayMessage(botResponse, "bot-bubble");
        speakResponse(botResponse);
    } catch (error) {
        console.error("Error in chat response:", error);
    }
}

// Event listener for the Enter key in the input box
document.getElementById("chat-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        stopAudioImmediately(); // Stop any ongoing audio or queued playback
        sendText();
    }
});

// Display user or bot messages
function displayMessage(text, className) {
    const chatBox = document.getElementById("chat-box");
    const messageBubble = document.createElement("div");
    messageBubble.classList.add("chat-bubble", className);
    messageBubble.innerHTML = text;
    chatBox.appendChild(messageBubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}
