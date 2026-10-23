import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server-auth";

import { supabaseAdmin } from "@/lib/supabase/server";

import { detectRepeatedPatterns } from "@/lib/misconceptions/engine";

type SubmissionBody = {
sessionId?: unknown;
questionId?: unknown;
selectedOptionLetter?: unknown;
};

export async function POST(request: Request) {
try {
const supabase = await createClient();

const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "You must sign in before submitting an answer." },
    { status: 401 }
  );
}

let body: SubmissionBody;


try {
  body = await request.json();
} catch {
  return NextResponse.json(
    { error: "Request body must contain valid JSON." },
    { status: 400 }
  );
}

const { sessionId, questionId, selectedOptionLetter } = body;

if (
  typeof sessionId !== "string" ||
  typeof questionId !== "string" ||
  typeof selectedOptionLetter !== "string" ||
  !sessionId.trim() ||
  !questionId.trim() ||
  !selectedOptionLetter.trim()
) {
  return NextResponse.json(
    {
      error:
        "sessionId, questionId, and selectedOptionLetter are required.",
    },
    { status: 400 }
  );
}

// Confirm that the quiz session exists.
const { data: session, error: sessionError } = await supabaseAdmin
  .from("quiz_sessions")
  .select("id, completed_at, learner_id")
  .eq("id", sessionId)
  .eq("learner_id", user.id)
  .maybeSingle();

if (sessionError) {
  console.error("Session lookup failed:", sessionError.message);
  return NextResponse.json(
    { error: "Unable to verify the quiz session." },
    { status: 500 }
  );
}

if (!session) {
  return NextResponse.json(
    { error: "Quiz session not found." },
    { status: 404 }
  );
}

if (session.completed_at) {
  return NextResponse.json(
    { error: "This quiz session has already been completed." },
    { status: 409 }
  );
}

// Retrieve the submitted option and its correctness from the database.
const { data: selectedOption, error: optionError } = await supabaseAdmin
  .from("question_options")
  .select("question_id, option_letter, is_correct, misconception_tag")
  .eq("question_id", questionId)
  .eq("option_letter", selectedOptionLetter)
  .maybeSingle();

if (optionError) {
  console.error("Option lookup failed:", optionError.message);
  return NextResponse.json(
    { error: "Unable to verify the selected option." },
    { status: 500 }
  );
}

if (!selectedOption) {
  return NextResponse.json(
    { error: "The selected option does not exist for this question." },
    { status: 400 }
  );
}

// Only approved questions may be submitted.
const { data: question, error: questionError } = await supabaseAdmin
  .from("questions")
  .select("question_id, review_status")
  .eq("question_id", questionId)
  .maybeSingle();

if (questionError) {
  console.error("Question lookup failed:", questionError.message);
  return NextResponse.json(
    { error: "Unable to verify the question." },
    { status: 500 }
  );
}

if (
  !question ||
  question.review_status?.trim().toLowerCase() !== "approved"
) {
  return NextResponse.json(
    { error: "This question is not available for quizzes." },
    { status: 404 }
  );
}

// The backend, not the frontend, determines correctness.
const isCorrect = selectedOption.is_correct;

// Save the answer attempt.
const { data: attempt, error: attemptError } = await supabaseAdmin
  .from("answer_attempts")
  .insert({
    session_id: sessionId,
    question_id: questionId,
    selected_option_letter: selectedOptionLetter,
    is_correct: isCorrect,
  })
  .select("id, is_correct, answered_at")
  .single();

if (attemptError || !attempt) {
  console.error(
    "Saving answer attempt failed:",
    attemptError?.message
  );
  return NextResponse.json(
    { error: "Unable to save the answer attempt." },
    { status: 500 }
  );
}

// Record evidence when an incorrect option has a misconception tag.
let evidenceRecorded = false;

if (!isCorrect && selectedOption.misconception_tag?.trim()) {
  const { error: evidenceError } = await supabaseAdmin
    .from("misconception_evidence")
    .upsert(
      {
        answer_attempt_id: attempt.id,
        misconception_tag: selectedOption.misconception_tag,
        evidence_type: "selected_distractor",
        evidence_score: 0.6,
      },
      {
        onConflict:
          "answer_attempt_id,misconception_tag,evidence_type",
      }
    );

  if (evidenceError) {
    console.error(
      "Saving misconception evidence failed:",
      evidenceError.message
    );

    return NextResponse.json(
      {
        error:
          "The answer was saved, but misconception evidence could not be recorded.",
        attemptId: attempt.id,
      },
      { status: 500 }
    );
  }

  evidenceRecorded = true;
}

return NextResponse.json(
  {
    message: "Answer submitted successfully.",
    attemptId: attempt.id,
    questionId,
    selectedOptionLetter,
    isCorrect,
    evidenceRecorded,
    answeredAt: attempt.answered_at,
  },
  { status: 201 }
);


} catch (error) {
console.error("Quiz submission error:", error);


return NextResponse.json(
  { error: "An unexpected error occurred." },
  { status: 500 }
);


}
}
