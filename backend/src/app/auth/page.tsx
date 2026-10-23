"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.session) {
          router.replace("/");
          router.refresh();
          return;
        }

        setMessageType("success");
        setMessage(
          "Account created. Check your email for a confirmation link before signing in.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
        router.refresh();
      }
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="CloudyAI">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span className="brand-text">
            <strong>CloudyAI</strong>
            <small>STUDY BUDDY</small>
          </span>
        </Link>
        <div className="auth-brand-copy">
          <p className="eyebrow">A CLEARER WAY TO STUDY</p>
          <h2>Build understanding, one cloud concept at a time.</h2>
          <p>
            Practice AZ-900 fundamentals with approved questions and review
            feedback from each submitted answer.
          </p>
        </div>
        <p className="auth-brand-foot">AZ-900 study support · CloudyAI Study Buddy</p>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <p className="eyebrow">YOUR LEARNING SPACE</p>
            <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
            <p>
              {mode === "signin"
                ? "Sign in to continue your AZ-900 practice."
                : "Create an account to start a saved quiz session."}
            </p>
          </div>

          <div aria-label="Account access" className="auth-tabs" role="group">
            <button
              aria-pressed={mode === "signin"}
              className={`auth-tab ${mode === "signin" ? "auth-tab-active" : ""}`}
              onClick={() => changeMode("signin")}
              type="button"
            >
              Sign in
            </button>
            <button
              aria-pressed={mode === "signup"}
              className={`auth-tab ${mode === "signup" ? "auth-tab-active" : ""}`}
              onClick={() => changeMode("signup")}
              type="button"
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                id="password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                required
                type="password"
                value={password}
              />
            </div>
            <button className="button button-primary" disabled={loading} type="submit">
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {message && (
            <p
              className={`auth-message ${messageType === "error" ? "auth-message-error" : ""}`}
              role={messageType === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          )}
          <p className="muted-note">
            Authentication is provided by the configured Supabase project.{" "}
            <Link className="text-link" href="/">Return to overview</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
