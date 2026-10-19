import { getSupabaseClient, getOrCreateUserId, isSupabaseConfigured } from './supabaseClient'
import {
  type LearningMetricsData,
  CANONICAL_SUBJECTS,
  resolveSubjectCode,
  createDefaultMetrics,
} from './metrics'

/* ─────────────────────────────────────────────────────────────────
   Database Service for Supabase
   Maps to:
   - profiles
   - subjects
   - topic_progress
   - question_attempts
   - exam_attempts
   - xp_events
   - daily_activity
───────────────────────────────────────────────────────────────── */

export interface DatabaseSyncStatus {
  isConfigured: boolean
  lastSyncedAt: string | null
  syncError: string | null
}

export interface LeaderboardEntry {
  userId: string
  candidateName: string
  lifetimeXp: number
  weeklyXp: number
}

export interface AssessmentAttemptSummary {
  attemptId: string
  status: 'in_progress' | 'completed' | 'abandoned'
  totalQuestions: number
  correctAnswers: number | null
  score: number | null
  submittedAt: string | null
}

let lastSyncTime: string | null = null
let lastSyncError: string | null = null

export function getDatabaseSyncStatus(): DatabaseSyncStatus {
  return {
    isConfigured: isSupabaseConfigured(),
    lastSyncedAt: lastSyncTime,
    syncError: lastSyncError,
  }
}

function requireAuthenticatedClient() {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase is not configured.')
  return client
}

function assessmentPersistenceError(error: { code?: string; message?: string }): Error {
  if (error.code === 'PGRST202' || error.code === 'PGRST205' || error.message?.toLowerCase().includes('could not find the function')) {
    return new Error('The Supabase assessment RPC is missing. Apply 003_secure_assessment_attempts.sql in the connected Supabase project, then refresh.')
  }
  if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) {
    return new Error('The Supabase assessment tables are missing. Apply 003_secure_assessment_attempts.sql in the connected Supabase project, then refresh.')
  }
  return new Error(error.message || 'Supabase could not create the assessment attempt.')
}

  export async function startAssessmentAttempt(params: {
    subjectCode: string
    assessmentType: 'quiz' | 'exam'
    questionIds: string[]
    idempotencyKey: string
  }): Promise<{ attemptId: string; questionCount: number }> {
    const client = requireAuthenticatedClient()
    const { data, error } = await client.rpc('start_assessment_attempt', {
      p_subject_code: resolveSubjectCode(params.subjectCode),
      p_assessment_type: params.assessmentType,
      p_question_ids: params.questionIds,
      p_idempotency_key: params.idempotencyKey,
    })
    if (error) throw assessmentPersistenceError(error)
    const row = Array.isArray(data) ? data[0] : data
    if (!row?.attempt_id) throw new Error('The server did not create the assessment attempt.')
    return {
      attemptId: String(row.attempt_id),
      questionCount: Number(row.question_count),
    }
  }

  export async function submitAssessmentAttempt(params: {
    attemptId: string
    answers: Array<{ questionId: string; answer: string }>
  }): Promise<AssessmentAttemptSummary> {
    const client = requireAuthenticatedClient()
    const { data, error } = await client.rpc('submit_assessment_attempt', {
      p_attempt_id: params.attemptId,
      p_answers: params.answers.map((answer) => ({
        question_id: answer.questionId,
        answer: answer.answer,
      })),
    })
    if (error) throw assessmentPersistenceError(error)
    const row = Array.isArray(data) ? data[0] : data
    if (!row?.attempt_id) throw new Error('The server did not return the assessment result.')
    return {
      attemptId: String(row.attempt_id),
      status: row.status,
      totalQuestions: Number(row.total_questions),
      correctAnswers: row.correct_answers === null ? null : Number(row.correct_answers),
      score: row.score === null ? null : Number(row.score),
      submittedAt: row.submitted_at,
    }
  }

  export async function fetchAssessmentAnswers(attemptId: string): Promise<Array<{
    questionId: string
    submittedAnswer: string
    isCorrect: boolean
  }>> {
    const client = requireAuthenticatedClient()
    const { data, error } = await client
      .from('assessment_attempt_answers')
      .select('question_id, submitted_answer, is_correct')
      .eq('attempt_id', attemptId)
      .order('question_order', { ascending: true })
    if (error) throw error
    return (data || []).map((row) => ({
      questionId: String(row.question_id),
      submittedAnswer: row.submitted_answer,
      isCorrect: Boolean(row.is_correct),
    }))
  }

  export async function startVivaAssessment(params: {
    subjectCode: string
    questionIds: string[]
    idempotencyKey: string
  }): Promise<{ attemptId: string; questionCount: number }> {
    return startAssessmentAttempt({
      ...params,
      assessmentType: 'exam',
    })
  }

  export async function fetchAssessmentHistory(subjectCode?: string): Promise<AssessmentAttemptSummary[]> {
    const client = requireAuthenticatedClient()
    let query = client
      .from('assessment_attempts')
      .select('id, status, total_questions, correct_answers, score, submitted_at')
      .eq('status', 'completed')
      .order('submitted_at', { ascending: false })
    if (subjectCode) query = query.eq('subject_code', resolveSubjectCode(subjectCode))
    const { data, error } = await query
    if (error) throw error
    return (data || []).map((row) => ({
      attemptId: String(row.id),
      status: row.status,
      totalQuestions: Number(row.total_questions),
      correctAnswers: row.correct_answers === null ? null : Number(row.correct_answers),
      score: row.score === null ? null : Number(row.score),
      submittedAt: row.submitted_at,
    }))
  }
