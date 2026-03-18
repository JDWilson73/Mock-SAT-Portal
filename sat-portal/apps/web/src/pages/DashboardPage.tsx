import { useEffect, useState, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import type { TestSession, TestLength } from "@sat-portal/shared";
import { QUESTION_COUNTS, SECTION_TIMES } from "@sat-portal/shared";
import "./dashboard.css";

type SectionChoice = "full" | "math" | "reading_writing";

const LENGTH_LABELS: Record<TestLength, string> = {
  full: "Full length", half: "Half length", quarter: "Quarter length",
};

function describeLengthSection(length: TestLength, section: SectionChoice): string {
  if (section === "full") {
    const rw = QUESTION_COUNTS.reading_writing[length];
    const m = QUESTION_COUNTS.math[length];
    const rwMins = Math.round(SECTION_TIMES.reading_writing[length] / 60);
    const mMins = Math.round(SECTION_TIMES.math[length] / 60);
    return `${rw + m} questions · R&W ${rwMins} min + Math ${mMins} min`;
  }
  if (section === "reading_writing") {
    const q = QUESTION_COUNTS.reading_writing[length];
    const mins = Math.round(SECTION_TIMES.reading_writing[length] / 60);
    return `${q} questions · ${mins} min`;
  }
  const q = QUESTION_COUNTS.math[length];
  const mins = Math.round(SECTION_TIMES.math[length] / 60);
  return `${q} questions · ${mins} min`;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  // Test config
  const [section, setSection] = useState<SectionChoice>("full");
  const [testLength, setTestLength] = useState<TestLength>("full");
  const [extraTime, setExtraTime] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState(0);

  const extraTimeId = useId();
  const extraMinsId = useId();

  useEffect(() => {
    api.getSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function startSession() {
    setStarting(true);
    try {
      const session = await api.startSession({
        section,
        testLength,
        extraMinutes: extraTime ? extraMinutes : 0,
      });
      navigate(`/test/${session.id}`);
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  }

  async function logoutRedirect() {
    await logout();
    navigate('/login');
  }

  const completed = sessions.filter(s => s.status === "completed");
  const best = completed.reduce<number | null>((acc, s) => {
    const sc = (s.score as any)?.scaledScore;
    return sc != null ? Math.max(acc ?? 0, sc) : acc;
  }, null);

  const lengthOptions: TestLength[] = ["full", "half", "quarter"];
  const sectionOptions: { id: SectionChoice; label: string }[] = [
    { id: "full", label: "Full test" },
    { id: "reading_writing", label: "Reading & Writing only" },
    { id: "math", label: "Math only" },
  ];

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <div className="dash-brand">
          <span className="dash-eyebrow">SAT Portal</span>
          <h1 className="dash-greeting">
            Good {getTimeOfDay()}, {user?.name.split(" ")[0]}.
          </h1>
        </div>
        <button className="btn-ghost" onClick={logoutRedirect} aria-label="Sign out of your account">
          Sign out
        </button>
      </header>

      {best !== null && (
        <div className="dash-stat-bar" role="region" aria-label="Your statistics">
          <div className="stat-item">
            <span className="stat-label" id="stat-best">Best score</span>
            <span className="stat-value" aria-labelledby="stat-best">{best}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label" id="stat-count">Tests taken</span>
            <span className="stat-value" aria-labelledby="stat-count">{completed.length}</span>
          </div>
        </div>
      )}

      {/* ── Test configuration ─────────────────────────────────────────────── */}
      <section className="dash-section" aria-labelledby="start-heading">
        <h2 className="section-heading" id="start-heading">Start a test</h2>

        {/* Section selector */}
        <fieldset className="config-fieldset" aria-label="Select test section">
          <legend className="config-legend">Section</legend>
          <div className="radio-group" role="radiogroup">
            {sectionOptions.map(opt => (
              <label key={opt.id} className={`radio-card ${section === opt.id ? "radio-card-selected" : ""}`}>
                <input
                  type="radio"
                  name="section"
                  value={opt.id}
                  checked={section === opt.id}
                  onChange={() => setSection(opt.id)}
                  className="sr-only"
                  aria-label={opt.label}
                />
                <span className="radio-card-label">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Length selector */}
        <fieldset className="config-fieldset" aria-label="Select test length">
          <legend className="config-legend">Length</legend>
          <div className="radio-group" role="radiogroup">
            {lengthOptions.map(len => (
              <label key={len} className={`radio-card ${testLength === len ? "radio-card-selected" : ""}`}>
                <input
                  type="radio"
                  name="testLength"
                  value={len}
                  checked={testLength === len}
                  onChange={() => setTestLength(len)}
                  className="sr-only"
                  aria-label={`${LENGTH_LABELS[len]}: ${describeLengthSection(len, section)}`}
                />
                <span className="radio-card-label">{LENGTH_LABELS[len]}</span>
                <span className="radio-card-desc">{describeLengthSection(len, section)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Accessibility: extra time */}
        <div className="config-fieldset">
          <div className="extra-time-row">
            <input
              type="checkbox"
              id={extraTimeId}
              checked={extraTime}
              onChange={e => setExtraTime(e.target.checked)}
              aria-describedby="extra-time-hint"
            />
            <label htmlFor={extraTimeId} className="extra-time-label">
              Extended time accommodation
            </label>
          </div>
          <p id="extra-time-hint" className="config-hint">
            Add extra minutes to each section for accessibility needs.
          </p>
          {extraTime && (
            <div className="extra-time-input-row">
              <label htmlFor={extraMinsId} className="config-legend">
                Additional minutes per section
              </label>
              <input
                type="number"
                id={extraMinsId}
                min={0}
                max={120}
                value={extraMinutes}
                onChange={e => setExtraMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="extra-time-input"
                aria-label="Number of extra minutes per section"
              />
            </div>
          )}
        </div>

        <button
          className="btn-start"
          onClick={startSession}
          disabled={starting}
          aria-busy={starting}
          aria-label={`Start ${LENGTH_LABELS[testLength].toLowerCase()} ${section === "full" ? "test" : section.replace("_", " ") + " test"}`}
        >
          {starting ? "Starting…" : "Start test →"}
        </button>
      </section>

      {/* ── History ────────────────────────────────────────────────────────── */}
      <section className="dash-section" aria-labelledby="history-heading">
        <h2 className="section-heading" id="history-heading">Recent history</h2>
        {loading ? (
          <p className="muted-text" aria-live="polite">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="muted-text">No tests taken yet. Start one above.</p>
        ) : (
          <div className="history-list" role="list">
            {sessions.slice(0, 8).map(s => (
              <div
                key={s.id}
                className="history-row"
                role="listitem"
                onClick={() => s.status === "completed" && navigate(`/results/${s.id}`)}
                onKeyDown={e => e.key === "Enter" && s.status === "completed" && navigate(`/results/${s.id}`)}
                tabIndex={s.status === "completed" ? 0 : undefined}
                style={{ cursor: s.status === "completed" ? "pointer" : "default" }}
                aria-label={
                  s.status === "completed"
                    ? `${sectionLabel(s.section)} on ${fmtDate(s.startedAt)}, score ${(s.score as any)?.scaledScore ?? "unavailable"}. Press Enter to view results.`
                    : `${sectionLabel(s.section)} on ${fmtDate(s.startedAt)}, in progress`
                }
              >
                <div className="history-left">
                  <span className="history-section">{sectionLabel(s.section)}</span>
                  <span className="history-date">{fmtDate(s.startedAt)}</span>
                </div>
                <div className="history-right">
                  {s.status === "completed"
                    ? <span className="score-pill" aria-label={`Score: ${(s.score as any)?.scaledScore ?? "—"}`}>
                        {(s.score as any)?.scaledScore ?? "—"}
                      </span>
                    : <span className="status-pill status-pending" aria-label="Test in progress">In progress</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function sectionLabel(s: string) {
  if (s === "full") return "Full Test";
  if (s === "math") return "Math";
  return "Reading & Writing";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
