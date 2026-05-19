from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allows frontend to talk to this backend

# Folder where uploaded PDFs are temporarily stored
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ─── Health Check ─────────────────────────────────────────────
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "StudyMate backend is running ✅"})

# ─── Routes will go here ───────────────────────────────────────


# ─── Run ──────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)