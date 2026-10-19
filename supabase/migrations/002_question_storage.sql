-- VivaBank question storage phase.
-- Questions are content records, not student activity. AI generation is stored
-- separately from learning progress and does not create XP or attempts.

CREATE TABLE IF NOT EXISTS public.subjects (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_label TEXT NOT NULL,
  color TEXT NOT NULL,
  total_topics INTEGER NOT NULL DEFAULT 0,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.subjects (code, name, short_label, color, total_topics, topics)
VALUES
  ('CS301', 'Computer Networks', 'Comp. Networks', '#7c3aed', 7, '["Introduction, OSI & TCP/IP", "Physical Layer & Transmission", "Data Link Layer & LLC", "MAC & Shared Ethernet", "Network Layer & Routing", "Transport Layer: UDP/TCP", "Application Layer & Sockets"]'::jsonb),
  ('CS201', 'Data Structures & Algorithms', 'Data Structures', '#3b82f6', 9, '["Binary Search Trees", "Graph Algorithms", "Dynamic Programming", "Sorting & Searching", "Hash Tables", "Heaps & Priority Queues", "Greedy Algorithms", "Divide & Conquer", "Disjoint Sets"]'::jsonb),
  ('CS302', 'Operating Systems', 'Op. Systems', '#22c55e', 8, '["Deadlock Detection & Prevention", "Virtual Memory & Paging", "Threads & Synchronization", "CPU Scheduling", "File Systems", "Disk Scheduling", "Process Synchronization", "System Calls"]'::jsonb),
  ('CS303', 'Database Systems', 'Databases', '#ec4899', 6, '["SQL Joins & Optimization", "B+ Tree Indexing", "Normalization Forms", "Transactions & ACID", "Concurrency Control", "Relational Algebra"]'::jsonb),
  ('AI401', 'Machine Learning & AI', 'ML & AI', '#f59e0b', 11, '["Gradient Descent", "Decision Trees", "Neural Network Architecture", "Support Vector Machines", "Clustering & K-Means", "Model Evaluation & ROC", "Regularization & Overfitting", "Ensemble Methods", "CNNs & Computer Vision", "Natural Language Processing", "Reinforcement Learning"]'::jsonb),
  ('CS204', 'Web Engineering', 'Web Engg.', '#06b6d4', 5, '["REST API Design", "Authentication & JWT", "Performance Optimization", "DOM Architecture", "Security (CORS & CSRF)"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code TEXT NOT NULL REFERENCES public.subjects(code) ON DELETE RESTRICT,
  topic_name TEXT,
  prompt TEXT NOT NULL CHECK (char_length(prompt) BETWEEN 15 AND 4000),
  answer TEXT NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 12000),
  explanation TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  source_kind TEXT NOT NULL CHECK (source_kind IN ('curated', 'ai_generated')),
  source_label TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_questions_published
  ON public.questions(subject_code, difficulty)
  WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_questions_owner
  ON public.questions(created_by, created_at DESC);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS questions_read_published ON public.questions;
DROP POLICY IF EXISTS questions_read_own ON public.questions;
DROP POLICY IF EXISTS questions_insert_own ON public.questions;
DROP POLICY IF EXISTS questions_update_own ON public.questions;

CREATE POLICY questions_read_published ON public.questions
  FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY questions_read_own ON public.questions
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY questions_insert_own ON public.questions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_published = false);

CREATE POLICY questions_update_own ON public.questions
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid() AND is_published = false);

GRANT SELECT, INSERT, UPDATE ON public.questions TO authenticated;
REVOKE ALL ON public.questions FROM anon;

CREATE OR REPLACE FUNCTION public.set_question_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS questions_updated_at ON public.questions;
CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_question_updated_at();
