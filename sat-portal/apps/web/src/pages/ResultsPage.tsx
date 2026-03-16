import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { TestSession, SessionAnswer, Subtype } from "@sat-portal/shared";
import "./results.css";

const SUBTYPE_LABELS: Record<string, string> = {
  algebra: "Algebra", geometry: "Geometry",
  probability: "Probability", data_analysis: "Data Analysis",
  comprehension: "Comprehension", grammar: "Grammar",
  vocabulary: "Vocabulary", rhetoric: "Rhetoric",
};

const SUBTYPE_COLORS: Record<string, string> = {
  algebra: "#4a90d9", geometry: "#6fcf97",
  probability: "#f2994a", data_analysis: "#bb6bd9",
  comprehension: "#56ccf2", grammar: "#f2c94c",
  vocabulary: "#eb5757", rhetoric: "#27ae60",
};

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    api.getSession(sessionId)
      .then(setSession)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    if (!session?.answers || !canvasRef.current || animatedRef.current) return;
    animatedRef.current = true;
    drawPieChart(canvasRef.current, session.answers);
  }, [session]);

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) return <div className="results-loading">Loading results…</div>;
  if (!session || !session.score) return <div className="results-loading">Results not found.</div>;

  const score = session.score;
  const answers = (session.answers ?? []) as SessionAnswer[];
  const scaled = score.scaledScore;
  const correct = score.totalCorrect;
  const total = score.totalQuestions;
  const pct = Math.round((correct / total) * 100);
  const scoreRatio = (scaled - 400) / 1200;

  // Build subtype stats
  const subtypeMap: Record<string, { correct: number; total: number }> = {};
  for (const a of answers) {
    const st = a.question.subtype as string;
    if (!subtypeMap[st]) subtypeMap[st] = { correct: 0, total: 0 };
    subtypeMap[st].total++;
    if (a.isCorrect) subtypeMap[st].correct++;
  }

  return (
    <div className="results-shell">
      <div className="results-card">
        <div className="results-header">
          <span className="results-eyebrow">Test complete</span>
          <h1 className="results-title">Your results</h1>
          <p className="results-date">{fmtDate(session.startedAt)}</p>
        </div>

        {/* Score dial */}
        <div className="score-dial-wrap">
          <svg className="score-dial" viewBox="0 0 200 120">
            <path d="M20 110 A 90 90 0 0 1 180 110" fill="none"
              stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round"/>
            <path d="M20 110 A 90 90 0 0 1 180 110" fill="none"
              stroke="var(--accent-dark)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${scoreRatio * 283} 283`}
              style={{ transition: "stroke-dasharray 1.2s ease" }}/>
            <text x="100" y="95" textAnchor="middle" fill="var(--text)"
              style={{ fontFamily: "Lora, serif", fontSize: "2.2rem", fontWeight: 600 }}>
              {scaled}
            </text>
            <text x="100" y="115" textAnchor="middle" fill="var(--text-muted)"
              style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
              OUT OF 1600
            </text>
          </svg>
        </div>

        {/* Quick stats */}
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
        </div>

        {/* Pie chart */}
        <div className="breakdown-section">
          <h2 className="breakdown-heading">Performance by subtype</h2>
          <div className="pie-wrap">
            <canvas ref={canvasRef} width={220} height={220} className="pie-canvas" />
            <div className="pie-legend">
              {Object.entries(subtypeMap).map(([st, { correct, total }]) => (
                <div key={st} className="legend-row">
                  <span className="legend-dot" style={{ background: SUBTYPE_COLORS[st] ?? "#888" }} />
                  <span className="legend-label">{SUBTYPE_LABELS[st] ?? st}</span>
                  <span className="legend-stat">{correct}/{total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Question-by-question list */}
        <div className="breakdown-section">
          <h2 className="breakdown-heading">Question review</h2>
          <div className="q-review-list">
            {answers.map((a, i) => {
              const isOpen = expanded.has(a.id);
              const correctChoice = a.question.choices.find(c => c.id === a.question.correctChoiceId);
              return (
                <div key={a.id} className={`q-review-item ${a.isCorrect ? "q-correct" : "q-incorrect"}`}>
                  <button
                    className="q-review-header"
                    onClick={() => toggleExpanded(a.id)}
                  >
                    <span className={`q-num-badge ${a.isCorrect ? "badge-correct" : "badge-incorrect"}`}>
                      {i + 1}
                    </span>
                    <span className="q-review-subtype">
                      {SUBTYPE_LABELS[a.question.subtype] ?? a.question.subtype}
                    </span>
                    <span className="q-review-result">
                      {a.isCorrect ? "Correct ✓" : "Incorrect ✗"}
                    </span>
                    <span className="q-review-chevron">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="q-review-body">
                      <p className="q-review-prompt">{a.question.prompt}</p>
                      <div className="q-review-choices">
                        {a.question.choices.map(c => {
                          const wasSelected = a.choiceId === c.id;
                          const isCorrect = a.question.correctChoiceId === c.id;
                          return (
                            <div
                              key={c.id}
                              className={[
                                "q-review-choice",
                                isCorrect ? "review-correct" : "",
                                wasSelected && !isCorrect ? "review-wrong" : "",
                              ].join(" ")}
                            >
                              <span className="choice-label">{c.label}</span>
                              <span className="choice-text">{c.text}</span>
                              {isCorrect && <span className="review-tag correct-tag">Correct</span>}
                              {wasSelected && !isCorrect && <span className="review-tag wrong-tag">Your answer</span>}
                            </div>
                          );
                        })}
                      </div>
                      {a.question.explanation && (
                        <p className="q-review-explanation">{a.question.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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

function drawPieChart(canvas: HTMLCanvasElement, answers: SessionAnswer[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const subtypeMap: Record<string, { correct: number; total: number }> = {};
  for (const a of answers) {
    const st = a.question.subtype as string;
    if (!subtypeMap[st]) subtypeMap[st] = { correct: 0, total: 0 };
    subtypeMap[st].total++;
    if (a.isCorrect) subtypeMap[st].correct++;
  }

  const subtypes = Object.entries(subtypeMap);
  const total = subtypes.length;
  const cx = 110, cy = 110, r = 90, innerR = 48;
  const sliceAngle = (2 * Math.PI) / total;

  // Animate fill
  let frame = 0;
  const totalFrames = 60;

  function draw(progress: number) {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    subtypes.forEach(([st, { correct, total: stTotal }], i) => {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;
      const pct = correct / stTotal;
      const color = SUBTYPE_COLORS[st] ?? "#888";

      // Background slice (empty)
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.arc(cx, cy, r, startAngle, endAngle);
      ctx!.closePath();
      ctx!.fillStyle = color + "22";
      ctx!.fill();

      // Filled portion (animates from center outward, radially by pct)
      const fillEnd = startAngle + sliceAngle * pct * progress;
      if (fillEnd > startAngle) {
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.arc(cx, cy, r, startAngle, fillEnd);
        ctx!.closePath();
        ctx!.fillStyle = color;
        ctx!.globalAlpha = 0.85;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      // Slice separator
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(
        cx + r * Math.cos(startAngle),
        cy + r * Math.sin(startAngle)
      );
      ctx!.strokeStyle = "rgba(0,0,0,0.3)";
      ctx!.lineWidth = 1.5;
      ctx!.stroke();
    });

    // Donut hole
    ctx!.beginPath();
    ctx!.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx!.fillStyle = "#1a2f4e";
    ctx!.fill();

    // Center text
    ctx!.textAlign = "center";
    ctx!.fillStyle = "#eef2f8";
    ctx!.font = "600 18px Lora, serif";
    ctx!.fillText(`${Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100)}%`, cx, cy + 6);
  }

  function animate() {
    frame++;
    const progress = Math.min(frame / totalFrames, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    draw(eased);
    if (frame < totalFrames) requestAnimationFrame(animate);
  }

  animate();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
}

function perfBand(score: number): string {
  if (score >= 1400) return "Exceptional — top 5%";
  if (score >= 1200) return "Strong — above average";
  if (score >= 1000) return "Solid — near the mean";
  if (score >= 800)  return "Developing — room to grow";
  return "Early stages — keep practicing";
}
