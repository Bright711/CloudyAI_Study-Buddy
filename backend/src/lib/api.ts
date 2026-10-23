export type CurrentUser = {
  id: string;
  email: string | undefined;
};

export type CurrentUserResponse = {
  authenticated: true;
  user: CurrentUser;
};

export type QuestionOption = {
  letter: string;
  text: string;
};

export type QuizQuestion = {
  question_id: string;
  domain: string;
  topic: string;
  difficulty: string;
  stem: string;
  options: QuestionOption[];
};

export type QuestionsResponse = {
  count: number;
  questions: QuizQuestion[];
  message?: string;
};

export type QuizSessionResponse = {
  message: string;
  session: {
    id: string;
    learnerId: string;
    startedAt: string;
  };
};

export type QuizSubmissionResponse = {
  message: string;
  attemptId: string;
  questionId: string;
  selectedOptionLetter: string;
  isCorrect: boolean;
  evidenceRecorded: boolean;
  answeredAt: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("Could not reach the study service. Check your connection and retry.", 0);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError("The study service could not complete that request.", response.status);
    }
    throw new ApiError("The study service returned an unreadable response.", response.status);
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "The study service could not complete that request.";
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
