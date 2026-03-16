import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

const StartSchema = z.object({ section: z.enum(["math", "reading_writing", "full"]) });
const SubmitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    choiceId: z.string().uuid().nullable(),
  })),
});

sessionsRouter.post("/", async (req: AuthRequest, res) => {
  const parsed = StartSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const timeLimitSeconds = parsed.data.section === "full" ? 3600 : 1920;
  const session = await prisma.testSession.create({
    data: { userId: req.userId!, section: parsed.data.section, status: "in_progress", timeLimitSeconds },
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

// Get a single session with full answer detail (for results page)
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
  if (session.status !== "in_progress") return res.status(409).json({ message: "Session already completed" });

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
  const scaledScore = Math.round(400 + (correct / questions.length) * 1200);
  const score = await prisma.score.create({
    data: { sessionId: session.id, totalCorrect: correct, totalQuestions: questions.length, scaledScore },
  });
  await prisma.testSession.update({
    where: { id: session.id },
    data: { status: "completed", completedAt: new Date() },
  });
  res.json({ score });
});
