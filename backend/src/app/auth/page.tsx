"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
const [mode, setMode] = useState<"signin" | "signup">("signup");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
event.preventDefault();
setMessage("");
setLoading(true);


try {
  const supabase = createClient();

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    setMessage(
      data.session
        ? "Account created successfully! You can now sign in."
        : "Account created. Check your email for a confirmation link if email confirmation is enabled."
    );
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    window.location.href = "/";
  }
} catch (error) {
  setMessage(
    error instanceof Error
      ? error.message
      : "Something went wrong. Please try again."
  );
} finally {
  setLoading(false);
}


}

return ( <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12"> <h1 className="mb-2 text-3xl font-bold">CloudBridge AI</h1>


  <p className="mb-8 text-gray-600">
    Sign in or create an account to begin your AZ-900 exam preparation.
  </p>

  <div className="mb-6 flex gap-3">
    <button
      type="button"
      onClick={() => {
        setMode("signup");
        setMessage("");
      }}
      className={`flex-1 rounded-lg border p-3 ${
        mode === "signup"
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-700"
      }`}
    >
      Sign up
    </button>

    <button
      type="button"
      onClick={() => {
        setMode("signin");
        setMessage("");
      }}
      className={`flex-1 rounded-lg border p-3 ${
        mode === "signin"
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-700"
      }`}
    >
      Sign in
    </button>
  </div>

  <form onSubmit={handleSubmit} className="space-y-5">
    <div>
      <label htmlFor="email" className="mb-2 block font-medium">
        Email address
      </label>

      <input
        id="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full rounded-lg border p-3"
        placeholder="you@example.com"
      />
    </div>

    <div>
      <label htmlFor="password" className="mb-2 block font-medium">
        Password
      </label>

      <input
        id="password"
        type="password"
        autoComplete={
          mode === "signup" ? "new-password" : "current-password"
        }
        minLength={6}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full rounded-lg border p-3"
        placeholder="At least 6 characters"
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white disabled:opacity-50"
    >
      {loading
        ? "Please wait..."
        : mode === "signup"
          ? "Create account"
          : "Sign in"}
    </button>
  </form>

  {message && (
    <p
      role="status"
      className="mt-5 rounded-lg bg-gray-100 p-3 text-sm text-gray-800"
    >
      {message}
    </p>
  )}
</main>


);
}
