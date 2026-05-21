import { useState, useRef } from "react"
import UploadZone from "./components/UploadZone"
import ProgressTracker from "./components/ProgressTracker"
import Summary from "./components/Summary"
import Quiz from "./components/Quiz"
import "./index.css"

const API = "http://127.0.0.1:5000"

export default function App() {
  const [stage, setStage] = useState("upload")
  const [progress, setProgress] = useState({ percent: 0, message: "", step: 0, total: 4 })
  const [summary, setSummary] = useState("")
  const [quiz, setQuiz] = useState([])
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("summary")
  const [fileName, setFileName] = useState("")
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Ref to abort the fetch request
  const abortControllerRef = useRef(null)

  const handleUpload = async (file) => {
    setError("")
    setStage("processing")
    setFileName(file.name)
    setProgress({ percent: 0, message: "Starting...", step: 0, total: 4 })

    const formData = new FormData()
    formData.append("file", file)

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`${API}/process`, {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Split on double newline — each SSE message ends with \n\n
        const messages = buffer.split("\n\n")

        // Keep the last incomplete message in the buffer
        buffer = messages.pop()

        for (const message of messages) {
          if (!message.trim()) continue

          // Parse event type and data from the message block
          const lines = message.split("\n")
          let eventType = "message"
          let dataLine = ""

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim()
            }
            if (line.startsWith("data:")) {
              dataLine = line.slice(5).trim()
            }
          }

          if (!dataLine) continue

          try {
           const data = JSON.parse(dataLine)
            console.log("EVENT:", eventType, "DATA:", data)

            if (eventType === "progress") {
              setProgress({
                percent: data.percent ?? 0,
                message: data.message ?? "",
                step: data.step ?? 0,
                total: data.total ?? 4,
              })
            }

            else if (eventType === "result") {
              setSummary(data.summary ?? "")
              setQuiz(data.quiz ?? [])
              setText(data.text ?? "")
              setStage("results")
              setActiveTab("summary")
            }

            else if (eventType === "error") {
              setError(data.message ?? "Something went wrong")
              setStage("upload")
            }

          } catch {
            // skip malformed messages
          }
        }
      }

    } catch (err) {
      if (err.name === "AbortError") {
        setStage("upload")
        setFileName("")
      } else {
        setError("Could not connect to backend. Make sure Flask is running.")
        setStage("upload")
      }
    }
  }

  const handleCancelClick = () => {
    setShowCancelConfirm(true)
  }

  const handleCancelConfirm = () => {
    // Abort the fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setShowCancelConfirm(false)
    setStage("upload")
    setFileName("")
    setProgress({ percent: 0, message: "", step: 0, total: 4 })
  }

  const handleCancelDismiss = () => {
    setShowCancelConfirm(false)
  }

  const handleReset = () => {
    setStage("upload")
    setProgress({ percent: 0, message: "", step: 0, total: 4 })
    setSummary("")
    setQuiz([])
    setText("")
    setError("")
    setFileName("")
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
              cursor: "pointer",
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
          <ProgressTracker
            progress={progress}
            fileName={fileName}
            onCancel={handleCancelClick}
          />
        )}

        {/* Cancel confirmation dialog */}
        {showCancelConfirm && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}>
            <div style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "36px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
              <h3 style={{
                fontSize: "20px",
                color: "var(--text)",
                marginBottom: "10px",
                fontFamily: "'Playfair Display', serif",
              }}>
                Cancel processing?
              </h3>
              <p style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: "1.6",
                marginBottom: "28px",
              }}>
                Are you sure you want to cancel? All progress on{" "}
                <strong style={{ color: "var(--text)" }}>
                  {fileName}
                </strong>{" "}
                will be lost and you will need to start again.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={handleCancelDismiss}
                  style={{
                    flex: 1,
                    padding: "11px 20px",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Keep going
                </button>
                <button
                  onClick={handleCancelConfirm}
                  style={{
                    flex: 1,
                    padding: "11px 20px",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--error)",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Yes, cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results stage */}
        {stage === "results" && (
          <div>
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
                    cursor: "pointer",
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