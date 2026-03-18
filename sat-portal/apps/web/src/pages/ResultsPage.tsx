import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { TestSession, SessionAnswer } from "@sat-portal/shared";
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

// Fixed order so the chart is always consistent
const SUBTYPE_ORDER = [
  "algebra", "geometry", "probability", "data_analysis",
  "comprehension", "grammar", "vocabulary", "rhetoric",
];

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
    drawRadarChart(canvasRef.current, session.answers as SessionAnswer[]);
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

  // Find where R&W ends and Math begins for the separator
  const rwMathBoundary = answers.findIndex(
    (a, i) => i > 0 && a.question.section === "math" && answers[i - 1].question.section === "reading_writing"
  );

  return (
    <div className="results-shell" role="main">
      <div className="results-card" role="region" aria-labelledby="results-title">
        <div className="results-header">
          <span className="results-eyebrow">Test complete</span>
          <h1 className="results-title" id="results-title">Your results</h1>
          <p className="results-date">{fmtDate(session.startedAt)}</p>
        </div>

        {/* Score dial */}
        <div className="score-dial-wrap">
          <svg className="score-dial" viewBox="0 0 200 120" role="img" aria-label={`SAT scaled score: ${scaled} out of 1600`}>
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

        {/* Radial bar chart */}
        <div className="breakdown-section">
          <h2 className="breakdown-heading">Performance by subtype</h2>
          <div className="pie-wrap">
            <canvas ref={canvasRef} width={240} height={240} className="pie-canvas" role="img" aria-label="Radial bar chart showing performance percentage per question subtype" />
            <div className="pie-legend">
              {SUBTYPE_ORDER.filter(st => subtypeMap[st]).map(st => (
                <div key={st} className="legend-row">
                  <span className="legend-dot" style={{ background: SUBTYPE_COLORS[st] }} />
                  <span className="legend-label">{SUBTYPE_LABELS[st]}</span>
                  <span className="legend-stat">
                    {subtypeMap[st].correct}/{subtypeMap[st].total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Question-by-question list */}
        <div className="breakdown-section">
          <h2 className="breakdown-heading">Question review</h2>
          <div className="q-review-list" role="list" aria-label="Question review">
            {answers.map((a, i) => {
              const isOpen = expanded.has(a.id);
              const isFirstMath = i === rwMathBoundary;
              return (
                <div key={a.id}>
                  {isFirstMath && (
                    <div className="section-separator">
                      <span className="section-separator-label">Math</span>
                    </div>
                  )}
                  {i === 0 && (
                    <div className="section-separator">
                      <span className="section-separator-label">Reading &amp; Writing</span>
                    </div>
                  )}
                  <div className={`q-review-item ${a.isCorrect ? "q-correct" : "q-incorrect"}`} role="listitem">
                    <button
                      className="q-review-header" aria-expanded={isOpen} aria-controls={`review-body-${a.id}`}
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
                      <div className="q-review-body" id={`review-body-${a.id}`}>
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

function drawRadarChart(canvas: HTMLCanvasElement, answers: SessionAnswer[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Build subtype stats in fixed order
  const subtypeMap: Record<string, { correct: number; total: number }> = {};
  for (const a of answers) {
    const st = a.question.subtype as string;
    if (!subtypeMap[st]) subtypeMap[st] = { correct: 0, total: 0 };
    subtypeMap[st].total++;
    if (a.isCorrect) subtypeMap[st].correct++;
  }

  const subtypes = SUBTYPE_ORDER.filter(st => subtypeMap[st]);
  const n = subtypes.length;
  const cx = 120, cy = 120;
  const maxR = 95;    // outer edge (100% correct)
  const minR = 22;    // inner hub radius
  const sliceAngle = (2 * Math.PI) / n;

  let frame = 0;
  const totalFrames = 75;

  function draw(progress: number) {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    // ── Concentric guide rings ──────────────────────────────────────────────
    const rings = [0.25, 0.5, 0.75, 1.0];
    rings.forEach(ratio => {
      ctx!.beginPath();
      ctx!.arc(cx, cy, minR + (maxR - minR) * ratio, 0, 2 * Math.PI);
      ctx!.strokeStyle = "rgba(255,255,255,0.07)";
      ctx!.lineWidth = 1;
      ctx!.stroke();
    });

    // ── Spoke lines ─────────────────────────────────────────────────────────
    subtypes.forEach((_, i) => {
      const angle = i * sliceAngle - Math.PI / 2;
      ctx!.beginPath();
      ctx!.moveTo(cx + minR * Math.cos(angle), cy + minR * Math.sin(angle));
      ctx!.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
      ctx!.strokeStyle = "rgba(255,255,255,0.12)";
      ctx!.lineWidth = 1;
      ctx!.stroke();
    });

    // ── Bars ────────────────────────────────────────────────────────────────
    subtypes.forEach((st, i) => {
      const { correct, total: stTotal } = subtypeMap[st];
      const pct = correct / stTotal;
      const color = SUBTYPE_COLORS[st] ?? "#888";

      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle * 0.82; // slight gap between bars
      const barR = minR + (maxR - minR) * pct * progress;

      // Background wedge (full extent, dim)
      ctx!.beginPath();
      ctx!.moveTo(cx + minR * Math.cos(startAngle), cy + minR * Math.sin(startAngle));
      ctx!.arc(cx, cy, maxR, startAngle, endAngle);
      ctx!.arc(cx, cy, minR, endAngle, startAngle, true);
      ctx!.closePath();
      ctx!.fillStyle = color + "18";
      ctx!.fill();

      // Filled bar (grows outward from minR to barR)
      if (barR > minR) {
        ctx!.beginPath();
        ctx!.moveTo(cx + minR * Math.cos(startAngle), cy + minR * Math.sin(startAngle));
        ctx!.arc(cx, cy, barR, startAngle, endAngle);
        ctx!.arc(cx, cy, minR, endAngle, startAngle, true);
        ctx!.closePath();
        ctx!.fillStyle = color;
        ctx!.globalAlpha = 0.88;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      // Outer arc stroke on filled bar
      if (barR > minR) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, barR, startAngle, endAngle);
        ctx!.strokeStyle = color;
        ctx!.lineWidth = 1.5;
        ctx!.globalAlpha = 0.6;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      // Label at outer edge
      const labelAngle = startAngle + (sliceAngle * 0.82) / 2;
      const labelR = maxR + 14;
      const lx = cx + labelR * Math.cos(labelAngle);
      const ly = cy + labelR * Math.sin(labelAngle);
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillStyle = "rgba(168,212,255,0.7)";
      ctx!.font = "500 9.5px 'DM Sans', sans-serif";
      // Abbreviate labels for space
      const short: Record<string, string> = {
        algebra: "Alg", geometry: "Geo", probability: "Prob",
        data_analysis: "Data", comprehension: "Comp",
        grammar: "Gram", vocabulary: "Vocab", rhetoric: "Rhet",
      };
      ctx!.fillText(short[st] ?? st, lx, ly);
    });

    // ── Center hub ──────────────────────────────────────────────────────────
    ctx!.beginPath();
    ctx!.arc(cx, cy, minR, 0, 2 * Math.PI);
    ctx!.fillStyle = "#2a5298";
    ctx!.fill();
    ctx!.beginPath();
    ctx!.arc(cx, cy, minR, 0, 2 * Math.PI);
    ctx!.strokeStyle = "rgba(255,255,255,0.15)";
    ctx!.lineWidth = 1;
    ctx!.stroke();

    // Center % text
    const overallPct = Math.round(
      (answers.filter(a => a.isCorrect).length / answers.length) * 100
    );
    ctx!.textAlign = "center";
    ctx!.textBaseline = "middle";
    ctx!.fillStyle = "#f0f4ff";
    ctx!.font = "600 13px 'Lora', serif";
    ctx!.fillText(`${overallPct}%`, cx, cy);
  }

  function animate() {
    frame++;
    const progress = Math.min(frame / totalFrames, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    draw(eased);
    if (frame < totalFrames) requestAnimationFrame(animate);
  }

  animate();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function perfBand(score: number): string {
  if (score >= 1400) return "Exceptional — top 5%";
  if (score >= 1200) return "Strong — above average";
  if (score >= 1000) return "Solid — near the mean";
  if (score >= 800)  return "Developing — room to grow";
  return "Early stages — keep practicing";
}
