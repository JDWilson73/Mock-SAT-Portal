import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Question } from "@sat-portal/shared";
import "./test.css";

interface Answer { questionId: string; choiceId: string | null; }

export default function TestPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.getQuestions({ limit: 20 })
      .then(qs => {
        setQuestions(qs);
        setTimeLeft(qs.length * 96); // ~96s per question
        setLoading(false);
      })
      .catch(console.error);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t === null || t <= 1) { clearInterval(timerRef.current!); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft !== null && timeLeft > 0 ? "running" : "stopped"]);

  const goTo = useCallback((index: number) => {
    if (index === current) return;
    setTransitioning(true);
    setTimeout(() => { setCurrent(index); setTransitioning(false); }, 180);
  }, [current]);

  function selectChoice(questionId: string, choiceId: string) {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }));
  }

  function toggleFlag(questionId: string) {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  }

  async function handleSubmit() {
    if (submitting || !sessionId) return;
    setSubmitting(true);
    const payload: Answer[] = questions.map(q => ({
      questionId: q.id,
      choiceId: answers[q.id] ?? null,
    }));
    try {
      await api.submitSession(sessionId, { answers: payload });
      navigate(`/results/${sessionId}`);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  }

  if (loading) return <div className="test-loading">Loading test…</div>;

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progress = answered / questions.length;

  return (
    <div className="test-shell">
      {/* Top bar */}
      <div className="test-topbar">
        <div className="test-topbar-left">
          <span className="test-section-label">{q.section === "math" ? "Math" : "Reading & Writing"}</span>
        </div>
        <div className="test-timer" style={{ color: timeLeft !== null && timeLeft < 300 ? "var(--danger)" : undefined }}>
          {timeLeft !== null ? fmtTime(timeLeft) : "—"}
        </div>
        <button
          className="btn-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit test"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="test-body">
        {/* Question breadcrumbs */}
        <div className="breadcrumb-strip">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={[
                "crumb",
                i === current ? "crumb-active" : "",
                answers[q.id] !== undefined ? "crumb-answered" : "",
                flagged.has(q.id) ? "crumb-flagged" : "",
              ].join(" ")}
              onClick={() => goTo(i)}
              title={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <div className={`question-card ${transitioning ? "question-exit" : "question-enter"}`}>
          <div className="question-meta">
            <span className="q-number">Question {current + 1} of {questions.length}</span>
            <button
              className={`flag-btn ${flagged.has(q.id) ? "flagged" : ""}`}
              onClick={() => toggleFlag(q.id)}
              title="Flag for review"
            >
              {flagged.has(q.id) ? "⚑ Flagged" : "⚐ Flag"}
            </button>
          </div>

          <p className="question-difficulty">
            {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
          </p>

          <p className="question-prompt">{q.prompt}</p>

          <div className="choices">
            {q.choices.map(c => (
              <button
                key={c.id}
                className={`choice ${answers[q.id] === c.id ? "choice-selected" : ""}`}
                onClick={() => selectChoice(q.id, c.id)}
              >
                <span className="choice-label">{c.label}</span>
                <span className="choice-text">{c.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="test-nav">
          <button
            className="btn-nav"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
          >
            ← Previous
          </button>
          <span className="nav-progress-text">
            {answered} of {questions.length} answered
          </span>
          <button
            className="btn-nav"
            onClick={() => goTo(current + 1)}
            disabled={current === questions.length - 1}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
