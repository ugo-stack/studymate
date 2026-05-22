# 📖 StudyMate — AI-Powered Academic Study Assistant

StudyMate is a locally-run AI study tool that takes any academic PDF and automatically generates a plain-English summary, a multiple choice quiz, and a downloadable audio overview — all without sending your data anywhere. Everything runs on your own machine.

---

## What It Does

- **Upload any PDF** — lecture notes, journal articles, textbook chapters
- **AI Summary** — get a structured overview with bullet points
- **Quiz Generation** — auto-generated multiple choice questions to test your understanding
- **Audio Overview** — download a spoken version of the summary
- **100% Local** — no API keys, no internet required after setup, no data leaves your machine

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Llama 3.2 via Ollama (runs locally) |
| Backend | Python + Flask |
| PDF Extraction | PyMuPDF |
| Text to Speech | pyttsx3 (Windows built-in voices) |
| Frontend | React + Vite |

---

## System Requirements

| Requirement | Minimum |
|---|---|
| OS | Windows 10 or 11 |
| RAM | 8GB (12GB recommended) |
| Storage | 5GB free (for model download) |
| Python | 3.9 or higher |
| Node.js | 18 or higher |

---

## Before You Start — Install These First

You need four things installed on your machine before anything else works. Do these in order.

---

### 1. Python

Check if you already have it:

```bash
python --version
```

If you see `Python 3.9.x` or higher you are good. If not:

