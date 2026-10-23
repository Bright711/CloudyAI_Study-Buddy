-- CloudBridge AI
-- Initial database schema
-- PostgreSQL / Supabase

-- =========================================
-- 1. QUESTIONS
-- =========================================

CREATE TABLE IF NOT EXISTS public.questions (
    question_id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    stem TEXT NOT NULL,
    explanation TEXT,
    concept_note TEXT,
    review_status TEXT NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 2. QUESTION OPTIONS
-- =========================================

CREATE TABLE IF NOT EXISTS public.question_options (
    question_id TEXT NOT NULL,
    option_letter TEXT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    misconception_tag TEXT,
    rationale TEXT,

    PRIMARY KEY (question_id, option_letter),

    CONSTRAINT fk_question_options_question
        FOREIGN KEY (question_id)
        REFERENCES public.questions(question_id)
        ON DELETE CASCADE
);

-- =========================================
-- 3. QUIZ SESSIONS
-- =========================================

CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Nullable until learner authentication is integrated.
    learner_id UUID REFERENCES auth.users(id)
        ON DELETE SET NULL,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =========================================
-- 4. ANSWER ATTEMPTS
-- =========================================

CREATE TABLE IF NOT EXISTS public.answer_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL,
    question_id TEXT NOT NULL,
    selected_option_letter TEXT NOT NULL,

    -- Calculated and written by the trusted backend.
    is_correct BOOLEAN NOT NULL,

    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attempt_session
        FOREIGN KEY (session_id)
        REFERENCES public.quiz_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attempt_question
        FOREIGN KEY (question_id)
        REFERENCES public.questions(question_id),

    -- Ensure the submitted option belongs to that question.
    CONSTRAINT fk_attempt_selected_option
        FOREIGN KEY (question_id, selected_option_letter)
        REFERENCES public.question_options(
            question_id,
            option_letter
        )
);

-- =========================================
-- 5. MISCONCEPTION EVIDENCE
-- =========================================

CREATE TABLE IF NOT EXISTS public.misconception_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    answer_attempt_id UUID NOT NULL,
    misconception_tag TEXT NOT NULL,

    evidence_type TEXT NOT NULL CHECK (
        evidence_type IN (
            'selected_distractor',
            'repeated_pattern'
        )
    ),

    -- Evidence strength between 0 and 1.
    evidence_score NUMERIC(4, 3) NOT NULL CHECK (
        evidence_score >= 0
        AND evidence_score <= 1
    ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_evidence_attempt
        FOREIGN KEY (answer_attempt_id)
        REFERENCES public.answer_attempts(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_attempt_evidence
        UNIQUE (
            answer_attempt_id,
            misconception_tag,
            evidence_type
        )
);

-- =========================================
-- 6. INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_questions_domain
    ON public.questions(domain);

CREATE INDEX IF NOT EXISTS idx_questions_review_status
    ON public.questions(review_status);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_learner
    ON public.quiz_sessions(learner_id);

CREATE INDEX IF NOT EXISTS idx_answer_attempts_session
    ON public.answer_attempts(session_id);

CREATE INDEX IF NOT EXISTS idx_answer_attempts_question
    ON public.answer_attempts(question_id);

CREATE INDEX IF NOT EXISTS idx_misconception_evidence_tag
    ON public.misconception_evidence(misconception_tag);

CREATE INDEX IF NOT EXISTS idx_misconception_evidence_attempt
    ON public.misconception_evidence(answer_attempt_id);

-- =========================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.questions
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.question_options
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.quiz_sessions
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.answer_attempts
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.misconception_evidence
    ENABLE ROW LEVEL SECURITY;