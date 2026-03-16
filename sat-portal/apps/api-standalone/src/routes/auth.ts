import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
export const authRouter = Router();
const RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) });
const LoginSchema = z.object({ email: z.string().email(), password: z.string() });
function signTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN ?? "15m" } as any);
  const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d" } as any);
  return { accessToken, refreshToken };
}
authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const { email, password, name } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ message: "Email already in use" });
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash: hash, name } });
  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, ...signTokens(user.id) });
});
authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ message: "Invalid credentials" });
  res.json({ user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, ...signTokens(user.id) });
});
authRouter.post("/refresh", (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { sub: string };
    res.json(signTokens(payload.sub));
  } catch { res.status(401).json({ message: "Invalid refresh token" }); }
});
