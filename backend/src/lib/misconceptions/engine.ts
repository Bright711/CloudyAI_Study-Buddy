import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

export type MisconceptionConfidence = {
evidenceScore: number;
confidenceLabel:
| "initial_signal"
| "emerging_pattern"
| "strong_pattern";
};

export function calculateMisconceptionConfidence(
distinctIncorrectQuestions: number
): MisconceptionConfidence {
if (
!Number.isInteger(distinctIncorrectQuestions) ||
distinctIncorrectQuestions < 0
) {
throw new Error(
"The number of distinct questions must be a non-negative integer."
);
}

if (distinctIncorrectQuestions === 0) {
return {
evidenceScore: 0,
confidenceLabel: "initial_signal",
};
}

if (distinctIncorrectQuestions === 1) {
return {
evidenceScore: 0.6,
confidenceLabel: "initial_signal",
};
}

if (distinctIncorrectQuestions === 2) {
return {
evidenceScore: 0.75,
confidenceLabel: "emerging_pattern",
};
}

return {
evidenceScore: 0.9,
confidenceLabel: "strong_pattern",
};
}

type DetectRepeatedPatternsResult = {
patternsDetected: number;
evidenceRecordsCreated: number;
};

export async function detectRepeatedPatterns(
learnerId: string,
currentAttemptId: string
): Promise<DetectRepeatedPatternsResult> {
if (!learnerId.trim() || !currentAttemptId.trim()) {
throw new Error("Learner ID and attempt ID are required.");
}

// Find the current answer attempt and verify session ownership.
const { data: currentAttempt, error: currentAttemptError } =
await supabaseAdmin
.from("answer_attempts")
.select(
"id, question_id, is_correct, quiz_sessions!inner(learner_id)"
)
.eq("id", currentAttemptId)
.eq("quiz_sessions.learner_id", learnerId)
.maybeSingle();

if (currentAttemptError) {
throw new Error(
`Unable to verify the current attempt: ${currentAttemptError.message}`
);
}

if (!currentAttempt) {
throw new Error("The current attempt was not found for this learner.");
}

// Correct answers must not create repeated-misconception evidence.
if (currentAttempt.is_correct) {
return {
patternsDetected: 0,
evidenceRecordsCreated: 0,
};
}

// Find the misconception tags associated with this attempt.
const { data: currentEvidence, error: evidenceError } =
await supabaseAdmin
.from("misconception_evidence")
.select("misconception_tag")
.eq("answer_attempt_id", currentAttemptId)
.eq("evidence_type", "selected_distractor");

if (evidenceError) {
throw new Error(
`Unable to retrieve current evidence: ${evidenceError.message}`
);
}

const currentTags = [
...new Set(
(currentEvidence ?? [])
.map((item) => item.misconception_tag)
.filter(Boolean)
),
];

let patternsDetected = 0;
let evidenceRecordsCreated = 0;

for (const tag of currentTags) {
// Retrieve this learner's incorrect attempts associated with this tag.
const { data: evidenceRows, error: historyError } =
await supabaseAdmin
.from("misconception_evidence")
.select(
"answer_attempt_id, answer_attempts!inner(question_id, is_correct, quiz_sessions!inner(learner_id))"
)
.eq("misconception_tag", tag)
.eq("evidence_type", "selected_distractor")
.eq("answer_attempts.quiz_sessions.learner_id", learnerId)
.eq("answer_attempts.is_correct", false);


if (historyError) {
  throw new Error(
    `Unable to retrieve misconception history: ${historyError.message}`
  );
}

// Count distinct questions, not raw attempts.
const distinctQuestionIds = new Set(
  (evidenceRows ?? []).map(
    (row) =>
      (
        row.answer_attempts as unknown as {
          question_id: string;
          is_correct: boolean;
        }
      ).question_id
  )
);

if (distinctQuestionIds.size < 2) {
  continue;
}

const confidence = calculateMisconceptionConfidence(
  distinctQuestionIds.size
);

// Attach the repeated-pattern record to the current attempt.
// The database unique constraint makes retries safe.
const { data: savedEvidence, error: saveError } =
  await supabaseAdmin
    .from("misconception_evidence")
    .upsert(
      {
        answer_attempt_id: currentAttemptId,
        misconception_tag: tag,
        evidence_type: "repeated_pattern",
        evidence_score: confidence.evidenceScore,
      },
      {
        onConflict:
          "answer_attempt_id,misconception_tag,evidence_type",
        ignoreDuplicates: true,
      }
    )
    .select("id");

if (saveError) {
  throw new Error(
    `Unable to save repeated-pattern evidence: ${saveError.message}`
  );
}

patternsDetected += 1;

if (savedEvidence && savedEvidence.length > 0) {
  evidenceRecordsCreated += savedEvidence.length;
}


}

return {
patternsDetected,
evidenceRecordsCreated,
};
}
