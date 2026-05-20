import { useState, useRef } from "react"

export default function UploadZone({ onUpload }) {
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    if (!file.name.endsWith(".pdf")) {
      alert("Only PDF files are supported.")
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleSubmit = () => {
    if (selectedFile) onUpload(selectedFile)
  }

  return (
    <div>
      {/* Hero text */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{
          fontSize: "38px",
          color: "var(--text)",
          marginBottom: "12px",
          lineHeight: "1.2"
        }}>
          Study smarter with{" "}
          <span style={{ color: "var(--sage)" }}>AI</span>
        </h1>
        <p style={{
          fontSize: "16px",
          color: "var(--text-muted)",
          maxWidth: "480px",
          margin: "0 auto",
          lineHeight: "1.7"
        }}>
          Upload any academic PDF and get an instant summary,
          quiz questions, and an audio overview.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--sage)" : selectedFile ? "var(--sage-border)" : "var(--border)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "56px 32px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging
            ? "var(--sage-light)"
            : selectedFile
            ? "var(--sage-light)"
            : "var(--surface)",
          transition: "all 0.2s",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {/* Icon */}
        <div style={{
          width: "64px", height: "64px",
          background: selectedFile ? "var(--sage)" : "var(--surface-2)",
          borderRadius: "16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "28px",
          margin: "0 auto 20px",
          transition: "all 0.2s",
          boxShadow: selectedFile ? "0 4px 12px rgba(124,158,135,0.3)" : "none"
        }}>
          {selectedFile ? "✅" : dragging ? "⬇️" : "📄"}
        </div>

        {selectedFile ? (
          <>
            <p style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "var(--sage-dark)",
              marginBottom: "6px"
            }}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {(selectedFile.size / 1024).toFixed(1)} KB · Click to change file
            </p>
          </>
        ) : (
          <>
            <p style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "var(--text)",
              marginBottom: "6px"
            }}>
              Drop your PDF here
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              or click to browse your files
            </p>
          </>
        )}
      </div>

      {/* Submit button */}
      {selectedFile && (
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            onClick={handleSubmit}
            style={{
              background: "var(--sage)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "14px 40px",
              fontSize: "15px",
              fontWeight: "600",
              boxShadow: "0 4px 14px rgba(124,158,135,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.target.style.background = "var(--sage-dark)"
              e.target.style.transform = "translateY(-1px)"
              e.target.style.boxShadow = "0 6px 18px rgba(124,158,135,0.5)"
            }}
            onMouseLeave={e => {
              e.target.style.background = "var(--sage)"
              e.target.style.transform = "translateY(0)"
              e.target.style.boxShadow = "0 4px 14px rgba(124,158,135,0.4)"
            }}
          >
            ✨ Analyse Document
          </button>
          <p style={{
            fontSize: "12px",
            color: "var(--text-light)",
            marginTop: "10px"
          }}>
            This may take 1–2 minutes depending on document size
          </p>
        </div>
      )}

      {/* Feature chips */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginTop: "40px",
        flexWrap: "wrap"
      }}>
        {[
          { icon: "🧠", label: "AI Summary" },
          { icon: "🧩", label: "Quiz Generation" },
          { icon: "🔊", label: "Audio Overview" },
          { icon: "💻", label: "Runs Locally" },
        ].map(chip => (
          <div key={chip.label} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "6px 14px",
            fontSize: "13px",
            color: "var(--text-muted)",
            fontWeight: "500",
            boxShadow: "var(--shadow-sm)"
          }}>
            {chip.icon} {chip.label}
          </div>
        ))}
      </div>
    </div>
  )
}