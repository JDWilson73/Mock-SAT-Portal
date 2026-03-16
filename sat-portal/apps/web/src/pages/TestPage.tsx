import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Question } from "@sat-portal/shared";
import "./test.css";

type Phase = "reading_writing" | "interstitial" | "math" | "submitting";
interface Answer { questionId: string; choiceId: string | null; }

const SECTION_TIME = 1920; // 32 min per section

export default function TestPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [rwQuestions, setRwQuestions] = useState<Question[]>([]);
  const [mathQuestions, setMathQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>("reading_writing");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(SECTION_TIME);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived
  const isInterstitial = phase === "interstitial";
  const questions = phase === "math" ? mathQuestions : rwQuestions;
  const q = questions[current];

  useEffect(() => {
    Promise.all([
      api.getQuestions({ section: "reading_writing", limit: 10 }),
      api.getQuestions({ section: "math", limit: 10 }),
    ]).then(([rw, math]) => {
      setRwQuestions(rw);
      setMathQuestions(math);
      setLoading(false);
    }).catch(console.error);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Timer — resets between sections
  useEffect(() => {
    if (loading || isInterstitial || phase === "submitting") return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (phase === "reading_writing") advanceToInterstitial();
          else handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, loading]);

  function advanceToInterstitial() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("interstitial");
  }

  function beginMathSection() {
    setCurrent(0);
    setTimeLeft(SECTION_TIME);
    setPhase("math");
  }

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
    if (!sessionId || phase === "submitting") return;
    setPhase("submitting");
    if (timerRef.current) clearInterval(timerRef.current);
    const allQuestions = [...rwQuestions, ...mathQuestions];
    const payload: Answer[] = allQuestions.map(q => ({
      questionId: q.id,
      choiceId: answers[q.id] ?? null,
    }));
    try {
      await api.submitSession(sessionId, { answers: payload });
      navigate(`/results/${sessionId}`);
    } catch (e) {
      console.error(e);
      setPhase("math");
    }
  }

  if (loading) return <div className="test-loading">Loading test…</div>;

  // ── Interstitial ────────────────────────────────────────────────────────────
  if (isInterstitial) {
    const rwAnswered = rwQuestions.filter(q => answers[q.id] !== undefined).length;
    return (
      <div className="interstitial-shell">
        <div className="interstitial-card">
          <span className="interstitial-eyebrow">Section complete</span>
          <h1 className="interstitial-title">Reading &amp; Writing</h1>
          <p className="interstitial-stat">{rwAnswered} of {rwQuestions.length} answered</p>
          <p className="interstitial-note">
            You cannot return to this section. Take a moment, then begin Math when ready.
          </p>
          <div className="interstitial-divider" />
          <h2 className="interstitial-next">Next: Math</h2>
          <p className="interstitial-next-desc">32 minutes · {mathQuestions.length} questions</p>
          <button className="btn-begin" onClick={beginMathSection}>Begin Math section →</button>
        </div>
      </div>
    );
  }

  if (phase === "submitting") return <div className="test-loading">Submitting your test…</div>;

  const answered = Object.keys(answers).filter(id =>
    questions.some(q => q.id === id)
  ).length;
  const progress = answered / questions.length;
  const sectionLabel = phase === "reading_writing" ? "Reading & Writing" : "Math";

  return (
    <div className="test-shell">
      <div className="test-topbar">
        <span className="t-section">{sectionLabel}</span>
        <span className="t-timer" style={{ color: timeLeft < 300 ? "var(--danger)" : undefined }}>
          {fmtTime(timeLeft)}
        </span>
        {phase === "reading_writing"
          ? <button className="btn-submit" onClick={advanceToInterstitial}>Finish section →</button>
          : <button className="btn-submit" onClick={handleSubmit}>Submit test</button>
        }
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="test-body">
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
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className={`question-card ${transitioning ? "question-exit" : "question-enter"}`}>
          <div className="question-meta">
            <span className="q-number">Question {current + 1} of {questions.length}</span>
            <button
              className={`flag-btn ${flagged.has(q.id) ? "flagged" : ""}`}
              onClick={() => toggleFlag(q.id)}
            >
              {flagged.has(q.id) ? "⚑ Flagged" : "⚐ Flag"}
            </button>
          </div>
          <p className="question-difficulty">
            {q.subtype.replace("_", " ")} · {q.difficulty}
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

        <div className="test-nav">
          <button className="btn-nav" onClick={() => goTo(current - 1)} disabled={current === 0}>← Previous</button>
          <span className="nav-info">{answered} of {questions.length} answered</span>
          <button className="btn-nav" onClick={() => goTo(current + 1)} disabled={current === questions.length - 1}>Next →</button>
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
