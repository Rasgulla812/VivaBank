-- Qualify assessment answer columns so they cannot conflict with RPC output
-- parameters or local PL/pgSQL variables.

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
    JOIN public.assessment_attempt_answers answer_row
      ON answer_row.question_id = q.id
    WHERE answer_row.attempt_id = v_attempt.id AND q.id = v_question_id;

    IF v_correct IS NULL THEN
      RAISE EXCEPTION 'Answer contains a question outside this attempt';
    END IF;

    UPDATE public.assessment_attempt_answers AS answer_row
    SET submitted_answer = v_submitted,
        is_correct = v_correct,
        answered_at = v_submitted_at
    WHERE answer_row.attempt_id = v_attempt.id
      AND answer_row.question_id = v_question_id;

    IF v_correct THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;

  UPDATE public.assessment_attempts AS attempt_row
  SET status = 'completed',
      correct_answers = v_correct_count,
      score = round((v_correct_count::NUMERIC / attempt_row.total_questions::NUMERIC) * 100, 2),
      submitted_at = v_submitted_at
  WHERE attempt_row.id = v_attempt.id;

  RETURN QUERY
  SELECT attempt_row.id, attempt_row.status, attempt_row.total_questions,
    attempt_row.correct_answers, attempt_row.score, attempt_row.submitted_at
  FROM public.assessment_attempts AS attempt_row
  WHERE attempt_row.id = v_attempt.id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_assessment_attempt(UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_assessment_attempt(UUID, JSONB) TO authenticated;
