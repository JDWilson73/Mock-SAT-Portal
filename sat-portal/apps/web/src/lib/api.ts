import type { AuthResponse, LoginPayload, RegisterPayload, Question, TestSession, StartSessionPayload, SubmitSessionPayload } from "@sat-portal/shared";

const BASE = "/api";
const getToken = () => localStorage.getItem("accessToken");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

export const api = {
  register: (body: RegisterPayload) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: LoginPayload) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  getQuestions: (params?: { section?: string; difficulty?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Question[]>(`/questions${qs ? `?${qs}` : ""}`);
  },
  startSession: (body: StartSessionPayload) =>
    request<TestSession>("/sessions", { method: "POST", body: JSON.stringify(body) }),
  getSessions: () => request<TestSession[]>("/sessions"),
  submitSession: (id: string, body: SubmitSessionPayload) =>
    request<{ score: TestSession["score"] }>(`/sessions/${id}/submit`, { method: "POST", body: JSON.stringify(body) }),
};
