from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import fitz  # PyMuPDF
import requests
import json

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
        "stream": False
    }
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=300)
        response.raise_for_status()
        return response.json().get("response", "")
    except requests.exceptions.ConnectionError:
        raise Exception("Ollama is not running. Open Ollama from the Start menu.")
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

    text = data["text"][:6000]

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

# ─── Quiz Generation ──────────────────────────────────────────
@app.route("/quiz", methods=["POST"])
def generate_quiz():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    text = data["text"][:5000]

    prompt = f"""You are an academic quiz generator.
Read the text below and generate exactly 5 multiple choice questions.

Rules:
- Each question must have exactly 4 options labeled A, B, C, D
- Indicate the correct answer
- Base all questions strictly on the text provided
- Return ONLY a valid JSON array, no explanation, no extra text

Use exactly this format:
[
  {{
    "question": "Question text here?",
    "options": {{
      "A": "First option",
      "B": "Second option",
      "C": "Third option",
      "D": "Fourth option"
    }},
    "answer": "A"
  }}
]

Text:
{text}

JSON:"""

    try:
        raw = ask_llama(prompt)

        # Extract JSON from response even if Llama adds extra text
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start == -1 or end == 0:
            return jsonify({"error": "Model did not return valid JSON", "raw": raw}), 500

        quiz = json.loads(raw[start:end])
        return jsonify({"quiz": quiz})

    except json.JSONDecodeError:
        return jsonify({"error": "Could not parse quiz JSON", "raw": raw}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─── Run ──────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)