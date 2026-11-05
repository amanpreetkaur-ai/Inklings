
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createWriterClient } from "@/lib/supabase/writer-client";

export default function WriterSignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const supabase = createWriterClient();
    const displayName = name.trim();

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
          account_type: "writer",
        },
        emailRedirectTo: `${window.location.origin}/writer/auth/callback`,
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // Create the profile immediately when signup returns a session.
    if (data.session && data.user) {
      const { error: profileError } = await supabase
        .from("writer_profiles")
        .upsert(
          {
            id: data.user.id,
            display_name: displayName,
          },
          { onConflict: "id" }
        );

      if (profileError) {
        console.error("Writer profile creation failed:", profileError.message);
        setMessage(
          "Your account was created, but your profile could not be saved yet. You can create it from your profile page after logging in."
        );
        setLoading(false);
        return;
      }

      router.replace("/writer/dashboard");
      router.refresh();
      return;
    }

    setMessage(
      "Your registration was received. Please check your email and confirm your account before logging in. Your profile will be created after verification."
    );
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          Inklings
        </Link>

        <h1>Become a Writer</h1>
        <p className="auth-subtitle">
          Your stories deserve a place in the world.
        </p>

        <form onSubmit={handleSignup} className="auth-form">
          <label htmlFor="writer-name">Pen name or full name</label>
          <input
            id="writer-name"
            type="text"
            placeholder="How should readers know you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />

          <label htmlFor="writer-email">Email address</label>
          <input
            id="writer-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="writer-password">Password</label>
          <div className="password-field">
            <input
              id="writer-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
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

          {message && (
            <p className="auth-success" role="status">
              {message}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Writer Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already a writer? <Link href="/writer/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
