import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST() {
try {
// Verify the learner's authenticated session.
const supabase = await createClient();


const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "You must sign in before starting a quiz." },
    { status: 401 }
  );
}

// Create a quiz session linked to this authenticated learner.
const { data: session, error: sessionError } = await supabaseAdmin
  .from("quiz_sessions")
  .insert({
    learner_id: user.id,
  })
  .select("id, learner_id, started_at")
  .single();

if (sessionError || !session) {
  console.error(
    "Quiz session creation failed:",
    sessionError?.message
  );

  return NextResponse.json(
    { error: "Unable to start a quiz session." },
    { status: 500 }
  );
}

return NextResponse.json(
  {
    message: "Quiz session started successfully.",
    session: {
      id: session.id,
      learnerId: session.learner_id,
      startedAt: session.started_at,
    },
  },
  { status: 201 }
);


} catch (error) {
console.error("Quiz session API error:", error);


return NextResponse.json(
  { error: "An unexpected error occurred." },
  { status: 500 }
);


}
}
