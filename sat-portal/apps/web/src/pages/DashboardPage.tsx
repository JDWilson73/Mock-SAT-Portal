import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import type { TestSession } from "@sat-portal/shared";
import "./dashboard.css";

const SECTIONS = [
  { id: "full",            label: "Full Test",       desc: "Both sections · 60 min",  mins: 60 },
  { id: "math",            label: "Math",            desc: "Algebra, geometry, data",  mins: 32 },
  { id: "reading_writing", label: "Reading & Writing", desc: "Comprehension, grammar", mins: 32 },
] as const;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    api.getSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function startSession(section: typeof SECTIONS[number]["id"]) {
    setStarting(section);
    try {
      const session = await api.startSession({ section });
      navigate(`/test/${session.id}`);
    } catch (e) {
      console.error(e);
      setStarting(null);
    }
  }

  async function logoutRedirect() {
    await logout;
    navigate("/login");
  }

  const completed = sessions.filter(s => s.status === "completed");
  const best = completed.reduce<number | null>((acc, s) => {
    const sc = (s.score as any)?.scaledScore;
    return sc != null ? Math.max(acc ?? 0, sc) : acc;
  }, null);

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <div className="dash-brand">
          <span className="dash-eyebrow">SAT Portal</span>
          <h1 className="dash-greeting">
            Good {getTimeOfDay()}, {user?.name.split(" ")[0]}.
          </h1>
        </div>
        <button className="btn-ghost" onClick={logoutRedirect}>Sign out</button>
      </header>

      {best !== null && (
        <div className="dash-stat-bar">
          <div className="stat-item">
            <span className="stat-label">Best score</span>
            <span className="stat-value">{best}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tests taken</span>
            <span className="stat-value">{completed.length}</span>
          </div>
        </div>
      )}

      <section className="dash-section">
        <h2 className="section-heading">Start a test</h2>
        <div className="test-grid">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className="test-card"
              onClick={() => startSession(s.id)}
              disabled={starting !== null}
            >
              {starting === s.id
                ? <span className="test-card-loading">Starting…</span>
                : <>
                    <span className="test-card-label">{s.label}</span>
                    <span className="test-card-desc">{s.desc}</span>
                    <span className="test-card-mins">{s.mins} min</span>
                  </>
              }
            </button>
          ))}
        </div>
      </section>

      <section className="dash-section">
        <h2 className="section-heading">Recent history</h2>
        {loading ? (
          <p className="muted-text">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="muted-text">No tests taken yet. Start one above.</p>
        ) : (
          <div className="history-list">
            {sessions.slice(0, 8).map(s => (
              <div
                key={s.id}
                className="history-row"
                onClick={() => s.status === "completed" && navigate(`/results/${s.id}`)}
                style={{ cursor: s.status === "completed" ? "pointer" : "default" }}
              >
                <div className="history-left">
                  <span className="history-section">{sectionLabel(s.section)}</span>
                  <span className="history-date">{fmtDate(s.startedAt)}</span>
                </div>
                <div className="history-right">
                  {s.status === "completed"
                    ? <span className="score-pill">{(s.score as any)?.scaledScore ?? "—"}</span>
                    : <span className="status-pill status-pending">In progress</span>
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
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
