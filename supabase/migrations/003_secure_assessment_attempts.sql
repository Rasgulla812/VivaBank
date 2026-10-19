-- Secure assessment attempts.
-- Scores are calculated by PostgreSQL from rows in public.questions.

-- These stable records back the existing Computer Networks practice bank.
-- Other in-code question banks should be migrated before being marked verified.
INSERT INTO public.questions (
  id, subject_code, topic_name, prompt, answer, explanation, difficulty,
  tags, source_kind, source_label, is_published, metadata
)
VALUES
(
  '11111111-1111-4111-8111-111111111111', 'CS301', 'Transport Layer: UDP/TCP',
  'Which sequence correctly describes TCP connection establishment?',
  'SYN → SYN-ACK → ACK',
  'Three messages synchronize sequence numbers and confirm reachability in both directions.',
  'Medium', ARRAY['TCP', 'handshake', 'reliability'], 'curated',
  'MUJ CS301 syllabus · Transport Layer', true, '{}'::jsonb
),
(
  '22222222-2222-4222-8222-222222222222', 'CS301', 'Network Layer & Routing',
  'A /24 network must be divided into at least six equal subnets. Determine the new prefix and usable hosts per subnet.',
  'Borrow 3 host bits because 2^3 = 8 subnets, giving a /27 prefix. Each subnet has 2^5 = 32 addresses, of which 30 are usable.',
  'Choose the smallest number of borrowed bits that meets the subnet count.',
  'Hard', ARRAY['IPv4', 'CIDR', 'numerical'], 'curated',
  'MUJ CS301 syllabus · Classless Addressing', true,
  '{"accepted_answers":["/27 30 hosts","27 30 usable hosts","prefix 27 30 hosts"]}'::jsonb
),
(
  '33333333-3333-4333-8333-333333333333', 'CS301', 'Data Link Layer & LLC',
  'Which ARQ protocol retransmits only the frames that are lost or damaged?',
  'Selective Repeat ARQ',
  'Selective Repeat retransmits only missing or damaged frames.',
  'Medium', ARRAY['ARQ', 'LLC', 'error control'], 'curated',
  'MUJ CS301 syllabus · Data Link Layer', true, '{}'::jsonb
),
(
  '44444444-4444-4444-8444-444444444444', 'CS301', 'Physical Layer & Transmission',
  'A channel has a bandwidth of 3 kHz and an SNR of 30 dB. Use Shannon capacity to estimate its maximum data rate.',
  'C = B log2(1 + SNR) = approximately 29.9 kbps.',
  'Shannon capacity is an upper bound for a noisy channel.',
  'Hard', ARRAY['Shannon', 'capacity', 'numerical'], 'curated',
  'MUJ CS301 syllabus · Physical Layer', true,
  '{"accepted_answers":["29.9 kbps","29.9 kilobits","29.9 kilobit"]}'::jsonb
),
(
  '55555555-5555-4555-8555-555555555555', 'CS301', 'Application Layer & Sockets',
  'What happens during recursive DNS resolution?',
  'The contacted DNS server finds the final answer on behalf of the client',
  'Recursive service makes the contacted server responsible for finding the final answer.',
  'Easy', ARRAY['DNS', 'application layer', 'resolution'], 'curated',
  'MUJ CS301 syllabus · Application Layer', true, '{}'::jsonb
),
(
  '61111111-1111-4111-8111-111111111111', 'CS201', 'Binary Search Trees',
  'Course practice question for Data Structures & Algorithms.',
  'A complete answer should define Binary Search Trees, explain its main steps, and connect it to a practical Data Structures & Algorithms example.',
  'This question is specific to Data Structures & Algorithms.', 'Medium',
  ARRAY['CS201', 'Binary Search Trees'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '61111111-1111-4111-8111-111111111112', 'CS201', 'Binary Search Trees',
  'Compare two approaches to Binary Search Trees in Data Structures & Algorithms.',
  'A complete answer should define Binary Search Trees, explain its main steps, and connect it to a practical Data Structures & Algorithms example.',
  'This question is specific to Data Structures & Algorithms.', 'Hard',
  ARRAY['CS201', 'Binary Search Trees'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '61111111-1111-4111-8111-111111111113', 'CS201', 'Binary Search Trees',
  'Diagnose a realistic failure involving Binary Search Trees in Data Structures & Algorithms.',
  'A complete answer should define Binary Search Trees, explain its main steps, and connect it to a practical Data Structures & Algorithms example.',
  'This question is specific to Data Structures & Algorithms.', 'Medium',
  ARRAY['CS201', 'Binary Search Trees'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '62222222-2222-4222-8222-222222222221', 'CS302', 'Deadlock Detection & Prevention',
  'Course practice question for Operating Systems.',
  'A complete answer should define Deadlock Detection & Prevention, explain its main steps, and connect it to a practical Operating Systems example.',
  'This question is specific to Operating Systems.', 'Medium',
  ARRAY['CS302', 'Deadlock Detection & Prevention'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '62222222-2222-4222-8222-222222222222', 'CS302', 'Deadlock Detection & Prevention',
  'Compare two approaches to Deadlock Detection & Prevention in Operating Systems.',
  'A complete answer should define Deadlock Detection & Prevention, explain its main steps, and connect it to a practical Operating Systems example.',
  'This question is specific to Operating Systems.', 'Hard',
  ARRAY['CS302', 'Deadlock Detection & Prevention'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '62222222-2222-4222-8222-222222222223', 'CS302', 'Deadlock Detection & Prevention',
  'Diagnose a realistic failure involving Deadlock Detection & Prevention in Operating Systems.',
  'A complete answer should define Deadlock Detection & Prevention, explain its main steps, and connect it to a practical Operating Systems example.',
  'This question is specific to Operating Systems.', 'Medium',
  ARRAY['CS302', 'Deadlock Detection & Prevention'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '63333333-3333-4333-8333-333333333331', 'CS303', 'SQL Joins & Optimization',
  'Course practice question for Database Systems.',
  'A complete answer should define SQL Joins & Optimization, explain its main steps, and connect it to a practical Database Systems example.',
  'This question is specific to Database Systems.', 'Medium',
  ARRAY['CS303', 'SQL Joins & Optimization'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '63333333-3333-4333-8333-333333333332', 'CS303', 'SQL Joins & Optimization',
  'Compare two approaches to SQL Joins & Optimization in Database Systems.',
  'A complete answer should define SQL Joins & Optimization, explain its main steps, and connect it to a practical Database Systems example.',
  'This question is specific to Database Systems.', 'Hard',
  ARRAY['CS303', 'SQL Joins & Optimization'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '63333333-3333-4333-8333-333333333333', 'CS303', 'SQL Joins & Optimization',
  'Diagnose a realistic failure involving SQL Joins & Optimization in Database Systems.',
  'A complete answer should define SQL Joins & Optimization, explain its main steps, and connect it to a practical Database Systems example.',
  'This question is specific to Database Systems.', 'Medium',
  ARRAY['CS303', 'SQL Joins & Optimization'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '64444444-4444-4444-8444-444444444441', 'AI401', 'Gradient Descent',
  'Course practice question for Machine Learning & AI.',
  'A complete answer should define Gradient Descent, explain its main steps, and connect it to a practical Machine Learning & AI example.',
  'This question is specific to Machine Learning & AI.', 'Medium',
  ARRAY['AI401', 'Gradient Descent'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '64444444-4444-4444-8444-444444444442', 'AI401', 'Gradient Descent',
  'Compare two approaches to Gradient Descent in Machine Learning & AI.',
  'A complete answer should define Gradient Descent, explain its main steps, and connect it to a practical Machine Learning & AI example.',
  'This question is specific to Machine Learning & AI.', 'Hard',
  ARRAY['AI401', 'Gradient Descent'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '64444444-4444-4444-8444-444444444443', 'AI401', 'Gradient Descent',
  'Diagnose a realistic failure involving Gradient Descent in Machine Learning & AI.',
  'A complete answer should define Gradient Descent, explain its main steps, and connect it to a practical Machine Learning & AI example.',
  'This question is specific to Machine Learning & AI.', 'Medium',
  ARRAY['AI401', 'Gradient Descent'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '65555555-5555-4555-8555-555555555551', 'CS204', 'REST API Design',
  'Course practice question for Web Engineering.',
  'A complete answer should define REST API Design, explain its main steps, and connect it to a practical Web Engineering example.',
  'This question is specific to Web Engineering.', 'Medium',
  ARRAY['CS204', 'REST API Design'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '65555555-5555-4555-8555-555555555552', 'CS204', 'REST API Design',
  'Compare two approaches to REST API Design in Web Engineering.',
  'A complete answer should define REST API Design, explain its main steps, and connect it to a practical Web Engineering example.',
  'This question is specific to Web Engineering.', 'Hard',
  ARRAY['CS204', 'REST API Design'], 'curated', 'Course question bank', true, '{}'::jsonb
),
(
  '65555555-5555-4555-8555-555555555553', 'CS204', 'REST API Design',
  'Diagnose a realistic failure involving REST API Design in Web Engineering.',
  'A complete answer should define REST API Design, explain its main steps, and connect it to a practical Web Engineering example.',
  'This question is specific to Web Engineering.', 'Medium',
  ARRAY['CS204', 'REST API Design'], 'curated', 'Course question bank', true, '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL REFERENCES public.subjects(code) ON DELETE RESTRICT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'exam')),
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  idempotency_key TEXT NOT NULL CHECK (char_length(idempotency_key) BETWEEN 16 AND 120),
  total_questions INTEGER NOT NULL CHECK (total_questions BETWEEN 1 AND 100),
  correct_answers INTEGER CHECK (correct_answers IS NULL OR correct_answers BETWEEN 0 AND total_questions),
  score NUMERIC(5,2) CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT assessment_attempts_submit_state CHECK (
    (status = 'completed' AND submitted_at IS NOT NULL AND correct_answers IS NOT NULL AND score IS NOT NULL)
    OR status <> 'completed'
  ),
  CONSTRAINT assessment_attempts_user_key UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.assessment_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_order INTEGER NOT NULL CHECK (question_order BETWEEN 1 AND 100),
  submitted_answer TEXT NOT NULL DEFAULT '',
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  CONSTRAINT assessment_attempt_answers_unique_question UNIQUE (attempt_id, question_id),
  CONSTRAINT assessment_attempt_answers_unique_order UNIQUE (attempt_id, question_order)
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_time
  ON public.assessment_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_attempt_answers_attempt
  ON public.assessment_attempt_answers(attempt_id, question_order);

ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempt_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assessment_attempts_select_own ON public.assessment_attempts;
CREATE POLICY assessment_attempts_select_own ON public.assessment_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS assessment_attempt_answers_select_own ON public.assessment_attempt_answers;
CREATE POLICY assessment_attempt_answers_select_own ON public.assessment_attempt_answers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  );

REVOKE ALL ON public.assessment_attempts FROM anon, authenticated;
REVOKE ALL ON public.assessment_attempt_answers FROM anon, authenticated;
GRANT SELECT ON public.assessment_attempts, public.assessment_attempt_answers TO authenticated;

CREATE OR REPLACE FUNCTION public.start_assessment_attempt(
  p_subject_code TEXT,
  p_assessment_type TEXT,
  p_question_ids UUID[],
  p_idempotency_key TEXT
)
RETURNS TABLE (attempt_id UUID, question_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_id UUID;
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_assessment_type NOT IN ('quiz', 'exam') THEN
    RAISE EXCEPTION 'Unsupported assessment type';
  END IF;
  IF p_question_ids IS NULL OR cardinality(p_question_ids) < 1 OR cardinality(p_question_ids) > 100 THEN
    RAISE EXCEPTION 'An assessment must contain between 1 and 100 questions';
  END IF;
  IF p_idempotency_key IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 120 THEN
    RAISE EXCEPTION 'A valid idempotency key is required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = p_subject_code) THEN
    RAISE EXCEPTION 'Unknown subject';
  END IF;

  -- Serialize retries using the same idempotency key so concurrent requests
  -- return the same attempt instead of creating duplicate answer sets.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(auth.uid()::TEXT || ':' || p_idempotency_key, 0)
  );

  SELECT id INTO v_attempt_id
  FROM public.assessment_attempts
  WHERE user_id = auth.uid() AND idempotency_key = p_idempotency_key
  FOR UPDATE;

  IF v_attempt_id IS NOT NULL THEN
    SELECT total_questions INTO v_count FROM public.assessment_attempts WHERE id = v_attempt_id;
    RETURN QUERY SELECT v_attempt_id, v_count;
    RETURN;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.questions q
  WHERE q.id = ANY(p_question_ids)
    AND q.subject_code = p_subject_code
    AND (q.is_published OR q.created_by = auth.uid());

  IF v_count <> cardinality(p_question_ids) THEN
    RAISE EXCEPTION 'One or more questions are unavailable for this assessment';
  END IF;

  INSERT INTO public.assessment_attempts (
    user_id, subject_code, assessment_type, idempotency_key, total_questions
  )
  VALUES (
    auth.uid(), p_subject_code, p_assessment_type, p_idempotency_key, cardinality(p_question_ids)
  )
  RETURNING id INTO v_attempt_id;

  INSERT INTO public.assessment_attempt_answers (attempt_id, question_id, question_order)
  SELECT v_attempt_id, question_id, ordinality::INTEGER
  FROM unnest(p_question_ids) WITH ORDINALITY AS items(question_id, ordinality);

  RETURN QUERY SELECT v_attempt_id, cardinality(p_question_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_assessment_attempt(
  p_attempt_id UUID,
  p_answers JSONB
)
RETURNS TABLE (
  attempt_id UUID,
  status TEXT,
  total_questions INTEGER,
  correct_answers INTEGER,
  score NUMERIC(5,2),
  submitted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.assessment_attempts%ROWTYPE;
  v_answer JSONB;
  v_question_id UUID;
  v_submitted TEXT;
  v_correct BOOLEAN;
  v_correct_count INTEGER := 0;
  v_submitted_at TIMESTAMPTZ := timezone('utc', now());
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF jsonb_typeof(p_answers) <> 'array' THEN
    RAISE EXCEPTION 'Answers must be an array';
  END IF;

  SELECT * INTO v_attempt
  FROM public.assessment_attempts
  WHERE id = p_attempt_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment attempt not found';
  END IF;

  IF v_attempt.status = 'completed' THEN
    RETURN QUERY SELECT v_attempt.id, v_attempt.status, v_attempt.total_questions,
      v_attempt.correct_answers, v_attempt.score, v_attempt.submitted_at;
    RETURN;
  END IF;

  FOR v_answer IN SELECT value FROM jsonb_array_elements(p_answers)
  LOOP
    v_question_id := (v_answer->>'question_id')::UUID;
    v_submitted := left(coalesce(v_answer->>'answer', ''), 12000);

    SELECT lower(regexp_replace(trim(v_submitted), '\s+', ' ', 'g')) =
      lower(regexp_replace(trim(q.answer), '\s+', ' ', 'g'))
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(q.metadata->'accepted_answers') = 'array'
            THEN q.metadata->'accepted_answers' ELSE '[]'::jsonb END
        ) accepted(answer)
        WHERE lower(regexp_replace(trim(v_submitted), '\s+', ' ', 'g')) =
          lower(regexp_replace(trim(accepted.answer), '\s+', ' ', 'g'))
      )
    INTO v_correct
    FROM public.questions q
    JOIN public.assessment_attempt_answers a ON a.question_id = q.id
    WHERE a.attempt_id = v_attempt.id AND q.id = v_question_id;

    IF v_correct IS NULL THEN
      RAISE EXCEPTION 'Answer contains a question outside this attempt';
    END IF;

    UPDATE public.assessment_attempt_answers
    SET submitted_answer = v_submitted, is_correct = v_correct, answered_at = v_submitted_at
    WHERE attempt_id = v_attempt.id AND question_id = v_question_id;

    IF v_correct THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;

  UPDATE public.assessment_attempts
  SET status = 'completed',
      correct_answers = v_correct_count,
      score = round((v_correct_count::NUMERIC / total_questions::NUMERIC) * 100, 2),
      submitted_at = v_submitted_at
  WHERE id = v_attempt.id;

  RETURN QUERY
  SELECT a.id, a.status, a.total_questions, a.correct_answers, a.score, a.submitted_at
  FROM public.assessment_attempts a
  WHERE a.id = v_attempt.id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_assessment_attempt(TEXT, TEXT, UUID[], TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_assessment_attempt(UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_assessment_attempt(TEXT, TEXT, UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_assessment_attempt(UUID, JSONB) TO authenticated;
