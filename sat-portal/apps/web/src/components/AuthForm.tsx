import { useState, FormEvent } from "react";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>;
  error?: string;
}

export default function AuthForm({ mode, onSubmit, error }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ email, password, ...(mode === "register" ? { name } : {}) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {mode === "register" && (
        <div className="field">
          <label>Full name</label>
          <input
            type="text" required value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
          />
        </div>
      )}
      <div className="field">
        <label>Email</label>
        <input
          type="email" required value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="field">
        <label>Password</label>
        <input
          type="password" required value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={mode === "register" ? "8+ characters" : "••••••••"}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
