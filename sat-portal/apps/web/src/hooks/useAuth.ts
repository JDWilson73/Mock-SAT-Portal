import { useState, useCallback } from "react";
import type { User, LoginPayload, RegisterPayload } from "@sat-portal/shared";
import { api } from "../lib/api";

function parseUser(): User | null {
  try { const raw = localStorage.getItem("user"); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(parseUser);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user, accessToken, refreshToken } = await api.login(payload);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user, accessToken, refreshToken } = await api.register(payload);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }, []);

  const logout = useCallback(() => { localStorage.clear(); setUser(null); }, []);
  return { user, login, register, logout };
}
