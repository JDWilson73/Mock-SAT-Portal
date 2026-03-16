export type Section = "math" | "reading_writing";
export type Difficulty = "easy" | "medium" | "hard";
export type TestStatus = "in_progress" | "completed" | "abandoned";

export type MathSubtype = "algebra" | "geometry" | "probability" | "data_analysis";
export type RWSubtype = "comprehension" | "grammar" | "vocabulary" | "rhetoric";
export type Subtype = MathSubtype | RWSubtype;

export interface User {
  id: string; email: string; name: string; createdAt: string;
}

export interface Choice {
  id: string; label: string; text: string;
}

export interface Question {
  id: string;
  section: Section;
  subtype: Subtype;
  difficulty: Difficulty;
  prompt: string;
  choices: Choice[];
  correctChoiceId?: string;
  explanation?: string;
}

export interface Score {
  id: string;
  sessionId: string;
  totalCorrect: number;
  totalQuestions: number;
  scaledScore: number;
}

export interface SessionAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  choiceId: string | null;
  isCorrect: boolean;
  question: Question & { choices: Choice[] };
  choice: Choice | null;
}

export interface TestSession {
  id: string;
  userId: string;
  status: TestStatus;
  section: Section | "full";
  startedAt: string;
  completedAt?: string;
  timeLimitSeconds: number;
  score?: Score;
  answers?: SessionAnswer[];
}

export interface RegisterPayload { email: string; password: string; name: string; }
export interface LoginPayload { email: string; password: string; }
export interface AuthResponse { user: User; accessToken: string; refreshToken: string; }
export interface StartSessionPayload { section: Section | "full"; }
export interface SubmitAnswerPayload { questionId: string; choiceId: string | null; }
export interface SubmitSessionPayload { answers: SubmitAnswerPayload[]; }
export interface ApiError { message: string; code?: string; }
