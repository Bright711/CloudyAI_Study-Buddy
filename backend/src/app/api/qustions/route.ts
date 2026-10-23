import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";


export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("questions")
      .select(`
        question_id,
        domain,
        topic,
        difficulty,
        stem,
        review_status,
        question_options (
          option_letter,
          option_text
        )
      `)
      .order("question_id");

    if (error) {
      console.error("Failed to retrieve questions:", error.message);

      return NextResponse.json(
        { error: "Unable to retrieve questions." },
        { status: 500 }
      );
    }

    // Only expose questions that have been approved.
    const approvedQuestions = (data ?? [])
      .filter(
        (question) =>
          question.review_status?.trim().toLowerCase() === "approved"
      )
      .map((question) => ({
        question_id: question.question_id,
        domain: question.domain,
        topic: question.topic,
        difficulty: question.difficulty,
        stem: question.stem,
        options: question.question_options.map((option) => ({
          letter: option.option_letter,
          text: option.option_text,
        })),
      }));

    return NextResponse.json({
      count: approvedQuestions.length,
      questions: approvedQuestions,
      message:
        approvedQuestions.length === 0
          ? "No SME-approved questions are available yet."
          : undefined,
    });
  } catch (error) {
    console.error("Questions API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}