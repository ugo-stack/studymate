from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import fitz  # PyMuPDF

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ─── Health Check ─────────────────────────────────────────────
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "StudyMate backend is running ✅"})

# ─── PDF Upload & Text Extraction ─────────────────────────────
@app.route("/upload", methods=["POST"])
def upload_pdf():
    # Check a file was actually sent
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    # Check it's a PDF
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    # Save the file temporarily
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    # Extract text using PyMuPDF
    text = ""
    try:
        doc = fitz.open(filepath)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        return jsonify({"error": f"Could not read PDF: {str(e)}"}), 500

    # Delete the file after extracting text (no need to keep it)
    os.remove(filepath)

    # Check we actually got text
    if not text.strip():
        return jsonify({"error": "PDF appears to be empty or scanned image — no text found"}), 400

    return jsonify({
        "message": "PDF processed successfully",
        "character_count": len(text),
        "text": text
    })

# ─── Run ──────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)