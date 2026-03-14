export type Section = "math" | "reading_writing";
export type Difficulty = "easy" | "medium" | "hard";
export type TestStatus = "in_progress" | "completed" | "abandoned";

export interface User {
  id: string; email: string; name: string; createdAt: string;
}
export interface Choice {
  id: string; label: string; text: string;
}
export interface Question {
  id: string; section: Section; difficulty: Difficulty;
  prompt: string; choices: Choice[];
  correctChoiceId?: string; explanation?: string;
}
export interface SectionBreakdown {
  section: Section; correct: number; incorrect: number; omitted: number; score: number;
}
export interface Score {
  total: number; maxTotal: number; mathRaw: number;
  readingWritingRaw: number; scaledScore: number;
  sectionBreakdown: SectionBreakdown[];
}
export interface TestSession {
  id: string; userId: string; status: TestStatus;
  section: Section | "full"; startedAt: string;
  completedAt?: string; timeLimitSeconds: number; score?: Score;
}
export interface RegisterPayload { email: string; password: string; name: string; }
export interface LoginPayload { email: string; password: string; }
export interface AuthResponse { user: User; accessToken: string; refreshToken: string; }
export interface StartSessionPayload { section: Section | "full"; }
export interface SubmitAnswerPayload { questionId: string; choiceId: string | null; }
export interface SubmitSessionPayload { answers: SubmitAnswerPayload[]; }
export interface ApiError { message: string; code?: string; }
