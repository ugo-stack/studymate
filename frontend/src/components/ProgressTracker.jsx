export default function ProgressTracker({ progress }) {
  const { percent, message, step, total } = progress

  const steps = [
    { label: "Extract Text", icon: "📄" },
    { label: "Summarise", icon: "🧠" },
    { label: "Generate Quiz", icon: "🧩" },
    { label: "Complete", icon: "🎉" },
  ]

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "var(--radius-lg)",
      padding: "48px 40px",
      boxShadow: "var(--shadow-md)",
      border: "1px solid var(--border)",
      textAlign: "center",
    }}>
      {/* Title */}
      <h2 style={{
        fontSize: "24px",
        color: "var(--text)",
        marginBottom: "8px"
      }}>
        Analysing your document
      </h2>
      <p style={{
        fontSize: "14px",
        color: "var(--text-muted)",
        marginBottom: "40px"
      }}>
        Please wait — your local AI is working
      </p>

      {/* Step indicators */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0",
        marginBottom: "40px",
        position: "relative",
      }}>
        {steps.map((s, i) => {
          const isDone = step > i + 1 || percent === 100
          const isActive = step === i + 1 && percent < 100
          return (
            <div key={s.label} style={{
              display: "flex",
              alignItems: "center",
            }}>
              {/* Step circle */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: "44px", height: "44px",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px",
                  background: isDone
                    ? "var(--sage)"
                    : isActive
                    ? "var(--sage-light)"
                    : "var(--surface-2)",
                  border: isActive
                    ? "2px solid var(--sage)"
                    : isDone
                    ? "2px solid var(--sage)"
                    : "2px solid var(--border)",
                  transition: "all 0.3s",
                  boxShadow: isActive
                    ? "0 0 0 4px rgba(124,158,135,0.15)"
                    : "none",
                  margin: "0 auto 6px",
                }}>
                  {isDone ? "✓" : s.icon}
                </div>
                <p style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: isDone || isActive
                    ? "var(--sage-dark)"
                    : "var(--text-light)",
                  whiteSpace: "nowrap",
                }}>
                  {s.label}
                </p>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div style={{
                  width: "60px", height: "2px",
                  background: step > i + 1 || percent === 100
                    ? "var(--sage)"
                    : "var(--border)",
                  margin: "0 4px",
                  marginBottom: "22px",
                  transition: "background 0.3s",
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{
        background: "var(--surface-2)",
        borderRadius: "99px",
        height: "8px",
        overflow: "hidden",
        marginBottom: "16px",
        border: "1px solid var(--border)"
      }}>
        <div style={{
          height: "100%",
          width: `${percent}%`,
          background: "linear-gradient(90deg, var(--sage), var(--sage-dark))",
          borderRadius: "99px",
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Percent + message */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <p style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          textAlign: "left",
          flex: 1,
        }}>
          {message}
        </p>
        <span style={{
          fontSize: "13px",
          fontWeight: "700",
          color: "var(--sage-dark)",
          marginLeft: "12px",
        }}>
          {percent}%
        </span>
      </div>

      {/* Pulse animation */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "6px",
        marginTop: "8px"
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "8px", height: "8px",
            borderRadius: "50%",
            background: "var(--sage)",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            opacity: 0.7,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  )
}