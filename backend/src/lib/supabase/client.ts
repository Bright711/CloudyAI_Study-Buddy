import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey =
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl || !supabasePublishableKey) {
throw new Error("Missing Supabase browser environment variables.");
}

let parsedUrl: URL;

try {
parsedUrl = new URL(supabaseUrl);
} catch {
throw new Error("Invalid Supabase project URL.");
}

if (
parsedUrl.protocol !== "https:" ||
parsedUrl.pathname !== "/" ||
parsedUrl.search !== "" ||
parsedUrl.hash !== ""
) {
throw new Error(
"Use your Supabase project URL without additional paths."
);
}

return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
