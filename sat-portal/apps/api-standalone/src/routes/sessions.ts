import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
const QUESTION_COUNTS = {
  reading_writing: { full: 54, half: 27, quarter: 14 },
  math:            { full: 44, half: 22, quarter: 11 },
} as const;

const SECTION_TIMES = {
  reading_writing: { full: 64 * 60, half: 32 * 60, quarter: 16 * 60 },
  math:            { full: 70 * 60, half: 35 * 60, quarter: 18 * 60 },
} as const;

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

const StartSchema = z.object({
  section: z.enum(["math", "reading_writing", "full"]),
  testLength: z.enum(["full", "half", "quarter"]).default("full"),
  extraMinutes: z.number().min(0).max(120).default(0),
});

const SubmitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    choiceId: z.string().uuid().nullable(),
  })),
});

sessionsRouter.post("/", async (req: AuthRequest, res) => {
  const parsed = StartSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const { section, testLength, extraMinutes } = parsed.data;
  const extraSecs = extraMinutes * 60;

  const rwTime = SECTION_TIMES.reading_writing[testLength] + extraSecs;
  const mathTime = SECTION_TIMES.math[testLength] + extraSecs;
  const totalTime = section === "full"
    ? rwTime + mathTime
    : section === "reading_writing" ? rwTime : mathTime;

  const session = await prisma.testSession.create({
    data: {
      userId: req.userId!,
      section,
      testLength,
      status: "in_progress",
      timeLimitSeconds: totalTime,
      rwTimeLimitSeconds: rwTime,
      mathTimeLimitSeconds: mathTime,
    },
  });
  res.status(201).json(session);
});

sessionsRouter.get("/", async (req: AuthRequest, res) => {
  const sessions = await prisma.testSession.findMany({
    where: { userId: req.userId! },
    orderBy: { startedAt: "desc" },
    include: { score: true },
  });
  res.json(sessions);
});

sessionsRouter.get("/:id", async (req: AuthRequest, res) => {
  const session = await prisma.testSession.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: {
      score: true,
      answers: {
        include: {
          question: { include: { choices: true } },
          choice: true,
        },
        orderBy: [
          { question: { section: "asc" } },
          { question: { subtype: "asc" } },
        ],
      },
    },
  });
  if (!session) return res.status(404).json({ message: "Session not found" });
  res.json(session);
});

sessionsRouter.post("/:id/submit", async (req: AuthRequest, res) => {
  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

  const session = await prisma.testSession.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!session) return res.status(404).json({ message: "Session not found" });
  if (session.status !== "in_progress")
    return res.status(409).json({ message: "Session already completed" });

  const questions = await prisma.question.findMany({
    where: { id: { in: parsed.data.answers.map(a => a.questionId) } },
  });

  let correct = 0;
  const answerRecords = parsed.data.answers.map(a => {
    const q = questions.find(q => q.id === a.questionId);
    const isCorrect = q ? q.correctChoiceId === a.choiceId : false;
    if (isCorrect) correct++;
    return { sessionId: session.id, questionId: a.questionId, choiceId: a.choiceId, isCorrect };
  });

  await prisma.sessionAnswer.createMany({ data: answerRecords });
  const scaledScore = Math.round(400 + (correct / Math.max(questions.length, 1)) * 1200);
  const score = await prisma.score.create({
    data: { sessionId: session.id, totalCorrect: correct, totalQuestions: questions.length, scaledScore },
  });
  await prisma.testSession.update({
    where: { id: session.id },
    data: { status: "completed", completedAt: new Date() },
  });
  res.json({ score });
});

// Return question set for a session based on its testLength and section
sessionsRouter.get("/:id/questions", async (req: AuthRequest, res) => {
  const session = await prisma.testSession.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!session) return res.status(404).json({ message: "Session not found" });

  const length = (session.testLength ?? "full") as "full" | "half" | "quarter";
  const sections = session.section === "full"
    ? (["reading_writing", "math"] as const)
    : ([session.section] as const);

  const questionSets = await Promise.all(
    sections.map(async sec => {
      const count = QUESTION_COUNTS[sec as "reading_writing" | "math"][length];
      // Fetch more than needed, then randomly sample
      const all = await prisma.question.findMany({
        where: { section: sec },
        include: { choices: true },
      });
      // Fisher-Yates shuffle then take the required count
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      return all.slice(0, count);
    })
  );

  const all = questionSets.flat().map(({ correctChoiceId: _, ...q }) => q);
  res.json(all);
});
