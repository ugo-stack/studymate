from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import fitz  # PyMuPDF
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"

# ─── Health Check ─────────────────────────────────────────────
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "StudyMate backend is running ✅"})

# ─── Helper: call local Llama model ───────────────────────────
def ask_llama(prompt):
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False  # Wait for full response before returning
    }
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        return response.json().get("response", "")
    except requests.exceptions.ConnectionError:
        raise Exception("Ollama is not running. Start it with: ollama serve")
    except Exception as e:
        raise Exception(f"Llama error: {str(e)}")

# ─── PDF Upload & Text Extraction ─────────────────────────────
@app.route("/upload", methods=["POST"])
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    text = ""
    try:
        doc = fitz.open(filepath)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        return jsonify({"error": f"Could not read PDF: {str(e)}"}), 500

    os.remove(filepath)

    if not text.strip():
        return jsonify({"error": "PDF appears empty or is a scanned image"}), 400

    return jsonify({
        "message": "PDF processed successfully",
        "character_count": len(text),
        "text": text
    })

# ─── Summarise Text ───────────────────────────────────────────
@app.route("/summarise", methods=["POST"])
def summarise():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    text = data["text"][:6000]  # Limit to avoid overwhelming the model

    prompt = f"""You are an academic study assistant. 
Read the following text and provide:
1. A short overview paragraph (3-4 sentences)
2. Five key bullet points summarising the most important ideas

Be clear and concise. Write for a university student.

Text:
{text}

Summary:"""

    try:
        summary = ask_llama(prompt)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─── Run ──────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)