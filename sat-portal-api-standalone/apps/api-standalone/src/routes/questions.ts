import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
export const questionsRouter = Router();
const QuerySchema = z.object({
  section: z.enum(["math", "reading_writing"]).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});
questionsRouter.get("/", requireAuth, async (req, res) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const { section, difficulty, limit } = parsed.data;
  const questions = await prisma.question.findMany({
    where: { ...(section && { section }), ...(difficulty && { difficulty }) },
    include: { choices: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
  res.json(questions.map(({ correctChoiceId: _, ...q }) => q));
});
