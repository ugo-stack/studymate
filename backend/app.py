from flask import Flask, request, jsonify, send_file, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import os
import fitz
import json
import pyttsx3
import tempfile
import re
from groq import Groq
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

MODEL = "llama-3.1-8b-instant"

# ─── Health Check ─────────────────────────────────────────────
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({
        "status": "StudyMate backend is running ✅",
        "model": MODEL,
        "provider": "Groq Cloud"
    })

# ─── Helper: call Groq API ────────────────────────────────────
def ask_groq(prompt, max_tokens=512):
    try:
        groq_client = Groq()
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful academic study assistant."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise Exception(f"Groq error: {str(e)}")

# ─── Helper: Summarise one chunk ──────────────────────────────
def summarise_chunk(index, chunk):
    prompt = f"""Summarise this section in 3 clear sentences for a university student.
Be concise and accurate.

Text: {chunk}

Summary:"""
    result = ask_groq(prompt, max_tokens=300)
    return index, result

# ─── Helper: Extract text from PDF ────────────────────────────
def extract_text_from_pdf(filepath):
    text = ""
    doc = fitz.open(filepath)
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

# ─── Helper: Split text into chunks ───────────────────────────
def chunk_text(text, chunk_size=4000):
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

# ─── Helper: SSE formatter ────────────────────────────────────
def sse(event, data):
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

# ─── Helper: Parse quiz JSON robustly ─────────────────────────
def parse_quiz(raw):
    raw = re.sub(r"```json|```", "", raw).strip()
    questions = []
    pattern = re.compile(r'\{[^{}]+\}', re.DOTALL)
    matches = pattern.findall(raw)
    for match in matches:
        try:
            obj = json.loads(match)
            if (
                "question" in obj and
                "options" in obj and
                "answer" in obj and
                isinstance(obj["options"], dict) and
                len(obj["options"]) >= 2
            ):
                questions.append(obj)
        except (json.JSONDecodeError, KeyError):
            continue
    if questions:
        return questions
    try:
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start != -1 and end > 0:
            parsed = json.loads(raw[start:end])
            if isinstance(parsed, list):
                return parsed
    except json.JSONDecodeError:
        pass
    return []

# ─── Helper: Generate quiz with retries ───────────────────────
def generate_quiz_with_retry(text, max_retries=3):
    excerpt = text[:4000]
    for attempt in range(max_retries):
        prompt = f"""Generate 5 multiple choice questions from the text below.

Rules:
- Return ONE single JSON array containing all 5 questions
- Do not split into multiple arrays
- No explanation, no markdown, no extra text
- Each question must have fields: question, options (A B C D), answer

Text:
{excerpt}

JSON array:
["""
        try:
            raw = ask_groq(prompt, max_tokens=1000)
            if not raw.strip().startswith("["):
                raw = "[" + raw
            quiz = parse_quiz(raw)
            if len(quiz) >= 3:
                return quiz[:5]
        except Exception:
            continue
    return []

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
    text = data["text"][:6000]
    prompt = f"""Write a detailed academic summary from these section summaries.
Include:
1. A comprehensive overview paragraph (4-5 sentences)
2. Seven key bullet points with specific details and examples
3. Any important definitions or concepts mentioned
Be thorough and detailed for a university student.

Text: {text}

Summary:"""
    try:
        summary = ask_groq(prompt,max_tokens=1000)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─── Quiz Generation ──────────────────────────────────────────
@app.route("/quiz", methods=["POST"])
def generate_quiz():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400
    quiz = generate_quiz_with_retry(data["text"])
    if not quiz:
        return jsonify({"error": "Could not generate quiz questions"}), 500
    return jsonify({"quiz": quiz})

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

            # Step 2 — Chunk text
            chunks = chunk_text(text, chunk_size=4000)
            total_chunks = min(len(chunks), 4)
            chunks = chunks[:total_chunks]

            yield sse("progress", {
                "step": 2, "total": 4, "percent": 30,
                "message": f"🧠 Summarising {total_chunks} section{'s' if total_chunks > 1 else ''} in parallel..."
            })

            chunk_summaries = [""] * total_chunks

            with ThreadPoolExecutor(max_workers=total_chunks) as executor:
                futures = {
                    executor.submit(summarise_chunk, i, chunk): i
                    for i, chunk in enumerate(chunks)
                }
                completed = 0
                for future in as_completed(futures):
                    try:
                        index, result = future.result()
                        chunk_summaries[index] = result
                        completed += 1
                        pct = 30 + int((completed / total_chunks) * 30)
                        yield sse("progress", {
                            "step": 2, "total": 4, "percent": pct,
                            "message": f"🧠 {completed} of {total_chunks} sections summarised..."
                        })
                    except Exception as e:
                        completed += 1
                        chunk_summaries[futures[future]] = ""

            # Step 2b — Combine or use single summary
            if total_chunks > 1:
                yield sse("progress", {
                    "step": 2, "total": 4, "percent": 62,
                    "message": "🧠 Combining into final summary..."
                })
                combined = "\n\n".join(
                    s for s in chunk_summaries if s.strip()
                )
                final_prompt = f"""Write a final academic summary from these section summaries.
Include an overview paragraph and 5 bullet points.

Sections:
{combined[:6000]}

Final Summary:"""
                summary = ask_groq(final_prompt, max_tokens=600)
            else:
                summary = chunk_summaries[0]

            # If summary is still empty fall back to asking Groq directly
            if not summary or not summary.strip():
                print("DEBUG: summary empty, trying direct fallback...")
                fallback_prompt = f"""Summarise this academic text for a university student.
Write an overview paragraph then 5 bullet points.
Be concise.

Text: {text[:6000]}

Summary:"""
                summary = ask_groq(fallback_prompt, max_tokens=600)

            print(f"DEBUG summary length: {len(summary)}")
            print(f"DEBUG summary preview: {summary[:100]}")

            yield sse("progress", {
                "step": 2, "total": 4, "percent": 65,
                "message": "✅ Summary ready"
            })

            # Step 3 — Generate quiz
            yield sse("progress", {
                "step": 3, "total": 4, "percent": 70,
                "message": "🧩 Generating quiz questions..."
            })

            quiz = generate_quiz_with_retry(text)

            if not quiz:
                yield sse("progress", {
                    "step": 3, "total": 4, "percent": 90,
                    "message": "⚠️ Quiz could not be generated"
                })
            else:
                yield sse("progress", {
                    "step": 3, "total": 4, "percent": 90,
                    "message": f"✅ Quiz ready — {len(quiz)} questions generated"
                })

            yield sse("progress", {
                "step": 4, "total": 4, "percent": 100,
                "message": "🎉 All done!"
            })

            print(f"DEBUG sending result — summary: {len(summary)} chars, quiz: {len(quiz)} questions")

            yield sse("result", {
                "character_count": char_count,
                "text": text,
                "summary": summary,
                "quiz": quiz
            })

        except Exception as e:
            print(f"DEBUG exception in generate(): {str(e)}")
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