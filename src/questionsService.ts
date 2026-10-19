import { getSupabaseClient } from './supabaseClient'

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard'
export type QuestionSourceKind = 'curated' | 'ai_generated'

export interface StoredQuestion {
  id: string
  subjectCode: string
  topicName: string | null
  prompt: string
  answer: string
  explanation: string | null
  difficulty: QuestionDifficulty
  tags: string[]
  sourceKind: QuestionSourceKind
  sourceLabel: string | null
  createdAt: string
}

interface StoredQuestionRow {
  id: string
  subject_code: string
  topic_name: string | null
  prompt: string
  answer: string
  explanation: string | null
  difficulty: QuestionDifficulty
  tags: string[]
  source_kind: QuestionSourceKind
  source_label: string | null
  created_at: string
}

function mapQuestion(row: StoredQuestionRow): StoredQuestion {
  return {
    id: row.id,
    subjectCode: row.subject_code,
    topicName: row.topic_name,
    prompt: row.prompt,
    answer: row.answer,
    explanation: row.explanation,
    difficulty: row.difficulty,
    tags: row.tags || [],
    sourceKind: row.source_kind,
    sourceLabel: row.source_label,
    createdAt: row.created_at,
  }
}

export async function fetchPublishedQuestions(params?: {
  subjectCode?: string
  difficulty?: QuestionDifficulty
}): Promise<StoredQuestion[]> {
  const client = getSupabaseClient()
  if (!client) return []

  let query = client
    .from('questions')
    .select('id, subject_code, topic_name, prompt, answer, explanation, difficulty, tags, source_kind, source_label, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (params?.subjectCode) query = query.eq('subject_code', params.subjectCode)
  if (params?.difficulty) query = query.eq('difficulty', params.difficulty)

  const { data, error } = await query
  if (error) throw new Error(`Unable to load questions: ${error.message}`)
  return (data as StoredQuestionRow[] | null || []).map(mapQuestion)
}

export async function saveGeneratedQuestions(params: {
  subjectCode: string
  topicName: string
  sourceLabel: string
  questions: Array<{
    prompt: string
    answer: string
    rubric: string[]
    type: string
  }>
}): Promise<StoredQuestion[]> {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase is not configured; generated questions were not persisted.')

  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) throw new Error('Your session is unavailable; sign in again before saving generated questions.')

  const rows = params.questions.map((question) => ({
    subject_code: params.subjectCode,
    topic_name: params.topicName,
    prompt: question.prompt,
    answer: question.answer,
    explanation: question.rubric.join(' '),
    difficulty: 'Medium' as const,
    tags: [question.type, 'AI-generated'],
    source_kind: 'ai_generated' as const,
    source_label: params.sourceLabel,
    created_by: userData.user.id,
    is_published: false,
    metadata: { question_type: question.type, rubric: question.rubric },
  }))

  const { data, error } = await client
    .from('questions')
    .insert(rows)
    .select('id, subject_code, topic_name, prompt, answer, explanation, difficulty, tags, source_kind, source_label, created_at')
  if (error) throw new Error(`Unable to persist generated questions: ${error.message}`)
  return (data as StoredQuestionRow[] | null || []).map(mapQuestion)
}
