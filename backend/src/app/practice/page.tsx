"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  ApiError,
  requestJson,
  type QuestionsResponse,
  type QuizSessionResponse,
  type QuizSubmissionResponse,
} from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";

type QuizPhase = "setup" | "active" | "review";
type SavedAnswer = {
  optionLetter: string;
  isCorrect: boolean;
  attemptId: string;
};

type QuestionLoadResult = {
  questions: QuestionsResponse["questions"];
  error: string | null;
};

async function fetchQuestions(): Promise<QuestionLoadResult> {
  try {
    const result = await requestJson<QuestionsResponse>("/api/questions", {
      cache: "no-store",
    });
    return {
      questions: result.questions,
      error:
        result.questions.length === 0
          ? result.message ?? "No approved questions are available yet."
          : null,
    };
  } catch (error) {
    return {
      questions: [],
      error:
        error instanceof Error
          ? error.message
          : "Unable to load practice questions.",
    };
  }
}

export default function PracticePage() {
  const {
    user,
    loading: authLoading,
    error: authError,
    refresh,
  } = useCurrentUser();
  const [questions, setQuestions] = useState<QuestionsResponse["questions"]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionUncertain, setSubmissionUncertain] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchQuestions().then((result) => {
      if (!active) return;
      setQuestions(result.questions);
      setQuestionsError(result.error);
      setQuestionsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function reloadQuestions() {
    setQuestionsLoading(true);
    setQuestionsError(null);
    const result = await fetchQuestions();
    setQuestions(result.questions);
    setQuestionsError(result.error);
    setQuestionsLoading(false);
  }

  async function startSession() {
    if (starting) return;
    setStarting(true);
    setSubmissionError(null);
    setAuthRequired(false);
    try {
      const response = await requestJson<QuizSessionResponse>("/api/quiz/session", {
        method: "POST",
      });
      setSessionId(response.session.id);
      setCurrentIndex(0);
      setSelections({});
      setAnswers({});
      setSubmissionUncertain(false);
      setPhase("active");
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Unable to start a practice session.",
      );
      setAuthRequired(error instanceof ApiError && error.status === 401);
    } finally {
      setStarting(false);
    }
  }

  const question = questions[currentIndex];
  const savedAnswer = question ? answers[question.question_id] : undefined;
  const selectedOption = question ? selections[question.question_id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((answer) => answer.isCorrect).length;
  const accuracy =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : null;

  async function submitAnswer() {
    if (!question || !sessionId || !selectedOption || submitting || submissionUncertain) return;

    setSubmitting(true);
    setSubmissionError(null);
    try {
      const result = await requestJson<QuizSubmissionResponse>("/api/quiz/submit", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          questionId: question.question_id,
          selectedOptionLetter: selectedOption,
        }),
      });
      setAnswers((current) => ({
        ...current,
        [question.question_id]: {
          optionLetter: result.selectedOptionLetter,
          isCorrect: result.isCorrect,
          attemptId: result.attemptId,
        },
      }));
      setSubmissionError(null);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 0 || error.status >= 500)) {
        setSubmissionUncertain(true);
        setSubmissionError(
          "The server did not confirm this submission. It may have been recorded, and retrying could create a duplicate. Start a new session rather than resubmitting this answer.",
        );
      } else if (error instanceof ApiError && error.status === 409) {
        setSubmissionUncertain(true);
        setSubmissionError("This quiz session is no longer accepting answers. Start a new session to continue.");
      } else {
        setSubmissionError(
          error instanceof Error ? error.message : "Unable to submit this answer.",
        );
        setAuthRequired(error instanceof ApiError && error.status === 401);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function continueSession() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
    } else {
      setPhase("review");
    }
  }

  function startAnotherSession() {
    setPhase("setup");
    setSessionId(null);
    setCurrentIndex(0);
    setSelections({});
    setAnswers({});
    setSubmissionError(null);
    setSubmissionUncertain(false);
    setAuthRequired(false);
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
          <p className="eyebrow">PRACTICE</p>
          <h1>AZ-900 practice quiz</h1>
          <p className="page-description">
            Use approved questions and get your answers checked by the study service.
          </p>
        </div>
        {phase === "active" && (
          <span className="subtle-tag">
            {answeredCount} of {questions.length} submitted
          </span>
        )}
      </div>

      {authLoading && (
        <section className="content-card" aria-live="polite">
          <div className="skeleton skeleton-line" />
          <p className="card-help">Checking your signed-in account…</p>
        </section>
      )}

      {!authLoading && !user && (
        authError ? (
          <section className="empty-panel">
            <div className="inline-alert" role="alert">
              <span>{authError}</span>
              <button className="text-button" onClick={() => void refresh()} type="button">
                Retry
              </button>
            </div>
            <h2>Account status unavailable</h2>
            <p>We could not verify your sign-in, so a quiz session cannot be started yet.</p>
          </section>
        ) : <section className="empty-panel">
          <div className="empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2zm3-13a3 3 0 1 1 6 0v2H9z" />
            </svg>
          </div>
          <p className="eyebrow">ACCOUNT REQUIRED</p>
          <h2>Sign in to start a quiz</h2>
          <p>Your quiz session and submitted answers are associated with your account.</p>
          <Link className="button button-primary" href="/auth">
            Sign in or create account
          </Link>
        </section>
      )}

      {!authLoading && user && phase === "setup" && (
        <section className="setup-layout">
          <article className="content-card setup-card">
            <p className="eyebrow">READY WHEN YOU ARE</p>
            <h2>A focused round of practice</h2>
            <p>
              This session includes the approved questions currently available
              from the question bank. Each answer is submitted and checked
              separately; your progress summary reflects only confirmed responses
              from this session.
            </p>
            {questionsLoading ? (
              <div className="skeleton skeleton-line" aria-label="Loading questions" />
            ) : questionsError ? (
              <div className="inline-alert" role="alert">
                <span>{questionsError}</span>
                <button className="text-button" onClick={() => void reloadQuestions()} type="button">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="setup-facts">
                  <div>
                    <strong>{questions.length}</strong>
                    <span>approved questions</span>
                  </div>
                  <div>
                    <strong>One at a time</strong>
                    <span>server-checked answers</span>
                  </div>
                </div>
                {submissionError && (
                  <div className="inline-alert" role="alert">
                    <span>{submissionError}</span>
                    {authRequired && <Link className="text-link" href="/auth">Sign in</Link>}
                    {submissionUncertain && (
                      <button className="text-button" onClick={startAnotherSession} type="button">
                        Start new session
                      </button>
                    )}
                  </div>
                )}
                <button
                  className="button button-primary"
                  disabled={questions.length === 0 || starting}
                  onClick={() => void startSession()}
                  type="button"
                >
                  {starting ? "Starting…" : "Start practice session"}
                  {!starting && <span aria-hidden="true">→</span>}
                </button>
              </>
            )}
          </article>
          <aside className="content-card setup-note">
            <p className="eyebrow">HOW IT WORKS</p>
            <ol className="step-list">
              <li><span>1</span><p>Choose an answer for the current question.</p></li>
              <li><span>2</span><p>Submit it for server-side validation and recording.</p></li>
              <li><span>3</span><p>Review the confirmed result for this session.</p></li>
            </ol>
            <p className="muted-note">
              The current API does not return official explanations or prior quiz history.
            </p>
          </aside>
        </section>
      )}

      {!authLoading && user && phase === "active" && question && (
        <section className="quiz-layout">
          <div className="quiz-main">
            <div className="quiz-progress-header">
              <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
              <span>{question.difficulty}</span>
            </div>
            <div
              aria-label={`${answeredCount} of ${questions.length} questions submitted`}
              className="progress-track"
              role="progressbar"
              aria-valuemax={questions.length}
              aria-valuemin={0}
              aria-valuenow={answeredCount}
            >
              <span style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
            </div>
            <article className="question-panel">
              <div className="question-context">
                <span className="topic-chip">{question.domain}</span>
                <span>{question.topic}</span>
              </div>
              <h2>{question.stem}</h2>
              <fieldset className="answer-list" disabled={Boolean(savedAnswer) || submitting || submissionUncertain}>
                <legend className="sr-only">Choose one answer</legend>
                {question.options.map((option) => {
                  const isSelected = selectedOption === option.letter;
                  return (
                    <label
                      className={`answer-choice ${isSelected ? "answer-choice-selected" : ""}`}
                      key={option.letter}
                    >
                      <input
                        checked={isSelected}
                        name={`answer-${question.question_id}`}
                        onChange={() =>
                          setSelections((current) => ({
                            ...current,
                            [question.question_id]: option.letter,
                          }))
                        }
                        type="radio"
                        value={option.letter}
                      />
                      <span className="choice-letter">{option.letter}</span>
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </fieldset>

              {savedAnswer && (
                <div
                  className={`answer-result ${savedAnswer.isCorrect ? "answer-result-correct" : "answer-result-incorrect"}`}
                  role="status"
                >
                  <strong>{savedAnswer.isCorrect ? "Answer recorded as correct" : "Answer recorded as incorrect"}</strong>
                  <p>
                    This result was confirmed by the server. An explanation is not
                    yet returned by the current quiz API.
                  </p>
                </div>
              )}

              {submissionError && (
                <div className="inline-alert" role="alert">
                  <span>{submissionError}</span>
                  {authRequired && <Link className="text-link" href="/auth">Sign in</Link>}
                  {submissionUncertain && (
                    <button className="text-button" onClick={startAnotherSession} type="button">
                      Start new session
                    </button>
                  )}
                </div>
              )}

              <div className="quiz-actions">
                <span className="muted-note">
                  {savedAnswer ? "Response confirmed" : submitting ? "Submitting…" : "Select one answer"}
                </span>
                {savedAnswer ? (
                  <button className="button button-primary" onClick={continueSession} type="button">
                    {currentIndex === questions.length - 1 ? "View session results" : "Next question"}
                    <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <button
                    className="button button-primary"
                    disabled={!selectedOption || submitting || submissionUncertain}
                    onClick={() => void submitAnswer()}
                    type="button"
                  >
                    {submitting ? "Submitting…" : "Submit answer"}
                    {!submitting && <span aria-hidden="true">→</span>}
                  </button>
                )}
              </div>
            </article>
          </div>
          <aside className="quiz-aside">
            <div className="content-card session-card">
              <p className="eyebrow">THIS SESSION</p>
              <div className="session-stat">
                <span>Confirmed answers</span>
                <strong>{answeredCount} / {questions.length}</strong>
              </div>
              <div className="session-stat">
                <span>Correct so far</span>
                <strong>{correctCount}</strong>
              </div>
              <p className="muted-note">
                Results update only after the server confirms a submission.
              </p>
            </div>
            <div className="content-card session-tip">
              <p className="eyebrow">A NOTE ON RESULTS</p>
              <p>
                Correct answers are not revealed before submission. Detailed
                explanations and review history are not available from the current API.
              </p>
            </div>
          </aside>
        </section>
      )}

      {phase === "review" && (
        <section className="review-panel">
          <div className="review-heading">
            <p className="eyebrow">SESSION SUMMARY</p>
            <h2>Your confirmed responses</h2>
            <p>These totals include only answers confirmed by the server in this browser session.</p>
          </div>
          <div className="review-stats">
            <div><span>Submitted</span><strong>{answeredCount} / {questions.length}</strong></div>
            <div><span>Correct</span><strong>{correctCount}</strong></div>
            <div><span>Accuracy</span><strong>{accuracy === null ? "—" : `${accuracy}%`}</strong></div>
          </div>
          <ol className="review-list">
            {questions.map((item, index) => {
              const answer = answers[item.question_id];
              return (
                <li className="review-row" key={item.question_id}>
                  <span className={`review-indicator ${answer?.isCorrect ? "indicator-correct" : answer ? "indicator-incorrect" : ""}`}>
                    {answer ? (answer.isCorrect ? "✓" : "–") : "·"}
                  </span>
                  <div>
                    <strong>Question {index + 1}</strong>
                    <p>{item.topic} · {answer ? (answer.isCorrect ? "Correct" : "Incorrect") : "Not submitted"}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <button className="button button-primary" onClick={startAnotherSession} type="button">
            Start another session
          </button>
          <p className="muted-note review-disclaimer">
            This summary is not quiz history; the backend does not yet provide a results retrieval endpoint.
          </p>
        </section>
      )}
    </AppShell>
  );
}
