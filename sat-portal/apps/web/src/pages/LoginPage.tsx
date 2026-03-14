import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthForm from "../components/AuthForm";
import "./auth.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleLogin(data: { email: string; password: string }) {
    try {
      setError("");
      await login(data);
      navigate("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-eyebrow">SAT Portal</span>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to continue your preparation.</p>
        </div>
        <AuthForm mode="login" onSubmit={handleLogin} error={error} />
        <p className="auth-footer">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
