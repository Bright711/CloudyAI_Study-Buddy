"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, requestJson, type CurrentUserResponse } from "@/lib/api";

type CurrentUserState = {
  user: CurrentUserResponse["user"] | null;
  loading: boolean;
  error: string | null;
};

async function fetchCurrentUser(): Promise<CurrentUserState> {
  try {
    const result = await requestJson<CurrentUserResponse>("/api/auth/me", {
      cache: "no-store",
    });
    return { user: result.user, loading: false, error: null };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { user: null, loading: false, error: null };
    }
    return {
      user: null,
      loading: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to check your account right now.",
    };
  }
}

export function useCurrentUser() {
  const [state, setState] = useState<CurrentUserState>({
    user: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setState(await fetchCurrentUser());
  }, []);

  useEffect(() => {
    let active = true;
    void fetchCurrentUser().then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return { ...state, refresh };
}
