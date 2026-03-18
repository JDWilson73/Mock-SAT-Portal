import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { questionsRouter } from "./routes/questions";
import { sessionsRouter } from "./routes/sessions";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "*", credentials: true }));
// Handle preflight requests for all routes
app.options("*", cors({ origin: process.env.CLIENT_ORIGIN ?? "*", credentials: true }));

app.use(express.json());

app.use("/api/auth",      authRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/sessions",  sessionsRouter);
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