/**
 * Record a question attempt in Supabase
 */
export async function dbRecordQuestionAttempt(params: {
  questionId: string
  subjectCode: string
  topicName?: string
  isCorrect: boolean
  accuracyScore: number
}): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return

  const userId = getOrCreateUserId()
  const code = resolveSubjectCode(params.subjectCode)

  try {
    const { error } = await client.from('question_attempts').insert({
      user_id: userId,
      question_id: params.questionId,
      subject_code: code,
      topic_name: params.topicName || null,
      is_correct: params.isCorrect,
      accuracy_score: params.accuracyScore,
      attempted_at: new Date().toISOString(),
    })

    if (error) throw error
    lastSyncTime = new Date().toLocaleTimeString()
    lastSyncError = null
  } catch (err) {
    console.warn('Supabase question attempt sync skipped or failed:', err)
    lastSyncError = err instanceof Error ? err.message : 'Database sync error'
  }
}

/**
 * Record an exam attempt in Supabase
 */
export async function dbRecordExamAttempt(params: {
  subject: string
  examType: 'practice' | 'viva'
  score: number
  total: number
  accuracy: number
  topicsCovered?: string[]
  mode?: string
  difficulty?: string
}): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return

  const userId = getOrCreateUserId()
  const code = resolveSubjectCode(params.subject)

  try {
    const { error } = await client.from('exam_attempts').insert({
      user_id: userId,
      subject_code: code,
      exam_type: params.examType,
      score: params.score,
      total_questions: params.total,
      accuracy: params.accuracy,
      topics_covered: params.topicsCovered || [],
      mode: params.mode || null,
      difficulty: params.difficulty || null,
      completed_at: new Date().toISOString(),
    })

    if (error) throw error
    lastSyncTime = new Date().toLocaleTimeString()
    lastSyncError = null
  } catch (err) {
    console.warn('Supabase exam attempt sync skipped or failed:', err)
    lastSyncError = err instanceof Error ? err.message : 'Database sync error'
  }
}

/**
 * Record topic completion progress in Supabase
 */
export async function dbRecordTopicProgress(params: {
  subjectCode: string
  topicName: string
  isCompleted: boolean
}): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return

  const userId = getOrCreateUserId()
  const code = resolveSubjectCode(params.subjectCode)

  try {
    if (params.isCompleted) {
      const { error } = await client.from('topic_progress').upsert(
        {
          user_id: userId,
          subject_code: code,
          topic_name: params.topicName,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,subject_code,topic_name' }
      )
      if (error) throw error
    } else {
      const { error } = await client
        .from('topic_progress')
        .delete()
        .match({ user_id: userId, subject_code: code, topic_name: params.topicName })
      if (error) throw error
    }

    lastSyncTime = new Date().toLocaleTimeString()
    lastSyncError = null
  } catch (err) {
    console.warn('Supabase topic progress sync skipped or failed:', err)
    lastSyncError = err instanceof Error ? err.message : 'Database sync error'
  }
}

/**
 * Record an XP event in Supabase
 */
