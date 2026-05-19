from flask import Flask, request, jsonify, send_file, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import os
import fitz  # PyMuPDF
import requests
import json
import pyttsx3
import tempfile
import threading

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:1b"  # Smaller, faster, uses less RAM

# Lock prevents two Llama calls running at the same time
llama_lock = threading.Lock()

# ─── Health Check ─────────────────────────────────────────────
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({
        "status": "StudyMate backend is running ✅",
        "model": MODEL
    })

# ─── Helper: call Llama with streaming ────────────────────────
def ask_llama(prompt):
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": True,
        "options": {
            "num_ctx": 2048,      # Limit context window to save RAM
            "num_predict": 512,   # Limit response length
            "temperature": 0.3,   # Lower = more focused, less random
            "top_p": 0.9
        }
    }
    with llama_lock:  # Only one call at a time
        try:
            response = requests.post(
                OLLAMA_URL,
                json=payload,
                timeout=300,
                stream=True
            )
            response.raise_for_status()
            full_response = ""
            for line in response.iter_lines():
                if line:
                    chunk = json.loads(line.decode("utf-8"))
                    full_response += chunk.get("response", "")
                    if chunk.get("done"):
                        break
            return full_response.strip()
        except requests.exceptions.ConnectionError:
            raise Exception("Ollama is not running. Open Ollama from the Start menu.")
        except Exception as e:
            raise Exception(f"Llama error: {str(e)}")

# ─── Helper: Extract text from PDF ────────────────────────────
def extract_text_from_pdf(filepath):
    text = ""
    doc = fitz.open(filepath)
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

# ─── Helper: Split text into chunks ───────────────────────────
def chunk_text(text, chunk_size=2000):  # Smaller chunks for low RAM
    words = text.split()
    chunks = []
    current = []
    current_len = 0
    for word in words:
        current.append(word)
        current_len += len(word) + 1
        if current_len >= chunk_size:
            chunks.append(" ".join(current))
            current = []
            current_len = 0
    if current:
        chunks.append(" ".join(current))
    return chunks

# ─── Helper: SSE message formatter ────────────────────────────
def sse(event, data):
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

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

    try:
        text = extract_text_from_pdf(filepath)
    except Exception as e:
        return jsonify({"error": f"Could not read PDF: {str(e)}"}), 500
    finally:
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

    text = data["text"][:4000]  # Tighter limit for low RAM

    prompt = f"""Summarise this academic text for a university student.
Write an overview paragraph then 5 bullet points.
Be concise.

Text: {text}

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

    text = data["text"][:3000]  # Tighter limit for low RAM

    prompt = f"""Generate 5 multiple choice questions from this text.
Return ONLY a JSON array. No extra text.

Format:
[{{"question":"...","options":{{"A":"...","B":"...","C":"...","D":"..."}},"answer":"A"}}]

Text: {text}

JSON:"""

    try:
        raw = ask_llama(prompt)
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

# ─── Text to Speech ───────────────────────────────────────────
@app.route("/tts", methods=["POST"])
def text_to_speech():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    text = data["text"][:3000]

    try:
        tmp = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".wav",
            dir=app.config["UPLOAD_FOLDER"]
        )
        tmp_path = tmp.name
        tmp.close()

        engine = pyttsx3.init()
        engine.setProperty("rate", 160)
        engine.setProperty("volume", 1.0)
        engine.save_to_file(text, tmp_path)
        engine.runAndWait()

        return send_file(
            tmp_path,
            mimetype="audio/wav",
            as_attachment=False,
            download_name="summary.wav"
        )

    except Exception as e:
        return jsonify({"error": f"TTS failed: {str(e)}"}), 500

    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass

# ─── Combined Route with SSE Progress ─────────────────────────
@app.route("/process", methods=["POST"])
def process():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    def generate():
        try:
            # Step 1 — Extract text
            yield sse("progress", {
                "step": 1, "total": 4, "percent": 10,
                "message": "📄 Extracting text from PDF..."
            })

            try:
                text = extract_text_from_pdf(filepath)
            except Exception as e:
                yield sse("error", {"message": f"Could not read PDF: {str(e)}"})
                return
            finally:
                if os.path.exists(filepath):
                    os.remove(filepath)

            if not text.strip():
                yield sse("error", {"message": "PDF appears empty or is a scanned image"})
                return

            char_count = len(text)
            yield sse("progress", {
                "step": 1, "total": 4, "percent": 25,
                "message": f"✅ Extracted {char_count:,} characters from PDF"
            })

            # Step 2 — Chunk and summarise
            chunks = chunk_text(text, chunk_size=2000)
            total_chunks = len(chunks)

            # Cap at 6 chunks max to keep it fast on low RAM
            if total_chunks > 6:
                chunks = chunks[:6]
                total_chunks = 6

            yield sse("progress", {
                "step": 2, "total": 4, "percent": 30,
                "message": f"🧠 Summarising document ({total_chunks} section{'s' if total_chunks > 1 else ''})..."
            })

            chunk_summaries = []
            for i, chunk in enumerate(chunks):
                pct = 30 + int((i / total_chunks) * 30)
                yield sse("progress", {
                    "step": 2, "total": 4, "percent": pct,
                    "message": f"🧠 Summarising section {i + 1} of {total_chunks}..."
                })

                prompt = f"""Summarise this section in 3 clear sentences for a university student.
Be concise and accurate.

Text: {chunk}

Summary:"""
                summary_chunk = ask_llama(prompt)
                chunk_summaries.append(summary_chunk)

            # Combine if multiple chunks
            if total_chunks > 1:
                yield sse("progress", {
                    "step": 2, "total": 4, "percent": 62,
                    "message": "🧠 Combining sections into final summary..."
                })
                combined = "\n\n".join(chunk_summaries)
                final_prompt = f"""Write a final academic summary from these section summaries.
Include an overview paragraph and 5 bullet points.

Sections:
{combined[:4000]}

Final Summary:"""
                summary = ask_llama(final_prompt)
            else:
                summary = chunk_summaries[0]

            yield sse("progress", {
                "step": 2, "total": 4, "percent": 65,
                "message": "✅ Summary ready"
            })

            # Step 3 — Generate Quiz
            yield sse("progress", {
                "step": 3, "total": 4, "percent": 70,
                "message": "🧩 Generating quiz questions..."
            })

            quiz_prompt = f"""Generate 5 multiple choice questions from this text.
Return ONLY a JSON array. No extra text.

Format:
[{{"question":"...","options":{{"A":"...","B":"...","C":"...","D":"..."}},"answer":"A"}}]

Text: {text[:3000]}

JSON:"""

            try:
                raw = ask_llama(quiz_prompt)
                start = raw.find("[")
                end = raw.rfind("]") + 1
                quiz = json.loads(raw[start:end]) if start != -1 and end > 0 else []
            except Exception:
                quiz = []

            yield sse("progress", {
                "step": 3, "total": 4, "percent": 90,
                "message": f"✅ Quiz ready — {len(quiz)} questions generated"
            })

            # Step 4 — Done
            yield sse("progress", {
                "step": 4, "total": 4, "percent": 100,
                "message": "🎉 All done!"
            })

            yield sse("result", {
                "character_count": char_count,
                "text": text,
                "summary": summary,
                "quiz": quiz
            })

        except Exception as e:
            yield sse("error", {"message": str(e)})

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

# ─── Run ──────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)