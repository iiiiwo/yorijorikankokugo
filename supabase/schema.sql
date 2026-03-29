-- ============================================================
-- 完全セットアップ: DROP → CREATE
-- 既存テーブルをすべて削除して正しいスキーマで作り直す
-- ※ profiles テーブルは auth.users に依存するため残す
-- ============================================================

-- 依存関係の逆順で DROP
DROP TABLE IF EXISTS public.quiz_answers CASCADE;
DROP TABLE IF EXISTS public.quiz_sessions CASCADE;
DROP TABLE IF EXISTS public.conversation_messages CASCADE;
DROP TABLE IF EXISTS public.conversation_sessions CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badge_definitions CASCADE;
DROP TABLE IF EXISTS public.daily_activity CASCADE;
DROP TABLE IF EXISTS public.vocabulary_progress CASCADE;
DROP TABLE IF EXISTS public.character_progress CASCADE;
DROP TABLE IF EXISTS public.vocabulary CASCADE;
DROP TABLE IF EXISTS public.hangul_characters CASCADE;

-- トリガー・関数も再作成できるよう DROP
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.record_activity(UUID, INTEGER, INTEGER);

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  native_lang   TEXT NOT NULL DEFAULT 'ja',
  level         TEXT NOT NULL DEFAULT 'beginner'
                  CHECK (level IN ('beginner','intermediate','advanced')),
  xp_total      INTEGER NOT NULL DEFAULT 0,
  streak_days   INTEGER NOT NULL DEFAULT 0,
  last_studied  DATE,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 15,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HANGUL CHARACTERS
-- ============================================================
CREATE TABLE public.hangul_characters (
  id              SERIAL PRIMARY KEY,
  character       TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('consonant','vowel')),
  romanization    TEXT NOT NULL,
  pronunciation_jp TEXT NOT NULL,
  stroke_count    INTEGER NOT NULL,
  audio_url       TEXT,
  examples        JSONB,
  position        INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VOCABULARY / WORDS
-- ============================================================
CREATE TABLE public.vocabulary (
  id              SERIAL PRIMARY KEY,
  korean          TEXT NOT NULL,
  romanization    TEXT NOT NULL,
  japanese        TEXT NOT NULL,
  english         TEXT,
  category        TEXT NOT NULL,
  difficulty      SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  audio_url       TEXT,
  example_sentence_ko  TEXT,
  example_sentence_jp  TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEARNING PROGRESS — PER USER, PER CHARACTER
-- ============================================================
CREATE TABLE public.character_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_id    INTEGER NOT NULL REFERENCES public.hangul_characters(id),
  mastery_level   SMALLINT NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  correct_count   INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  next_review_at  TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, character_id)
);
ALTER TABLE public.character_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own character progress"
  ON public.character_progress FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- VOCABULARY PROGRESS
-- ============================================================
CREATE TABLE public.vocabulary_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vocabulary_id   INTEGER NOT NULL REFERENCES public.vocabulary(id),
  box_number      SMALLINT NOT NULL DEFAULT 0,
  correct_count   INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  next_review_at  TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, vocabulary_id)
);
ALTER TABLE public.vocabulary_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vocab progress"
  ON public.vocabulary_progress FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- QUIZ SESSIONS & RESULTS
-- ============================================================
CREATE TABLE public.quiz_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_type       TEXT NOT NULL CHECK (quiz_type IN ('multiple_choice','input','mixed')),
  scope           TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own quiz sessions"
  ON public.quiz_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.quiz_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_ref_type TEXT NOT NULL CHECK (question_ref_type IN ('hangul','vocabulary')),
  question_ref_id INTEGER NOT NULL,
  user_answer     TEXT NOT NULL,
  correct_answer  TEXT NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  response_ms     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONVERSATION HISTORY
-- ============================================================
CREATE TABLE public.conversation_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT,
  scenario        TEXT,
  message_count   INTEGER NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations"
  ON public.conversation_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.conversation_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content         TEXT NOT NULL,
  corrections     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON public.conversation_messages(session_id, created_at);

-- ============================================================
-- BADGES / ACHIEVEMENTS
-- ============================================================
CREATE TABLE public.badge_definitions (
  id          SERIAL PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  name_jp     TEXT NOT NULL,
  description_jp TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '🏆',
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  condition   JSONB NOT NULL
);

CREATE TABLE public.user_badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id        INTEGER NOT NULL REFERENCES public.badge_definitions(id),
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own badges"
  ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own badges"
  ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DAILY ACTIVITY LOG
-- ============================================================
CREATE TABLE public.daily_activity (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  xp_earned   INTEGER NOT NULL DEFAULT 0,
  minutes_studied INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, activity_date)
);
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own activity"
  ON public.daily_activity FOR ALL USING (auth.uid() = user_id);

-- Helper function
CREATE OR REPLACE FUNCTION public.record_activity(
  p_user_id UUID, p_xp INTEGER, p_minutes INTEGER
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.daily_activity (user_id, activity_date, xp_earned, minutes_studied)
  VALUES (p_user_id, CURRENT_DATE, p_xp, p_minutes)
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    xp_earned = daily_activity.xp_earned + EXCLUDED.xp_earned,
    minutes_studied = daily_activity.minutes_studied + EXCLUDED.minutes_studied;

  UPDATE public.profiles
  SET xp_total = xp_total + p_xp, last_studied = CURRENT_DATE
  WHERE id = p_user_id;
END;
$$;
