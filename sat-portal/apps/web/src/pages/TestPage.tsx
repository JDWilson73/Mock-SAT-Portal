import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Question, TestSession } from "@sat-portal/shared";
import "./test.css";

type Phase = "reading_writing" | "interstitial" | "math" | "submitting";
interface Answer { questionId: string; choiceId: string | null; }

export default function TestPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<TestSession | null>(null);
  const [rwQuestions, setRwQuestions] = useState<Question[]>([]);
  const [mathQuestions, setMathQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>("reading_writing");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerVisible, setTimerVisible] = useState(true);
  const [warnedFiveMin, setWarnedFiveMin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    Promise.all([
      api.getSession(sessionId),
      api.getSessionQuestions(sessionId),
    ]).then(([sess, questions]) => {
      setSession(sess);
      const rw = questions.filter(q => q.section === "reading_writing");
      const math = questions.filter(q => q.section === "math");
      setRwQuestions(rw);
      setMathQuestions(math);
      setTimeLeft(sess.rwTimeLimitSeconds ?? sess.timeLimitSeconds);
      setLoading(false);
    }).catch(console.error);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionId]);

  useEffect(() => {
    if (loading || phase === "interstitial" || phase === "submitting") return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        // Auto-show at 5 minutes remaining
        if (t === 301 && !warnedFiveMin) {
          setTimerVisible(true);
          setWarnedFiveMin(false);
          announce("5 minutes remaining in this section.");
        }
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

  function announce(msg: string) {
    if (announcerRef.current) {
      announcerRef.current.textContent = "";
      setTimeout(() => { if (announcerRef.current) announcerRef.current.textContent = msg; }, 50);
    }
  }

  function advanceToInterstitial() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("interstitial");
    setWarnedFiveMin(false);
    announce("Reading and Writing section complete. Review your results before beginning Math.");
  }

  function beginMathSection() {
    setCurrent(0);
    setTimeLeft(session?.mathTimeLimitSeconds ?? 4200);
    setTimerVisible(true);
    setPhase("math");
    announce("Math section begun. Good luck.");
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
      const wasFlagged = next.has(questionId);
      wasFlagged ? next.delete(questionId) : next.add(questionId);
      announce(wasFlagged ? "Question unflagged." : "Question flagged for review.");
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

  if (loading) return (
    <div className="test-loading" role="status" aria-live="polite">Loading test…</div>
  );

  // ── Interstitial ────────────────────────────────────────────────────────────
  if (phase === "interstitial") {
    const rwAnswered = rwQuestions.filter(q => answers[q.id] !== undefined).length;
    return (
      <div className="interstitial-shell" role="main">
        <div
          className="interstitial-card"
          role="region"
          aria-labelledby="interstitial-title"
        >
          <span className="interstitial-eyebrow" aria-hidden="true">Section complete</span>
          <h1 className="interstitial-title" id="interstitial-title">
            Reading &amp; Writing
          </h1>
          <p className="interstitial-stat" aria-label={`${rwAnswered} of ${rwQuestions.length} questions answered`}>
            {rwAnswered} of {rwQuestions.length} answered
          </p>
          <p className="interstitial-note">
            You cannot return to this section. Take a moment, then begin Math when ready.
          </p>
          <div className="interstitial-divider" aria-hidden="true" />
          <h2 className="interstitial-next" id="next-section-heading">Next: Math</h2>
          <p className="interstitial-next-desc" aria-describedby="next-section-heading">
            {mathQuestions.length} questions · {Math.round((session?.mathTimeLimitSeconds ?? 4200) / 60)} min
          </p>
          <button
            className="btn-begin"
            onClick={beginMathSection}
            aria-label="Begin the Math section"
          >
            Begin Math section →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "submitting") return (
    <div className="test-loading" role="status" aria-live="polite">Submitting your test…</div>
  );

  const questions = phase === "math" ? mathQuestions : rwQuestions;
  const q = questions[current];
  const answered = questions.filter(q => answers[q.id] !== undefined).length;
  const progress = answered / questions.length;
  const sectionLabel = phase === "reading_writing" ? "Reading & Writing" : "Math";
  const isLowTime = timeLeft < 300;

  return (
    <div className="test-shell">
      {/* Screen reader announcer (live region) */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Top bar */}
      <div className="test-topbar" role="banner">
        <span className="t-section" aria-label={`Current section: ${sectionLabel}`}>
          {sectionLabel}
        </span>

        {/* Timer with hide/show toggle */}
        <div className="timer-wrap">
          {timerVisible ? (
            <span
              className="t-timer"
              style={{ color: isLowTime ? "var(--danger)" : undefined }}
              aria-label={`Time remaining: ${fmtTimeVerbose(timeLeft)}`}
              aria-live="off"
            >
              {fmtTime(timeLeft)}
            </span>
          ) : (
            <span className="t-timer-hidden" aria-label="Timer hidden">
              ——:——
            </span>
          )}
          <button
            className="btn-timer-toggle"
            onClick={() => setTimerVisible(v => !v)}
            aria-label={timerVisible ? "Hide timer" : "Show timer"}
            aria-pressed={timerVisible}
          >
            {timerVisible ? "Hide" : "Show"}
          </button>
        </div>

        {phase === "reading_writing"
          ? <button
              className="btn-submit"
              onClick={advanceToInterstitial}
              aria-label="Finish Reading and Writing section and proceed to Math"
            >
              Finish section →
            </button>
          : <button
              className="btn-submit"
              onClick={handleSubmit}
              aria-label="Submit your completed test"
            >
              Submit test
            </button>
        }
      </div>

      {/* Progress bar */}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-label={`${answered} of ${questions.length} questions answered`}
      >
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="test-body" role="main">
        {/* Breadcrumb strip */}
        <nav aria-label="Question navigation">
          <div className="breadcrumb-strip" role="list">
            {questions.map((q, i) => (
              <button
                key={q.id}
                role="listitem"
                className={[
                  "crumb",
                  i === current ? "crumb-active" : "",
                  answers[q.id] !== undefined ? "crumb-answered" : "",
                  flagged.has(q.id) ? "crumb-flagged" : "",
                ].join(" ")}
                onClick={() => goTo(i)}
                aria-label={[
                  `Question ${i + 1}`,
                  answers[q.id] !== undefined ? "answered" : "unanswered",
                  flagged.has(q.id) ? "flagged for review" : "",
                  i === current ? "current question" : "",
                ].filter(Boolean).join(", ")}
                aria-current={i === current ? "true" : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </nav>

        {/* Question card */}
        <article
          className={`question-card ${transitioning ? "question-exit" : "question-enter"}`}
          aria-labelledby="question-prompt"
          aria-label={`Question ${current + 1} of ${questions.length}`}
        >
          <div className="question-meta">
            <span className="q-number" aria-hidden="true">
              Question {current + 1} of {questions.length}
            </span>
            <button
              className={`flag-btn ${flagged.has(q.id) ? "flagged" : ""}`}
              onClick={() => toggleFlag(q.id)}
              aria-label={flagged.has(q.id)
                ? "Remove flag from this question"
                : "Flag this question for review"}
              aria-pressed={flagged.has(q.id)}
            >
              {flagged.has(q.id) ? "⚑ Flagged" : "⚐ Flag"}
            </button>
          </div>

          <p className="question-difficulty" aria-label={`Subtype: ${q.subtype.replace("_", " ")}, Difficulty: ${q.difficulty}`}>
            {q.subtype.replace("_", " ")} · {q.difficulty}
          </p>

          <p className="question-prompt" id="question-prompt">{q.prompt}</p>

          <div
            className="choices"
            role="radiogroup"
            aria-labelledby="question-prompt"
          >
            {q.choices.map(c => (
              <button
                key={c.id}
                className={`choice ${answers[q.id] === c.id ? "choice-selected" : ""}`}
                onClick={() => selectChoice(q.id, c.id)}
                role="radio"
                aria-checked={answers[q.id] === c.id}
                aria-label={`Choice ${c.label}: ${c.text}`}
              >
                <span className="choice-label" aria-hidden="true">{c.label}</span>
                <span className="choice-text">{c.text}</span>
              </button>
            ))}
          </div>
        </article>

        {/* Navigation */}
        <nav className="test-nav" aria-label="Previous and next question">
          <button
            className="btn-nav"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            aria-label="Go to previous question"
          >
            ← Previous
          </button>
          <span className="nav-info" aria-live="polite" aria-atomic="true">
            {answered} of {questions.length} answered
          </span>
          <button
            className="btn-nav"
            onClick={() => goTo(current + 1)}
            disabled={current === questions.length - 1}
            aria-label="Go to next question"
          >
            Next →
          </button>
        </nav>
      </div>
    </div>
  );
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtTimeVerbose(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m} minute${m !== 1 ? "s" : ""} and ${sec} second${sec !== 1 ? "s" : ""}`;
}
