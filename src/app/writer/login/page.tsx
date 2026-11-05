
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createWriterClient } from "@/lib/supabase/writer-client";

export default function WriterLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  
async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const supabase = createWriterClient();

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    if (!data.session) {
      setError(
        "Login did not create a session. Please check your Writer account."
      );
      return;
    }

    router.replace("/writer/dashboard");
    router.refresh();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong during login."
    );
  } finally {
    setLoading(false);
  }
}


  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-brand">Inklings</Link>

        <h1>Welcome back, Writer</h1>
        <p className="auth-subtitle">
          Your stories are waiting for you.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <label htmlFor="writer-login-email">Email address</label>
          <input
            id="writer-login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="writer-login-password">Password</label>
          <div className="password-field">
            <input
              id="writer-login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in as Writer"}
          </button>
        </form>

        <p className="auth-switch">
          New to Inklings?{" "}
          <Link href="/writer/signup">Create a Writer Account</Link>
        </p>
      </div>
    </main>
  );
}
