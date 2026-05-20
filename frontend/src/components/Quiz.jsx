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
    setAnswers(prev => ({ ...prev, [qi]: opt }))
  }

  const checkOne = (qi) => {
    if (!answers[qi] || revealed[qi]) return
    setRevealed(prev => ({ ...prev, [qi]: true }))
  }

  const submitAll = () => {
    const newRevealed = {}
    let correct = 0
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

  const allAnswered = questions.length > 0 &&
    questions.every((_, i) => answers[i] !== undefined)

  const allRevealed = questions.length > 0 &&
    questions.every((_, i) => revealed[i])

  const getOptionStyle = (qi, key) => {
    const isSelected = answers[qi] === key
    const isCorrect = key === questions[qi].answer
    const isRevealed = revealed[qi]

    if (isRevealed && isCorrect) return {
      bg: "var(--success-bg)",
      border: "var(--success)",
      color: "var(--success)",
      weight: "600"
    }
    if (isRevealed && isSelected && !isCorrect) return {
      bg: "var(--error-bg)",
      border: "var(--error)",
      color: "var(--error)",
      weight: "600"
    }
    if (isSelected) return {
      bg: "var(--sage-light)",
      border: "var(--sage)",
      color: "var(--sage-dark)",
      weight: "600"
    }
    return {
      bg: "var(--surface-2)",
      border: "var(--border)",
      color: "var(--text)",
      weight: "400"
    }
  }

  const getBadgeContent = (qi, key) => {
    if (revealed[qi] && key === questions[qi].answer) return "✓"
    if (revealed[qi] && answers[qi] === key) return "✗"
    return key
  }

  return (
    <div>
      {/* Score banner */}
      {score !== null && (
        <div style={{
          background: score === questions.length
            ? "var(--success-bg)" : "var(--sage-light)",
          border: `1px solid ${score === questions.length
            ? "var(--success)" : "var(--sage-border)"}`,
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
          <p style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            marginBottom: "16px"
          }}>
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
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qi) => {
        const isRevealed = !!revealed[qi]
        const hasAnswer = !!answers[qi]

        return (
          <div key={qi} style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
          }}>
            {/* Question text */}
            <p style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "var(--text)",
              marginBottom: "16px",
              lineHeight: "1.6",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "26px",
                height: "26px",
                background: "var(--sage-light)",
                color: "var(--sage-dark)",
                borderRadius: "50%",
                fontSize: "12px",
                fontWeight: "700",
                flexShrink: 0,
                marginTop: "1px",
              }}>
                {qi + 1}
              </span>
              {q.question}
            </p>

            {/* Options */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              {Object.entries(q.options).map(([key, val]) => {
                const s = getOptionStyle(qi, key)
                const badge = getBadgeContent(qi, key)
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
                      background: s.bg,
                      border: `1.5px solid ${s.border}`,
                      borderRadius: "var(--radius-sm)",
                      color: s.color,
                      fontSize: "14px",
                      textAlign: "left",
                      fontWeight: s.weight,
                      cursor: isRevealed ? "default" : "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                      width: "100%",
                    }}
                  >
                    <span style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: s.border,
                      color: s.bg === "var(--surface-2)" ? "var(--text-muted)" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "700",
                      flexShrink: 0,
                    }}>
                      {badge}
                    </span>
                    {val}
                  </button>
                )
              })}
            </div>

            {/* Check answer */}
            {!isRevealed && hasAnswer && !allRevealed && (
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
                  cursor: "pointer",
                }}
              >
                Check Answer
              </button>
            )}
          </div>
        )
      })}

      {/* Submit all */}
      {allAnswered && !allRevealed && (
        <div style={{ textAlign: "center", marginTop: "8px", paddingBottom: "32px" }}>
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
              cursor: "pointer",
            }}
          >
            Submit All & See Score
          </button>
        </div>
      )}
    </div>
  )
}