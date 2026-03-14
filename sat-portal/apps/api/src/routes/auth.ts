import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import type { AuthResponse } from "@sat-portal/shared";

export const authRouter = Router();
const RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) });
const LoginSchema = z.object({ email: z.string().email(), password: z.string() });

function signTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN ?? "15m" } as jwt.SignOptions);
  const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d" } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: "Email already in use" });
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash: hash, name } });
  const tokens = signTokens(user.id);
  const body: AuthResponse = { user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() }, ...tokens };
  res.status(201).json(body);
});

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });
  const tokens = signTokens(user.id);
  const body: AuthResponse = { user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() }, ...tokens };
  res.json(body);
});

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { sub: string };
    res.json(signTokens(payload.sub));
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});
