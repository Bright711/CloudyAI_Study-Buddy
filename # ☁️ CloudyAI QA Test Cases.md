# CloudyAI Study Buddy: QA status

This document reflects source inspection of the repository as of 2026-10-23. The scenarios below are planned acceptance criteria, not verified test results. The repository has no automated test suite or CI workflow.

## Implemented behavior observed in source

- `POST /api/quiz/session` requires an authenticated Supabase user and creates a learner-owned session.
- `POST /api/quiz/submit` checks the authenticated user's session ownership, determines correctness from the database, records an answer attempt, and records selected-distractor evidence when a tag exists.
- `GET /api/questions` returns approved question content without exposing correct-answer flags.
- The former standalone HTML demo and disconnected root mock tutor handler were removed. The active app is the Next.js/React frontend under `backend/`.
- AI tutoring is not integrated: no provider route, SDK, or configured model exists.

These observations are not substitutes for endpoint or database integration tests.

## Acceptance tests to implement

### Quiz submission and ownership

- Unauthenticated submission returns `401`.
- Malformed JSON or missing/invalid fields return `400`.
- A learner cannot submit to another learner's session.
- Correctness is derived from the stored option, not a client-supplied value.
- Repeated requests do not create duplicate attempts or inconsistent evidence.
- A failure while recording misconception evidence does not leave a misleading retry state.

### Misconception evidence

- A correct answer creates no misconception evidence.
- An incorrect tagged distractor creates evidence for the selected tag.
- Repeated incorrect answers on distinct questions can create a qualified pattern.
- Repeated answers to the same question do not count as distinct-question evidence.
- Missing tags and ambiguous/malformed evidence do not create a confident diagnosis.
- An attempt or evidence record cannot be read by another learner.

The misconception engine is present but is not called by the submission route. Its repeated-pattern behavior is therefore not verified end-to-end.

### Questions API

- Only approved question content is returned.
- Correct-answer flags and privileged fields are not returned.
- Empty question banks return an explicit empty result.
- Query limits, pagination, and database failures have tested behavior.

### AI tutoring

- There is no integrated AI provider route to test. Before enabling one, test input and output validation, grounded context, timeout/provider failures, malformed responses, abuse controls, and server-side secret handling.

## Current validation status

- Browser inspection verified that the dashboard, auth screen, and quiz route render locally. The mobile navigation drawer opened at a 390px viewport without horizontal overflow.
- Browser requests for account status and question data returned `401`/`500` with placeholder credentials and no configured Supabase access. These checks do not verify authenticated behavior or database persistence.
- No API integration, database/RLS, or AI-provider tests have been run against external services.

See [AUDIT.md](./AUDIT.md) for findings, blockers, and safe verification requirements.
