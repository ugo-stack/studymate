import { useState } from "react"
import axios from "axios"
import UploadZone from "./components/UploadZone"
import ProgressTracker from "./components/ProgressTracker"
import Summary from "./components/Summary"
import Quiz from "./components/Quiz"
import "./index.css"

const API = "http://127.0.0.1:5000"

export default function App() {
  const [stage, setStage] = useState("upload") // upload | processing | results
  const [progress, setProgress] = useState({ percent: 0, message: "", step: 0, total: 4 })
  const [summary, setSummary] = useState("")
  const [quiz, setQuiz] = useState([])
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("summary") // summary | quiz

  const handleUpload = async (file) => {
    setError("")
    setStage("processing")
    setProgress({ percent: 0, message: "Starting...", step: 0, total: 4 })

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`${API}/process`, {
        method: "POST",
        body: formData,
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() // keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("event:")) continue

          if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.slice(5).trim())

              // Progress update
              if (data.message && data.percent !== undefined) {
                setProgress({
                  percent: data.percent,
                  message: data.message,
                  step: data.step || 0,
                  total: data.total || 4,
                })
              }

              // Final result
              if (data.summary) {
                setSummary(data.summary)
                setQuiz(data.quiz || [])
                setText(data.text || "")
                setStage("results")
                setActiveTab("summary")
              }

              // Error
              if (data.error) {
                setError(data.error || data.message)
                setStage("upload")
              }

            } catch {
              // skip malformed lines
            }
          }
        }
      }

    } catch (err) {
      setError("Could not connect to backend. Make sure Flask is running.")
      setStage("upload")
    }
  }

  const handleReset = () => {
    setStage("upload")
    setProgress({ percent: 0, message: "", step: 0, total: 4 })
    setSummary("")
    setQuiz([])
    setText("")
    setError("")
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "var(--shadow-sm)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "var(--sage)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px"
          }}>
            📖
          </div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "20px",
            fontWeight: "700",
            color: "var(--text)"
          }}>
            StudyMate
          </span>
          <span style={{
            fontSize: "11px",
            background: "var(--sage-light)",
            color: "var(--sage-dark)",
            padding: "2px 8px",
            borderRadius: "20px",
            fontWeight: "600",
            letterSpacing: "0.5px"
          }}>
            AI POWERED
          </span>
        </div>

        {stage === "results" && (
          <button
            onClick={handleReset}
            style={{
              background: "transparent",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "7px 16px",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--text-muted)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = "var(--sage)"
              e.target.style.color = "var(--sage-dark)"
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = "var(--border)"
              e.target.style.color = "var(--text-muted)"
            }}
          >
            ← New Document
          </button>
        )}
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "var(--error-bg)",
            border: "1px solid #F5C6C6",
            borderRadius: "var(--radius)",
            padding: "14px 18px",
            marginBottom: "24px",
            fontSize: "14px",
            color: "var(--error)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Upload stage */}
        {stage === "upload" && (
          <UploadZone onUpload={handleUpload} />
        )}

        {/* Processing stage */}
        {stage === "processing" && (
          <ProgressTracker progress={progress} />
        )}

        {/* Results stage */}
        {stage === "results" && (
          <div>
            {/* Tabs */}
            <div style={{
              display: "flex",
              gap: "4px",
              background: "var(--surface-2)",
              padding: "4px",
              borderRadius: "var(--radius)",
              marginBottom: "28px",
              border: "1px solid var(--border)",
            }}>
              {[
                { id: "summary", label: "📝 Summary" },
                { id: "quiz", label: `🧠 Quiz${quiz.length ? ` (${quiz.length})` : ""}` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.2s",
                    background: activeTab === tab.id ? "var(--surface)" : "transparent",
                    color: activeTab === tab.id ? "var(--sage-dark)" : "var(--text-muted)",
                    boxShadow: activeTab === tab.id ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "summary" && (
              <Summary summary={summary} apiUrl={API} />
            )}
            {activeTab === "quiz" && (
              <Quiz questions={quiz} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}