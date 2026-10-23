import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-auth";

export async function GET() {
try {
const supabase = await createClient();


const {
  data: { user },
  error,
} = await supabase.auth.getUser();

if (error || !user) {
  return NextResponse.json(
    {
      authenticated: false,
      message: "You are not signed in.",
    },
    { status: 401 }
  );
}

return NextResponse.json({
  authenticated: true,
  user: {
    id: user.id,
    email: user.email,
  },
});


} catch (error) {
console.error("Authentication check failed:", error);


return NextResponse.json(
  { error: "Unable to verify authentication." },
  { status: 500 }
);


}
}
