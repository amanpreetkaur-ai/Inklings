
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">(
    ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name.trim(),
            role: "reader",
          },
        },
      });

      if (error) {
        throw error;
      }

      setMessage(
        "If this email is eligible for registration, check your inbox for a confirmation email. Follow the link in that email to continue. Already have an account? You can log in below."
      );
      setMessageType("success");
      setPassword("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Join Inklings</h1>

        <p className="auth-subtitle">
          Create your Reader account and discover your next favourite story.
        </p>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              maxLength={100}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Reader account"}
          </button>
        </form>

        {message && (
          <p
            className={
              messageType === "error" ? "form-error" : "form-help"
            }
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login">Log in here</Link>
        </p>

        <p className="auth-footer">
          Are you a writer?{" "}
          <Link href="/writer/signup">Create a Writer account</Link>
        </p>
      </section>
    </main>
  );
}
