import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { TestSession } from "@sat-portal/shared";
import "./results.css";

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSessions()
      .then(sessions => {
        const found = sessions.find(s => s.id === sessionId) ?? null;
        setSession(found);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="results-loading">Loading results…</div>;
  if (!session || !session.score) return <div className="results-loading">Results not found.</div>;

  const score = session.score as any;
  const scaled: number = score.scaledScore;
  const correct: number = score.totalCorrect;
  const total: number = score.totalQuestions;
  const pct = Math.round((correct / total) * 100);
  const scoreRatio = (scaled - 400) / 1200; // 0–1

  return (
    <div className="results-shell">
      <div className="results-card">
        <div className="results-header">
          <span className="results-eyebrow">Test complete</span>
          <h1 className="results-title">Your results</h1>
          <p className="results-date">{fmtDate(session.startedAt)}</p>
        </div>

        {/* Scaled score dial */}
        <div className="score-dial-wrap">
          <svg className="score-dial" viewBox="0 0 200 120">
            <path
              d="M20 110 A 90 90 0 0 1 180 110"
              fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round"
            />
            <path
              d="M20 110 A 90 90 0 0 1 180 110"
              fill="none" stroke="var(--accent-dark)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${scoreRatio * 283} 283`}
              style={{ transition: "stroke-dasharray 1.2s ease" }}
            />
            <text x="100" y="95" textAnchor="middle" fill="var(--text)"
              style={{ fontFamily: "Lora, serif", fontSize: "2.2rem", fontWeight: 600 }}>
              {scaled}
            </text>
            <text x="100" y="115" textAnchor="middle" fill="var(--text-muted)"
              style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
              OUT OF 1600
            </text>
          </svg>
          <p className="score-range">400 – 1600</p>
        </div>

        {/* Section breakdown */}
        <div className="breakdown-section">
          <h2 className="breakdown-heading">Score breakdown</h2>
          <div className="breakdown-row">
            <span className="breakdown-label">Correct answers</span>
            <span className="breakdown-value">{correct} / {total}</span>
          </div>
          <div className="breakdown-bar-wrap">
            <div className="breakdown-bar">
              <div className="breakdown-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="breakdown-pct">{pct}%</span>
          </div>
          {score.sectionBreakdown?.map((sb: any) => (
            <div key={sb.section} className="breakdown-row breakdown-row-sub">
              <span className="breakdown-label">{sb.section === "math" ? "Math" : "Reading & Writing"}</span>
              <div className="sub-stats">
                <span className="stat-correct">{sb.correct} correct</span>
                <span className="stat-wrong">{sb.incorrect} wrong</span>
                <span className="stat-omit">{sb.omitted} omitted</span>
              </div>
            </div>
          ))}
        </div>

        {/* Performance band */}
        <div className="perf-band">
          <span className="perf-label">{perfBand(scaled)}</span>
        </div>

        <div className="results-actions">
          <button className="btn-primary" onClick={() => navigate("/")}>Back to dashboard</button>
        </div>
      </div>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function perfBand(score: number): string {
  if (score >= 1400) return "Exceptional — top 5%";
  if (score >= 1200) return "Strong — above average";
  if (score >= 1000) return "Solid — near the mean";
  if (score >= 800)  return "Developing — room to grow";
  return "Early stages — keep practicing";
}