1. Go to [python.org/downloads](https://python.org/downloads)
2. Download the latest Python 3 installer for Windows
3. Run the installer
4. **Important** — on the first screen tick the box that says **"Add Python to PATH"**
5. Click Install Now

Test it worked:

```bash
python --version
```

---

### 2. Node.js

Check if you already have it:

```bash
node --version
npm --version
```

If you see version numbers you are good. If not:

1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS** version
3. Run the installer, click Next on everything
4. Test it worked:

```bash
node --version
npm --version
```

---

### 3. Git

Check if you already have it:

```bash
git --version
```

If not:

1. Go to [git-scm.com/download/win](https://git-scm.com/download/win)
2. Download and run the installer
3. Click Next on everything — defaults are fine
4. Test it worked:

```bash
git --version
```

---

### 4. Ollama

Ollama is the tool that runs the AI model locally on your machine.

1. Go to [ollama.com/download](https://ollama.com/download)
2. Click **Download for Windows**
3. Run the `.exe` installer
4. Once installed, open **Ollama** from the Start menu — you will see a small llama icon appear in your system tray (bottom right near the clock)
5. Test it is running by opening Git Bash and running:

```bash
curl http://localhost:11434
```

You should see: `Ollama is running`

---

### 5. Download the AI Model

This is a one-time download of about 2GB. Make sure you are on WiFi.

Open Git Bash and run:

```bash
ollama pull llama3.2
```

Wait for it to finish. You will see a progress bar. This only ever needs to be done once — the model stays on your machine permanently after this.

Test the model works:

```bash
ollama run llama3.2
```

Type `hello` and press Enter. If it responds, type `/bye` to exit. Your local AI is working.

---

## Installation

Now clone the repo and set everything up.

---

### Step 1 — Clone the repository

Open Git Bash, navigate to where you want the project to live, then clone it:

```bash
cd ~/Desktop
git clone https://github.com/ugo-stack/studymate.git
cd studymate
```

---

### Step 2 — Set up the backend

Navigate into the backend folder:

```bash
cd backend
```

Create a Python virtual environment — this keeps the project dependencies isolated from the rest of your machine:

```bash
python -m venv venv
```

Activate it:

```bash
source venv/Scripts/activate
```

You will see `(venv)` appear at the start of your terminal prompt. This tells you the virtual environment is active.

Install all backend dependencies:

```bash
pip install -r requirements.txt
```

This installs Flask, PyMuPDF, pyttsx3, and everything else the backend needs. It may take a minute or two.

---

### Step 3 — Set up the frontend

Open a second Git Bash window (right click Git Bash in the taskbar and open a new window), then navigate to the frontend folder:

```bash
cd ~/Desktop/studymate/frontend
```

Install all frontend dependencies:

```bash
npm install
```

This installs React, Vite, Axios and everything else the frontend needs.

---

## Running the App

You need three things running at the same time in order. Use a separate terminal window for each one.

---

### Terminal 1 — Ollama (AI Model)

Open Ollama from the Windows Start menu. You will see the llama icon appear in your system tray. That is all you need to do — Ollama runs silently in the background.

If you want to confirm it is running:

```bash
curl http://localhost:11434
```

Should print: `Ollama is running`

---

### Terminal 2 — Flask Backend

In Git Bash, navigate to the backend folder and activate the virtual environment:

```bash
cd ~/Desktop/studymate/backend
source venv/Scripts/activate
```

Start the Flask server:

```bash
python app.py
```

You should see:

```
🔥 Warming up llama3.2...
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

The warm-up message means the AI model is being loaded into memory so your first request is fast. Leave this terminal running.

To confirm the backend is working, open your browser and go to:

```
http://127.0.0.1:5000/ping
```

You should see:

```json
{"status": "StudyMate backend is running ✅", "model": "llama3.2"}
```

---

### Terminal 3 — React Frontend

In a new Git Bash window:

```bash
cd ~/Desktop/studymate/frontend
npm run dev
```

You should see:

```
VITE v5.x.x  ready in 300ms
➜  Local:   http://localhost:5173/
```

Open your browser and go to:

```
http://localhost:5173
```

You should see the StudyMate interface. The app is running.

---

## Using the App

1. **Upload a PDF** — drag and drop any academic PDF onto the upload zone, or click to browse your files
2. **Wait for processing** — you will see a live progress bar showing each step: extracting text, summarising each section, generating quiz questions
3. **Read the summary** — a structured summary appears with an overview paragraph and key bullet points
4. **Download audio** — click the **Download Audio Overview** button to get a spoken `.wav` file of the summary
5. **Take the quiz** — click the Quiz tab to answer multiple choice questions generated from your document
6. **Check answers** — click Check Answer after each question, or answer all and click Submit All to see your score
7. **New document** — click the back arrow in the top right to upload another PDF

---

## Troubleshooting

---

**The app loads but nothing happens when I upload a PDF**

Make sure all three things are running — Ollama, Flask backend, and the React frontend. The most common cause is the Flask backend not being started.

Check the Flask terminal for error messages.

---

**I see "Could not connect to backend"**

Flask is not running. Go to Terminal 2 and run:

```bash
cd ~/Desktop/studymate/backend
source venv/Scripts/activate
python app.py
```

---

**I see "Ollama is not running"**

Open Ollama from the Windows Start menu. Look for the llama icon in your system tray. If it is there, Ollama is running. If not, click the Ollama app again to start it.

---

**The summary takes a very long time**

This is normal for large PDFs — the AI is processing your document locally on your machine. A 10-page document typically takes 2-4 minutes. A 50-page document can take 10-15 minutes. The progress bar will keep updating so you can see it is working.

If it seems completely frozen for more than 20 minutes, restart Flask and try again.

---

**No quiz questions were generated**

The AI model sometimes struggles to generate valid quiz JSON for very short or unusual documents. Try with a longer academic document with clear factual content. The quiz works best on documents with at least 2-3 pages of structured content.

---

**pip install fails with errors**

Make sure your virtual environment is active. You should see `(venv)` at the start of your terminal prompt. If not, run:

```bash
source venv/Scripts/activate
```

Then try `pip install -r requirements.txt` again.

---

**The frontend shows a blank white screen**

Open your browser developer tools (press F12), click the Console tab, and look for red error messages. The most common cause is a missing dependency — run `npm install` again in the frontend folder.

---

**Port 5000 is already in use**

Another process is using port 5000. Either stop that process or change the Flask port. To change it, open `backend/app.py` and change the last line to:

```python
app.run(debug=True, port=5001)
```

Then update `src/App.jsx` in the frontend — change:

```js
const API = "http://127.0.0.1:5000"
```

to:

```js
const API = "http://127.0.0.1:5001"
```

---

## Project Structure

```
studymate/
├── backend/
│   ├── uploads/          ← temporary storage for PDFs during processing
│   ├── app.py            ← Flask server with all API routes
│   ├── requirements.txt  ← Python dependencies
│   └── .env              ← environment variables (not pushed to GitHub)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.jsx      ← drag and drop file upload
│   │   │   ├── ProgressTracker.jsx ← live progress bar and status messages
│   │   │   ├── Summary.jsx         ← summary display with audio download
│   │   │   └── Quiz.jsx            ← interactive multiple choice quiz
│   │   ├── App.jsx                 ← main app and state management
│   │   └── index.css               ← global styles
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## API Routes

| Method | Route | What it does |
|---|---|---|
| GET | `/ping` | Health check — confirms backend is running |
| POST | `/upload` | Upload a PDF and extract text |
| POST | `/summarise` | Generate a summary from text |
| POST | `/quiz` | Generate quiz questions from text |
| POST | `/tts` | Convert text to speech and return a WAV file |
| POST | `/process` | Combined route — does everything in one call with live progress |

---

## Pushing Changes to GitHub

Every time you make changes to the code, save them to GitHub with these four commands:

```bash
cd ~/Desktop/studymate
git add .
git commit -m "describe what you changed here"
git push
```

Keep commit messages short and descriptive, for example:
- `fix: quiz not generating for short documents`
- `feat: added dark mode toggle`
- `style: updated header colours`

---

## Built With

- [Ollama](https://ollama.com) — local LLM runner
- [Llama 3.2](https://ollama.com/library/llama3.2) — Meta's open source language model
- [Flask](https://flask.palletsprojects.com) — Python web framework
- [PyMuPDF](https://pymupdf.readthedocs.io) — PDF text extraction
- [pyttsx3](https://pyttsx3.readthedocs.io) — offline text to speech
- [React](https://react.dev) — frontend UI library
- [Vite](https://vitejs.dev) — frontend build tool

---

## License

This project was built as a university final year project. Feel free to fork, modify, and build on it.