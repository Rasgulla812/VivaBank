-- Immutable private answer keys for AI viva attempts.
-- The client can read submitted answers after completion, but never these keys.

ALTER TABLE public.assessment_attempt_answers
  ADD COLUMN IF NOT EXISTS prompt_snapshot TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.assessment_attempt_keys (
  attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  answer_key TEXT NOT NULL,
  rubric JSONB NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (attempt_id, question_id)
);

REVOKE ALL ON public.assessment_attempt_keys FROM PUBLIC, anon, authenticated;

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
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_assessment_type NOT IN ('quiz', 'exam') THEN RAISE EXCEPTION 'Unsupported assessment type'; END IF;
  IF p_question_ids IS NULL OR cardinality(p_question_ids) < 1 OR cardinality(p_question_ids) > 100 THEN
    RAISE EXCEPTION 'An assessment must contain between 1 and 100 questions';
  END IF;
  IF p_idempotency_key IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 120 THEN
    RAISE EXCEPTION 'A valid idempotency key is required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = p_subject_code) THEN
    RAISE EXCEPTION 'Unknown subject';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::TEXT || ':' || p_idempotency_key, 0));

  SELECT id, total_questions INTO v_attempt_id, v_count
  FROM public.assessment_attempts
  WHERE user_id = auth.uid() AND idempotency_key = p_idempotency_key
  FOR UPDATE;
  IF v_attempt_id IS NOT NULL THEN
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
  VALUES (auth.uid(), p_subject_code, p_assessment_type, p_idempotency_key, cardinality(p_question_ids))
  RETURNING id INTO v_attempt_id;

  INSERT INTO public.assessment_attempt_answers (attempt_id, question_id, question_order, prompt_snapshot)
  SELECT v_attempt_id, q.id, items.ordinality::INTEGER, q.prompt
  FROM unnest(p_question_ids) WITH ORDINALITY AS items(question_id, ordinality)
  JOIN public.questions q ON q.id = items.question_id;

  INSERT INTO public.assessment_attempt_keys (attempt_id, question_id, answer_key, rubric)
  SELECT v_attempt_id, q.id, q.answer,
    CASE
      WHEN jsonb_typeof(q.metadata->'rubric') = 'array' THEN q.metadata->'rubric'
      ELSE '[]'::jsonb
    END
  FROM unnest(p_question_ids) AS items(question_id)
  JOIN public.questions q ON q.id = items.question_id;

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
  v_answer_key TEXT;
  v_correct BOOLEAN;
  v_rubric JSONB;
  v_matches INTEGER;
  v_correct_count INTEGER := 0;
  v_submitted_at TIMESTAMPTZ := timezone('utc', now());
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF jsonb_typeof(p_answers) <> 'array' THEN RAISE EXCEPTION 'Answers must be an array'; END IF;

  SELECT * INTO v_attempt
  FROM public.assessment_attempts
  WHERE id = p_attempt_id AND user_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Assessment attempt not found'; END IF;
  IF v_attempt.status = 'completed' THEN
    RETURN QUERY SELECT v_attempt.id, v_attempt.status, v_attempt.total_questions,
      v_attempt.correct_answers, v_attempt.score, v_attempt.submitted_at;
    RETURN;
  END IF;

  FOR v_answer IN SELECT value FROM jsonb_array_elements(p_answers)
  LOOP
    v_question_id := (v_answer->>'question_id')::UUID;
    v_submitted := left(coalesce(v_answer->>'answer', ''), 12000);
    SELECT k.answer_key, k.rubric INTO v_answer_key, v_rubric
    FROM public.assessment_attempt_keys k
    WHERE k.attempt_id = v_attempt.id AND k.question_id = v_question_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Answer contains a question outside this attempt'; END IF;

    v_matches := 0;
    IF jsonb_typeof(v_rubric) = 'array' THEN
      SELECT count(*) INTO v_matches
      FROM jsonb_array_elements_text(v_rubric) criterion
      WHERE lower(v_answer->>'answer') LIKE '%' || lower(criterion) || '%';
    END IF;

    v_correct := lower(regexp_replace(trim(v_submitted), '\s+', ' ', 'g')) =
      lower(regexp_replace(trim(v_answer_key), '\s+', ' ', 'g'))
      OR (jsonb_array_length(v_rubric) > 0 AND v_matches >= ceil(jsonb_array_length(v_rubric)::NUMERIC / 2));

    UPDATE public.assessment_attempt_answers
    SET submitted_answer = left(coalesce(v_answer->>'answer', ''), 12000),
        is_correct = v_correct,
        answered_at = v_submitted_at
    WHERE attempt_id = v_attempt.id AND question_id = v_question_id;
    IF v_correct THEN v_correct_count := v_correct_count + 1; END IF;
  END LOOP;

  UPDATE public.assessment_attempts
  SET status = 'completed',
      correct_answers = v_correct_count,
      score = round((v_correct_count::NUMERIC / total_questions::NUMERIC) * 100, 2),
      submitted_at = v_submitted_at
  WHERE id = v_attempt.id;

  RETURN QUERY SELECT a.id, a.status, a.total_questions, a.correct_answers, a.score, a.submitted_at
  FROM public.assessment_attempts a WHERE a.id = v_attempt.id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_assessment_attempt(TEXT, TEXT, UUID[], TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_assessment_attempt(UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_assessment_attempt(TEXT, TEXT, UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_assessment_attempt(UUID, JSONB) TO authenticated;