export async function dbRecordXPEvent(params: {
  xpAmount: number
  reason: string
  eventKey: string
  isAllStar?: boolean
}): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return

  const userId = getOrCreateUserId()

  try {
    const { error } = await client.from('xp_events').upsert({
      user_id: userId,
      xp_amount: params.xpAmount,
      reason: params.reason,
      event_key: params.eventKey,
      is_all_star: Boolean(params.isAllStar),
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,event_key', ignoreDuplicates: true })

    if (error) throw error
    lastSyncTime = new Date().toLocaleTimeString()
    lastSyncError = null
  } catch (err) {
    console.warn('Supabase XP event sync skipped or failed:', err)
    lastSyncError = err instanceof Error ? err.message : 'Database sync error'
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    const client = getSupabaseClient()
    if (!client) return []

    try {
      const { data, error } = await client
        .from('leaderboard')
        .select('user_id, candidate_name, lifetime_xp, weekly_xp')
        .order('lifetime_xp', { ascending: false })
        .order('user_id', { ascending: true })
        .limit(100)
      if (error) throw error
      return (data || []).map((row) => ({
        userId: row.user_id,
        candidateName: row.candidate_name,
        lifetimeXp: Number(row.lifetime_xp),
        weeklyXp: Number(row.weekly_xp),
      }))
    } catch (err) {
      lastSyncError = err instanceof Error ? err.message : 'Leaderboard fetch error'
      console.warn('Failed to load leaderboard:', err)
      return []
  }
}

/**
 * Record daily activity record for study streaks
 */
export async function dbRecordDailyActivity(activityDate: string): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return

  const userId = getOrCreateUserId()

  try {
    const { error } = await client.from('daily_activity').upsert(
      {
        user_id: userId,
        activity_date: activityDate,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,activity_date' }
    )

    if (error) throw error
    lastSyncTime = new Date().toLocaleTimeString()
    lastSyncError = null
  } catch (err) {
    console.warn('Supabase daily activity sync skipped or failed:', err)
    lastSyncError = err instanceof Error ? err.message : 'Database sync error'
  }
}

/**
 * Fetch full metrics data from Supabase for cross-device persistence
 */
export async function fetchMetricsFromSupabase(): Promise<LearningMetricsData | null> {
  const client = getSupabaseClient()
  if (!client) return null

  const userId = getOrCreateUserId()

  try {
    // 1. Fetch topic progress
    const { data: topicsData, error: topicsErr } = await client
      .from('topic_progress')
      .select('subject_code, topic_name')
      .eq('user_id', userId)

    if (topicsErr) throw topicsErr

    // 2. Fetch exam attempts
    const { data: examsData, error: examsErr } = await client
      .from('exam_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (examsErr) throw examsErr

    // Secure attempts are scored by the submit_assessment_attempt RPC.
    const { data: secureExamsData, error: secureExamsErr } = await client
      .from('assessment_attempts')
      .select('id, subject_code, assessment_type, correct_answers, total_questions, score, submitted_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('submitted_at', { ascending: false })

    if (secureExamsErr) throw secureExamsErr

    // 3. Fetch question attempts
    const { data: questionsData, error: questionsErr } = await client
      .from('question_attempts')
      .select('subject_code, is_correct')
      .eq('user_id', userId)

    if (questionsErr) throw questionsErr

    // 4. Fetch XP events
    const { data: xpData, error: xpErr } = await client
      .from('xp_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (xpErr) throw xpErr

    // 5. Fetch daily activity
    const { data: activityData, error: actErr } = await client
      .from('daily_activity')
      .select('activity_date')
      .eq('user_id', userId)
      .order('activity_date', { ascending: true })

    if (actErr) throw actErr

    // Build the metrics object
    const metrics = createDefaultMetrics()

    // Populate topics completed
    if (topicsData) {
      for (const row of topicsData) {
        const sub = metrics.subjects[row.subject_code]
        if (sub && !sub.topicsCompleted.includes(row.topic_name)) {
          sub.topicsCompleted.push(row.topic_name)
        }
      }
    }

    // Populate questions attempted & correct count
    if (questionsData) {
      for (const q of questionsData) {
        const sub = metrics.subjects[q.subject_code]
        if (sub) {
          sub.questionsAttempted++
          if (q.is_correct) sub.questionsCorrect++
        }
      }
    }

    // Populate exams
    if (examsData) {
      for (const e of examsData) {
        metrics.exams.push({
          id: e.id,
          subject: CANONICAL_SUBJECTS.find((s) => s.code === e.subject_code)?.name || e.subject_code,
          type: e.exam_type,
          date: e.completed_at,
          score: e.score,
          total: e.total_questions,
          accuracy: Number(e.accuracy),
          mode: e.mode,
          difficulty: e.difficulty,
          weakTopics: e.topics_covered || [],
        })
      }
    }

    if (secureExamsData) {
      for (const e of secureExamsData) {
        metrics.exams.push({
          id: e.id,
          subject: CANONICAL_SUBJECTS.find((s) => s.code === e.subject_code)?.name || e.subject_code,
          type: e.assessment_type === 'exam' ? 'viva' : 'practice',
          date: e.submitted_at,
          score: Number(e.correct_answers),
          total: Number(e.total_questions),
          accuracy: Number(e.score),
          weakTopics: [],
        })
      }
    }

    // Populate XP history
    if (xpData) {
      for (const x of xpData) {
        metrics.xpHistory.push({
          id: x.id,
          date: x.created_at,
          action: x.reason,
          xp: x.xp_amount,
          isAllStar: x.is_all_star,
        })
      }
    }

    // Populate activity dates
    if (activityData) {
      metrics.activityDates = activityData.map((a) => a.activity_date)
    }

    lastSyncTime = new Date().toLocaleTimeString()
    lastSyncError = null
    return metrics
  } catch (err) {
    console.warn('Failed to load metrics from Supabase:', err)
    lastSyncError = err instanceof Error ? err.message : 'Database fetch error'
    return null
  }
}
