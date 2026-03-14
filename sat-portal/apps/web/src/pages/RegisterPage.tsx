import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthForm from "../components/AuthForm";
import "./auth.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleRegister(data: { email: string; password: string; name?: string }) {
    try {
      setError("");
      await register({ email: data.email, password: data.password, name: data.name ?? "" });
      navigate("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-eyebrow">SAT Portal</span>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-sub">Start preparing smarter, not harder.</p>
        </div>
        <AuthForm mode="register" onSubmit={handleRegister} error={error} />
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
