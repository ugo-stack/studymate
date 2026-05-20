import { useState } from "react"

export default function Quiz({ questions }) {
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})
  const [score, setScore] = useState(null)

  if (!questions || questions.length === 0) {
    return (
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        padding: "48px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "15px",
      }}>
        No quiz questions were generated for this document.
      </div>
    )
  }

  const pick = (qi, opt) => {
    if (revealed[qi]) return
    setAnswers(p => ({ ...p, [qi]: opt }))
  }

  const checkOne = (qi) => {
    if (!answers[qi]) return
    setRevealed(p => ({ ...p, [qi]: true }))
  }

  const submitAll = () => {
    let correct = 0
    const newRevealed = {}
    questions.forEach((q, i) => {
      newRevealed[i] = true
      if (answers[i] === q.answer) correct++
    })
    setRevealed(newRevealed)
    setScore(correct)
  }

  const reset = () => {
    setAnswers({})
    setRevealed({})
    setScore(null)
  }

  const allAnswered = questions.every((_, i) => answers[i])
  const allRevealed = questions.every((_, i) => revealed[i])

  return (
    <div>
      {/* Score banner */}
      {score !== null && (
        <div style={{
          background: score === questions.length
            ? "var(--success-bg)"
            : "var(--sage-light)",
          border: `1px solid ${score === questions.length
            ? "var(--success)"
            : "var(--sage-border)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "28px",
          textAlign: "center",
          marginBottom: "24px",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>
            {score === questions.length ? "🏆"
              : score >= questions.length / 2 ? "👍" : "📚"}
          </div>
          <h3 style={{
            fontSize: "22px",
            color: "var(--text)",
            marginBottom: "6px"
          }}>
            {score} / {questions.length} correct
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "16px" }}>
            {score === questions.length
              ? "Perfect score — excellent work!"
              : score >= questions.length / 2
              ? "Good effort — review the ones you missed."
              : "Keep studying — you'll get there!"}
          </p>
          <button
            onClick={reset}
            style={{
              background: "var(--sage)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qi) => (
        <div key={qi} style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          marginBottom: "16px",
          boxShadow: "var(--shadow-sm)",
        }}>
          {/* Question */}
          <p style={{
            fontSize: "15px",
            fontWeight: "600",
            color: "var(--text)",
            marginBottom: "16px",
            lineHeight: "1.6",
          }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "26px", height: "26px",
              background: "var(--sage-light)",
              color: "var(--sage-dark)",
              borderRadius: "50%",
              fontSize: "12px",
              fontWeight: "700",
              marginRight: "10px",
              flexShrink: 0,
            }}>
              {qi + 1}
            </span>
            {q.question}
          </p>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.entries(q.options).map(([key, val]) => {
              const isSelected = answers[qi] === key
              const isCorrect = key === q.answer
              const isRevealed = revealed[qi]

              let bg = "var(--surface-2)"
              let border = "var(--border)"
              let color = "var(--text)"

              if (isRevealed) {
                if (isCorrect) {
                  bg = "var(--success-bg)"
                  border = "var(--success)"
                  color = "var(--success)"
                } else if (isSelected && !isCorrect) {
                  bg = "var(--error-bg)"
                  border = "var(--error)"
                  color = "var(--error)"
                }
              } else if (isSelected) {
                bg = "var(--sage-light)"
                border = "var(--sage)"
                color = "var(--sage-dark)"
              }

              return (
                <button
                  key={key}
                  onClick={() => pick(qi, key)}
                  disabled={isRevealed}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: bg,
                    border: `1.5px solid ${border}`,
                    borderRadius: "var(--radius-sm)",
                    color: color,
                    fontSize: "14px",
                    textAlign: "left",
                    transition: "all 0.15s",
                    fontWeight: isSelected || (isRevealed && isCorrect) ? "600" : "400",
                  }}
                >
                  <span style={{
                    width: "24px", height: "24px",
                    borderRadius: "50%",
                    background: isSelected || (isRevealed && isCorrect)
                      ? border
                      : "var(--border)",
                    color: isSelected || (isRevealed && isCorrect) ? "white" : "var(--text-muted)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "700",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}>
                    {isRevealed && isCorrect ? "✓"
                      : isRevealed && isSelected ? "✗"
                      : key}
                  </span>
                  {val}
                </button>
              )
            })}
          </div>

          {/* Check answer button */}
          {!revealed[qi] && answers[qi] && !allRevealed && (
            <button
              onClick={() => checkOne(qi)}
              style={{
                marginTop: "12px",
                background: "transparent",
                border: "1.5px solid var(--sage-border)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--sage-dark)",
              }}
            >
              Check Answer
            </button>
          )}
        </div>
      ))}

      {/* Submit all */}
      {allAnswered && !allRevealed && (
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <button
            onClick={submitAll}
            style={{
              background: "var(--sage)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "14px 40px",
              fontSize: "15px",
              fontWeight: "600",
              boxShadow: "0 4px 14px rgba(124,158,135,0.4)",
            }}
          >
            Submit All & See Score
          </button>
        </div>
      )}
    </div>
  )
}