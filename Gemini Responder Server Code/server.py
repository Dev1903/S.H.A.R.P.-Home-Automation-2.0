from flask import Flask, request, jsonify
import os
import whisper
import requests
import re
import google.generativeai as genai

app = Flask(__name__)

# Load Whisper model once
model = whisper.load_model("base")

# ESP8266 IP address
ESP_IP = "<ADD YOUR ESP IP ADDRESS FROM THE SERIAL MONITOR OR OLED DISPLAY>"

# Gemini API setup (set API key securely or inline for testing)
genai.configure(api_key='<CREATE THE GEMINI API KEY AND PASTE IT HERE>')
gen_model = genai.GenerativeModel("gemini-1.5-flash")

@app.route('/recognize', methods=['POST'])
def recognize():
    # Check if audio file is uploaded
    if 'file' not in request.files:
        return jsonify({"error": "No audio uploaded"}), 400

    audio = request.files['file']
    path = "./tmp_audio"
    os.makedirs(path, exist_ok=True)

    filepath = os.path.join(path, audio.filename)
    audio.save(filepath)

    print(f"[INFO] Received audio file: {filepath} ({os.path.getsize(filepath)} bytes)")

    # Transcribe using Whisper
    try:
        result = model.transcribe(filepath)
        user_text = result["text"].strip()
        print("[INFO] Transcription:", user_text)
    except Exception as e:
        print("[ERROR] Whisper failed:", e)
        return jsonify({"error": "Transcription failed"}), 500

    if not user_text:
        return jsonify({"error": "Empty transcription"}), 400

    # Prompt for Gemini
    prompt = f"""
You are a smart home assistant.

Your job is to:
1. Respond like a helpful talking assistant.
2. If the user message includes a device command (e.g., 'turn on the light'), you:
   - Understand intent
   - Respond naturally
   - Append: {{"command": "turn on light"}} etc.
3. Also dont categorize night lamp as light
    - If user gives command like turn on night bulb or night lamp or lamp command will be "turn on lamp"

Recognize control patterns:
- "turn on", "switch on", "enable", "start" => TURN ON
- "turn off", "switch off", "disable", "stop" => TURN OFF

Recognize devices:
- light, fan, ac, tv, heater, pump, music, bulb, nightlamp

If no command detected, respond normally and append {{"command": "none"}}.

Reply naturally. Always end with {{"command": "..."}} on a separate line.

User: {user_text}
Assistant:
"""

    try:
        response = gen_model.generate_content(prompt)
        full_reply = response.text.strip()
        print("[INFO] Gemini Reply:\n", full_reply)
    except Exception as e:
        print("[ERROR] Gemini API failed:", e)
        return jsonify({"error": "Gemini generation failed"}), 500

    # Extract command JSON
    command_match = re.search(r'\{"command":\s*"(.+?)"\}', full_reply)
    command = command_match.group(1) if command_match else "none"

    # Clean spoken response
    spoken_reply = re.sub(r'\{"command":\s*".+?"\}', '', full_reply).strip()

    # Send command to ESP if needed
    if command != "none":
        try:
            resp = requests.post(f"http://{ESP_IP}/action", json={"command": command}, timeout=3)
            print(f"[INFO] Sent to ESP8266: {command}, Response: {resp.status_code}")
        except Exception as e:
            print("[ERROR] Failed to send to ESP:", e)

    # Return everything to client
    return jsonify({
        "transcription": user_text,
        "reply": spoken_reply,
        "command": command,
        "raw_response": full_reply
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
