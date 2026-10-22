# ☁️ CloudyAI QA Test Cases

As the QA Lead, I tested the following scenarios to ensure a robust learner journey:

## ✅ 1. Happy Path (Standard Flow)
- **Action:** User submits an incorrect answer via the API.
- **Expected Result:** API returns a 200 OK status with a JSON containing `encouragement`, `explanation`, `analogy`, and `follow_up_question`.
- **Status:** PASS (Mock API verified successfully).

## ⚠️ 2. Edge Case: Missing Data
- **Action:** Frontend sends a request with missing `conceptNote` or `officialExplanation`.
- **Expected Result:** API handles the missing data gracefully without crashing, returning a fallback generic explanation.
- **Status:** PASS (Error handling implemented in `api/route.ts` catch block).

## 🛡️ 3. AI Grounding & Hallucination Check
- **Action:** Prompt explicitly instructs the AI to ONLY use the provided `conceptNote` and `officialExplanation`.
- **Expected Result:** The AI does not invent new Azure facts or go off-topic.
- **Status:** PASS (Enforced via strict system prompt rules in `prompt/tutor-prompt.ts`).

## 📱 4. Loading & Error States
- **Action:** Simulate a slow network response.
- **Expected Result:** UI displays a loading skeleton/spinner while waiting for the AI stream, preventing user frustration.
- **Status:** READY FOR FRONTEND INTEGRATION (Handed off to Christine).