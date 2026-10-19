-- ─────────────────────────────────────────────────────────────────
-- VivaBank Supabase Schema
-- Real activity tracking, progress, streaks, XP, and exam attempts
-- ─────────────────────────────────────────────────────────────────

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Subjects Table (Canonical syllabus definitions)
CREATE TABLE IF NOT EXISTS public.subjects (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_label TEXT NOT NULL,
  color TEXT NOT NULL,
  total_topics INTEGER NOT NULL DEFAULT 0,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Topic Progress Table
CREATE TABLE IF NOT EXISTS public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subject_code TEXT NOT NULL REFERENCES public.subjects(code) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_user_subject_topic UNIQUE (user_id, subject_code, topic_name)
);

-- 4. Question Attempts Table
CREATE TABLE IF NOT EXISTS public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  subject_code TEXT NOT NULL REFERENCES public.subjects(code) ON DELETE CASCADE,
  topic_name TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  accuracy_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Exam Attempts Table
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subject_code TEXT NOT NULL REFERENCES public.subjects(code) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('practice', 'viva')),
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  topics_covered JSONB DEFAULT '[]'::jsonb,
  mode TEXT,
  difficulty TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. XP Events Table
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_key TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  is_all_star BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Daily Activity Table (One record per user per calendar day)
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  activity_date DATE NOT NULL,
  qualifying_actions INTEGER NOT NULL DEFAULT 1,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_user_daily_activity UNIQUE (user_id, activity_date)
);

ALTER TABLE public.xp_events
  ADD CONSTRAINT unique_user_xp_event UNIQUE (user_id, event_key);

-- ─────────────────────────────────────────────────────────────────
-- Indexes for performance
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_topic_progress_user ON public.topic_progress(user_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON public.question_attempts(user_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON public.exam_attempts(user_id, subject_code, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_events_user_time ON public.xp_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, activity_date DESC);

-- Public leaderboard projection. It intentionally exposes no email or activity detail.
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id::TEXT AS user_id,
  p.display_name AS candidate_name,
  COALESCE(SUM(x.xp_amount), 0)::INTEGER AS lifetime_xp,
  COALESCE(SUM(x.xp_amount) FILTER (
    WHERE x.created_at >= date_trunc('week', timezone('utc', now()))
  ), 0)::INTEGER AS weekly_xp
FROM public.profiles p
LEFT JOIN public.xp_events x ON x.user_id = p.user_id
GROUP BY p.id, p.display_name;

-- Students can read and write only their own private records. The leaderboard
-- view is the only public projection consumed by the client.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY topic_progress_self ON public.topic_progress
  FOR ALL USING (user_id = auth.uid()::TEXT) WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY question_attempts_self ON public.question_attempts
  FOR ALL USING (user_id = auth.uid()::TEXT) WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY exam_attempts_self ON public.exam_attempts
  FOR ALL USING (user_id = auth.uid()::TEXT) WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY xp_events_self ON public.xp_events
  FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY daily_activity_self ON public.daily_activity
  FOR ALL USING (user_id = auth.uid()::TEXT) WITH CHECK (user_id = auth.uid()::TEXT);

-- XP is derived from stored activity, never accepted as a client total.
CREATE OR REPLACE FUNCTION public.award_question_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_correct THEN
    INSERT INTO public.xp_events (user_id, event_key, xp_amount, reason, is_all_star)
    VALUES (
      NEW.user_id,
      'question-correct:' || NEW.question_id,
      2,
      'Correct answer',
      NEW.accuracy_score >= 90
    )
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_exam_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.xp_events (user_id, event_key, xp_amount, reason, is_all_star)
  VALUES (
    NEW.user_id,
    'exam:' || NEW.id,
    10 + (NEW.score * 2),
    'Completed exam',
    NEW.accuracy >= 90
  )
  ON CONFLICT (user_id, event_key) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_topic_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.xp_events (user_id, event_key, xp_amount, reason)
  VALUES (
    NEW.user_id,
    'topic:' || NEW.subject_code || ':' || NEW.topic_name,
    5,
    'Completed topic'
  )
  ON CONFLICT (user_id, event_key) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS question_attempt_award_xp ON public.question_attempts;
CREATE TRIGGER question_attempt_award_xp
  AFTER INSERT ON public.question_attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_question_xp();

DROP TRIGGER IF EXISTS exam_attempt_award_xp ON public.exam_attempts;
CREATE TRIGGER exam_attempt_award_xp
  AFTER INSERT ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_exam_xp();

DROP TRIGGER IF EXISTS topic_progress_award_xp ON public.topic_progress;
CREATE TRIGGER topic_progress_award_xp
  AFTER INSERT ON public.topic_progress
  FOR EACH ROW EXECUTE FUNCTION public.award_topic_xp();

-- ─────────────────────────────────────────────────────────────────
-- Seed Subjects Data
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.subjects (code, name, short_label, color, total_topics, topics)
VALUES
  ('CS301', 'Computer Networks', 'Comp. Networks', '#7c3aed', 7, '[
    "Introduction, OSI & TCP/IP",
    "Physical Layer & Transmission",
    "Data Link Layer & LLC",
    "MAC & Shared Ethernet",
    "Network Layer & Routing",
    "Transport Layer: UDP/TCP",
    "Application Layer & Sockets"
  ]'::jsonb),
  ('CS201', 'Data Structures & Algorithms', 'Data Structures', '#3b82f6', 9, '[
    "Binary Search Trees",
    "Graph Algorithms",
    "Dynamic Programming",
    "Sorting & Searching",
    "Hash Tables",
    "Heaps & Priority Queues",
    "Greedy Algorithms",
    "Divide & Conquer",
    "Disjoint Sets"
  ]'::jsonb),
  ('CS302', 'Operating Systems', 'Op. Systems', '#22c55e', 8, '[
    "Deadlock Detection & Prevention",
    "Virtual Memory & Paging",
    "Threads & Synchronization",
    "CPU Scheduling",
    "File Systems",
    "Disk Scheduling",
    "Process Synchronization",
    "System Calls"
  ]'::jsonb),
  ('CS303', 'Database Systems', 'Databases', '#ec4899', 6, '[
    "SQL Joins & Optimization",
    "B+ Tree Indexing",
    "Normalization Forms",
    "Transactions & ACID",
    "Concurrency Control",
    "Relational Algebra"
  ]'::jsonb),
  ('AI401', 'Machine Learning & AI', 'ML & AI', '#f59e0b', 11, '[
    "Gradient Descent",
    "Decision Trees",
    "Neural Network Architecture",
    "Support Vector Machines",
    "Clustering & K-Means",
    "Model Evaluation & ROC",
    "Regularization & Overfitting",
    "Ensemble Methods",
    "CNNs & Computer Vision",
    "Natural Language Processing",
    "Reinforcement Learning"
  ]'::jsonb),
  ('CS204', 'Web Engineering', 'Web Engg.', '#06b6d4', 5, '[
    "REST API Design",
    "Authentication & JWT",
    "Performance Optimization",
    "DOM Architecture",
    "Security (CORS & CSRF)"
  ]'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  short_label = EXCLUDED.short_label,
  color = EXCLUDED.color,
  total_topics = EXCLUDED.total_topics,
  topics = EXCLUDED.topics;
