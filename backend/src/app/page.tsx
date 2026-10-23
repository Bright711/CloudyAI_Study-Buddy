"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ApiError, requestJson, type QuestionsResponse } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";

async function fetchApprovedQuestionCount(): Promise<number> {
  const result = await requestJson<QuestionsResponse>("/api/questions", {
    cache: "no-store",
  });
  return result.count;
}

export default function HomePage() {
  const { user, loading: authLoading, error: authError, refresh } = useCurrentUser();
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchApprovedQuestionCount()
      .then((count) => {
        if (!cancelled) {
          setQuestionCount(count);
          setQuestionsError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setQuestionsError(
            error instanceof ApiError
              ? error.message
              : "Unable to load approved questions right now.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function retryQuestionCount() {
    setQuestionsError(null);
    try {
      setQuestionCount(await fetchApprovedQuestionCount());
    } catch (error) {
      setQuestionsError(
        error instanceof ApiError
          ? error.message
          : "Unable to load approved questions right now.",
      );
    }
  }

  return (
    <AppShell
      user={user}
      authLoading={authLoading}
      authError={authError}
      onSignOut={refresh}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">AZ-900 LEARNING SPACE</p>
          <h1>{user ? "Welcome back" : "Build your Azure confidence"}</h1>
          <p className="page-description">
            A focused place to practise cloud concepts and learn from each answer.
          </p>
        </div>
        <Link className="button button-primary" href="/practice">
          Start a practice quiz
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {!authLoading && !authError && !user && (
        <section className="notice-card notice-accent" aria-labelledby="account-title">
          <div>
            <p className="eyebrow">YOUR LEARNING, YOUR ACCOUNT</p>
            <h2 id="account-title">Sign in to save your practice</h2>
            <p>
              Quiz sessions require an authenticated account. Your answers are
              submitted to the study service and tied to your signed-in user.
            </p>
          </div>
          <Link className="button button-secondary" href="/auth">
            Sign in or create account
          </Link>
        </section>
      )}

      {authError && (
        <div className="inline-alert" role="alert">
          <span>{authError}</span>
          <button className="text-button" onClick={refresh} type="button">
            Retry
          </button>
        </div>
      )}

      <section className="dashboard-grid" aria-label="Study overview">
        <article className="content-card question-count-card">
          <div className="card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 5h11M8 12h11M8 19h11M4 5h.01M4 12h.01M4 19h.01" />
            </svg>
          </div>
          <p className="card-label">APPROVED PRACTICE QUESTIONS</p>
          {questionCount === null && !questionsError ? (
            <div className="skeleton skeleton-number" aria-label="Loading question count" />
          ) : questionsError ? (
            <p className="card-value card-value-muted">Unavailable</p>
          ) : (
            <p className="card-value">{questionCount}</p>
          )}
          <p className="card-help">
            {questionsError ?? "Questions supplied by the connected question bank."}
          </p>
          {questionsError && (
            <button className="text-button" onClick={() => void retryQuestionCount()} type="button">
              Retry
            </button>
          )}
        </article>

        <article className="content-card">
          <p className="eyebrow">PRACTICE</p>
          <h2>Learn one answer at a time</h2>
          <p>
            Work through approved AZ-900 questions. Correctness is checked by
            the server, and submitted answers are recorded for your account.
          </p>
          <Link className="text-link" href="/practice">
            Open practice quiz <span aria-hidden="true">→</span>
          </Link>
        </article>

        <article className="content-card availability-card">
          <p className="eyebrow">COMING NEXT</p>
          <h2>More of your learning journey</h2>
          <p>
            The current backend does not provide progress history, misconception
            retrieval, or an AI tutor endpoint yet. Those insights are not shown
            as if they were available.
          </p>
          <div className="availability-list">
            <span>Learning history</span>
            <span>Misconception Radar</span>
            <span>AI Tutor</span>
          </div>
        </article>
      </section>

      <section className="account-strip" aria-label="Account status">
        <div className="account-avatar" aria-hidden="true">
          {user?.email?.slice(0, 1).toUpperCase() ?? "C"}
        </div>
        <div>
          <strong>{user?.email ?? (authLoading ? "Checking account…" : "Guest learner")}</strong>
          <p>
            {user
              ? "Signed in with your CloudyAI account."
              : authError
                ? "Account status could not be checked."
                : "Sign in to start a saved quiz session."}
          </p>
        </div>
        {!user && !authLoading && !authError && (
          <Link className="text-link" href="/auth">
            Set up account <span aria-hidden="true">→</span>
          </Link>
        )}
      </section>
    </AppShell>
  );
}
