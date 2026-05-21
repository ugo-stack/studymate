import { useState, memo, useCallback } from "react"

// ── Each question is its own isolated component ──────────────
// This means clicking an option only re-renders THAT question
// not all 5 at once
const QuizQuestion = memo(function QuizQuestion({
  question,
  index,
  selectedAnswer,
  isRevealed,
  onPick,
  onCheck,
  showCheckButton,
}) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      marginBottom: "16px",
      boxShadow: "var(--shadow-sm)",
    }}>
      {/* Question text */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        marginBottom: "16px",
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
          marginTop: "2px",
        }}>
          {index + 1}
        </span>
        <p style={{
          fontSize: "15px",
          fontWeight: "600",
          color: "var(--text)",
          lineHeight: "1.6",
          margin: 0,
        }}>
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Object.entries(question.options).map(([key, val]) => {
          const isSelected = selectedAnswer === key
          const isCorrect = key === question.answer

          // Calculate styles inline but simply — no function calls
          let borderColor = "var(--border)"
          let bgColor = "var(--surface-2)"
          let textColor = "var(--text)"
          let badgeText = key
          let badgeBg = "var(--border)"
          let badgeColor = "var(--text-muted)"

          if (isRevealed) {
            if (isCorrect) {
              borderColor = "var(--success)"
              bgColor = "var(--success-bg)"
              textColor = "var(--success)"
              badgeText = "✓"
              badgeBg = "var(--success)"
              badgeColor = "white"
            } else if (isSelected) {
              borderColor = "var(--error)"
              bgColor = "var(--error-bg)"
              textColor = "var(--error)"
              badgeText = "✗"
              badgeBg = "var(--error)"
              badgeColor = "white"
            }
          } else if (isSelected) {
            borderColor = "var(--sage)"
            bgColor = "var(--sage-light)"
            textColor = "var(--sage-dark)"
            badgeBg = "var(--sage)"
            badgeColor = "white"
          }

          return (
            <button
              key={key}
              onClick={isRevealed ? undefined : () => onPick(index, key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                borderRadius: "var(--radius-sm)",
                color: textColor,
                fontSize: "14px",
                textAlign: "left",
                fontWeight: isSelected || (isRevealed && isCorrect) ? "600" : "400",
                cursor: isRevealed ? "default" : "pointer",
                width: "100%",
              }}
            >
              <span style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: badgeBg,
                color: badgeColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "700",
                flexShrink: 0,
              }}>
                {badgeText}
              </span>
              {val}
            </button>
          )
        })}
      </div>

      {/* Check answer button */}
      {showCheckButton && (
        <button
          onClick={() => onCheck(index)}
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
})

// ── Main Quiz component ───────────────────────────────────────
export default function Quiz({ questions }) {
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})
  const [score, setScore] = useState(null)

  // useCallback prevents these functions from being
  // recreated on every render — keeps child components stable
  const handlePick = useCallback((qi, opt) => {
    setAnswers(prev => ({ ...prev, [qi]: opt }))
  }, [])

  const handleCheck = useCallback((qi) => {
    setRevealed(prev => ({ ...prev, [qi]: true }))
  }, [])

  const handleSubmitAll = useCallback(() => {
    const newRevealed = {}
    let correct = 0
    questions.forEach((q, i) => {
      newRevealed[i] = true
      if (answers[i] === q.answer) correct++
    })
    setRevealed(newRevealed)
    setScore(correct)
  }, [questions, answers])

  const handleReset = useCallback(() => {
    setAnswers({})
    setRevealed({})
    setScore(null)
  }, [])

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

  const allAnswered = questions.every((_, i) => answers[i] !== undefined)
  const allRevealed = questions.every((_, i) => revealed[i])

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
            marginBottom: "6px",
            fontFamily: "'Playfair Display', serif",
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
            onClick={handleReset}
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

      {/* Questions — each one isolated */}
      {questions.map((q, qi) => (
        <QuizQuestion
          key={qi}
          question={q}
          index={qi}
          selectedAnswer={answers[qi]}
          isRevealed={!!revealed[qi]}
          onPick={handlePick}
          onCheck={handleCheck}
          showCheckButton={
            !revealed[qi] &&
            !!answers[qi] &&
            !allRevealed
          }
        />
      ))}

      {/* Submit all */}
      {allAnswered && !allRevealed && (
        <div style={{
          textAlign: "center",
          marginTop: "8px",
          paddingBottom: "32px"
        }}>
          <button
            onClick={handleSubmitAll}
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