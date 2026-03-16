import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "*", credentials: true }));
app.use(express.json());

// ── Auth ──────────────────────────────────────────────────────────────────────
function signTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "15m") as any,
  });
  const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as any,
  });
  return { accessToken, refreshToken };
}

function requireAuth(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "Missing or invalid token" });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}

app.post("/auth/register", async (req, res) => {
  const Schema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) });
  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const { email, password, name } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ message: "Email already in use" });
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash: hash, name } });
  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, ...signTokens(user.id) });
});

app.post("/auth/login", async (req, res) => {
  const Schema = z.object({ email: z.string().email(), password: z.string() });
  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash)))
    return res.status(401).json({ message: "Invalid credentials" });
  res.json({ user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, ...signTokens(user.id) });
});

app.post("/auth/refresh", (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { sub: string };
    res.json(signTokens(payload.sub));
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// ── Questions ─────────────────────────────────────────────────────────────────
app.get("/questions", requireAuth, async (req: any, res) => {
  const { section, difficulty, limit } = req.query as Record<string, string>;
  const questions = await prisma.question.findMany({
    where: { ...(section && { section }), ...(difficulty && { difficulty }) },
    include: { choices: true },
    take: limit ? parseInt(limit) : 20,
    orderBy: { createdAt: "asc" },
  });
  res.json(questions.map(({ correctChoiceId: _, ...q }) => q));
});

// ── Sessions ──────────────────────────────────────────────────────────────────
app.post("/sessions", requireAuth, async (req: any, res) => {
  const Schema = z.object({ section: z.enum(["math", "reading_writing", "full"]) });
  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const timeLimitSeconds = parsed.data.section === "full" ? 3600 : 1920;
  const session = await prisma.testSession.create({
    data: { userId: req.userId, section: parsed.data.section, status: "in_progress", timeLimitSeconds },
  });
  res.status(201).json(session);
});

app.get("/sessions", requireAuth, async (req: any, res) => {
  const sessions = await prisma.testSession.findMany({
    where: { userId: req.userId },
    orderBy: { startedAt: "desc" },
    include: { score: true },
  });
  res.json(sessions);
});

app.post("/sessions/:id/submit", requireAuth, async (req: any, res) => {
  const Schema = z.object({
    answers: z.array(z.object({ questionId: z.string().uuid(), choiceId: z.string().uuid().nullable() })),
  });
  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const session = await prisma.testSession.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!session) return res.status(404).json({ message: "Session not found" });
  if (session.status !== "in_progress") return res.status(409).json({ message: "Session already completed" });
  const questions = await prisma.question.findMany({ where: { id: { in: parsed.data.answers.map(a => a.questionId) } } });
  let correct = 0;
  const answerRecords = parsed.data.answers.map(a => {
    const q = questions.find(q => q.id === a.questionId);
    const isCorrect = q ? q.correctChoiceId === a.choiceId : false;
    if (isCorrect) correct++;
    return { sessionId: session.id, questionId: a.questionId, choiceId: a.choiceId, isCorrect };
  });
  await prisma.sessionAnswer.createMany({ data: answerRecords });
  const scaledScore = Math.round(400 + (correct / questions.length) * 1200);
  const score = await prisma.score.create({
    data: { sessionId: session.id, totalCorrect: correct, totalQuestions: questions.length, scaledScore },
  });
  await prisma.testSession.update({ where: { id: session.id }, data: { status: "completed", completedAt: new Date() } });
  res.json({ score });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

export default app;
