import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const fileContents = await readFile(
    new URL("../az900_question_bank_seed.json", import.meta.url),
    "utf8"
  );

  const bank = JSON.parse(fileContents);
  const questions = bank.questions;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No questions found in the JSON question bank.");
  }

  const questionRows = [];
  const optionRows = [];

  for (const question of questions) {
    if (
      !question.question_id ||
      !question.domain ||
      !question.topic ||
      !question.difficulty ||
      !question.stem ||
      !Array.isArray(question.options) ||
      question.options.length === 0
    ) {
      throw new Error(
        `Question ${question.question_id ?? "(unknown)"} has missing required fields.`
      );
    }

    if (!question.correct_letter) {
      throw new Error(
        `Question ${question.question_id} has no correct_letter.`
      );
    }

    const correctOptions = question.options.filter(
      (option) => option.letter === question.correct_letter
    );

    if (correctOptions.length !== 1) {
      throw new Error(
        `Question ${question.question_id} must have exactly one option matching correct_letter.`
      );
    }

    questionRows.push({
      question_id: question.question_id,
      domain: question.domain,
      topic: question.topic,
      difficulty: question.difficulty,
      stem: question.stem,
      explanation: question.explanation ?? null,
      concept_note: question.concept_note ?? null,
      review_status: question.review_status ?? "Draft",
    });

    for (const option of question.options) {
      if (!option.letter || !option.text) {
        throw new Error(
          `Question ${question.question_id} contains an invalid option.`
        );
      }

      optionRows.push({
        question_id: question.question_id,
        option_letter: option.letter,
        option_text: option.text,
        is_correct: option.letter === question.correct_letter,
        misconception_tag: option.misconception_tag ?? null,
        rationale: option.rationale ?? null,
      });
    }
  }

  // Upsert questions in batches.
  for (let i = 0; i < questionRows.length; i += 100) {
    const batch = questionRows.slice(i, i + 100);

    const { error } = await supabase
      .from("questions")
      .upsert(batch, { onConflict: "question_id" });

    if (error) {
      throw new Error(`Question import failed: ${error.message}`);
    }
  }

  // Upsert options in batches.
  for (let i = 0; i < optionRows.length; i += 100) {
    const batch = optionRows.slice(i, i + 100);

    const { error } = await supabase
      .from("question_options")
      .upsert(batch, {
        onConflict: "question_id,option_letter",
      });

    if (error) {
      throw new Error(`Option import failed: ${error.message}`);
    }
  }

  console.log("Import completed successfully.");
  console.log(`Questions processed: ${questionRows.length}`);
  console.log(`Options processed: ${optionRows.length}`);
  console.log(
    "Review status preserved; drafted questions remain unapproved."
  );
}

main().catch((error) => {
  console.error("Import failed:", error.message);
  process.exit(1);
});