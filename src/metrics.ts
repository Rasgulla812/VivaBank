/* ────────────────────────────────────────────────────────────────
   Learning Metrics & Verified Activity Engine
   - Prep Progress: Real syllabus completion (topics completed / total)
   - XP, Streak, League: Strictly awarded on verified actions
   - Exam Hub: Real exam attempts & accuracy, 'Not attempted' if none
──────────────────────────────────────────────────────────────── */

import {
  dbRecordQuestionAttempt,
  dbRecordExamAttempt,
  dbRecordTopicProgress,
  dbRecordDailyActivity,
} from './supabaseService'

export interface SubjectMetric {
  code: string
  name: string
  shortLabel: string
  color: string
  totalTopics: number
  topics: string[]
  topicsCompleted: string[]
  questionsAttempted: number
  questionsCorrect: number
}

export interface ExamRecord {
  id: string
  subject: string
  type: 'viva' | 'practice'
  date: string // ISO timestamp
  score: number // questions correct / points
  total: number // questions count
  accuracy: number // 0-100 percentage
  mode?: string
  difficulty?: string
  weakTopics?: string[]
}

export interface XPRecord {
  id: string
  date: string // ISO timestamp
  action: string
  xp: number
  eventKey?: string
  isAllStar?: boolean
}

export interface LearningMetricsData {
  version: number
  subjects: Record<string, SubjectMetric>
  exams: ExamRecord[]
  activityDates: string[] // 'YYYY-MM-DD'
  xpHistory: XPRecord[]
}

export const CANONICAL_SUBJECTS: Omit<SubjectMetric, 'topicsCompleted' | 'questionsAttempted' | 'questionsCorrect'>[] = [
  {
    code: 'CS301',
    name: 'Computer Networks',
    shortLabel: 'Comp. Networks',
    color: '#7c3aed',
    totalTopics: 7,
    topics: [
      'Introduction, OSI & TCP/IP',
      'Physical Layer & Transmission',
      'Data Link Layer & LLC',
      'MAC & Shared Ethernet',
      'Network Layer & Routing',
      'Transport Layer: UDP/TCP',
      'Application Layer & Sockets',
    ],
  },
  {
    code: 'CS201',
    name: 'Data Structures & Algorithms',
    shortLabel: 'Data Structures',
    color: '#3b82f6',
    totalTopics: 9,
    topics: [
      'Binary Search Trees',
      'Graph Algorithms',
      'Dynamic Programming',
      'Sorting & Searching',
      'Hash Tables',
      'Heaps & Priority Queues',
      'Greedy Algorithms',
      'Divide & Conquer',
      'Disjoint Sets',
    ],
  },
  {
    code: 'CS302',
    name: 'Operating Systems',
    shortLabel: 'Op. Systems',
    color: '#22c55e',
    totalTopics: 8,
    topics: [
      'Deadlock Detection & Prevention',
      'Virtual Memory & Paging',
      'Threads & Synchronization',
      'CPU Scheduling',
      'File Systems',
      'Disk Scheduling',
      'Process Synchronization',
      'System Calls',
    ],
  },
  {
    code: 'CS303',
    name: 'Database Systems',
    shortLabel: 'Databases',
    color: '#ec4899',
    totalTopics: 6,
    topics: [
      'SQL Joins & Optimization',
      'B+ Tree Indexing',
      'Normalization Forms',
      'Transactions & ACID',
      'Concurrency Control',
      'Relational Algebra',
    ],
  },
  {
    code: 'AI401',
    name: 'Machine Learning & AI',
    shortLabel: 'ML & AI',
    color: '#f59e0b',
    totalTopics: 11,
    topics: [
      'Gradient Descent',
      'Decision Trees',
      'Neural Network Architecture',
      'Support Vector Machines',
      'Clustering & K-Means',
      'Model Evaluation & ROC',
      'Regularization & Overfitting',
      'Ensemble Methods',
      'CNNs & Computer Vision',
      'Natural Language Processing',
      'Reinforcement Learning',
    ],
  },
  {
    code: 'CS204',
    name: 'Web Engineering',
    shortLabel: 'Web Engg.',
    color: '#06b6d4',
    totalTopics: 5,
    topics: [
      'REST API Design',
      'Authentication & JWT',
      'Performance Optimization',
      'DOM Architecture',
      'Security (CORS & CSRF)',
    ],
  },
]

const STORAGE_KEY = 'vivabank-learning-metrics-v1'

export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createDefaultMetrics(): LearningMetricsData {
  const subjects: Record<string, SubjectMetric> = {}
  for (const s of CANONICAL_SUBJECTS) {
    subjects[s.code] = {
      ...s,
      topicsCompleted: [],
      questionsAttempted: 0,
      questionsCorrect: 0,
    }
  }

  return {
    version: 1,
    subjects,
    exams: [],
    activityDates: [],
    xpHistory: [],
  }
}

export function loadLearningMetrics(): LearningMetricsData {
  if (typeof window === 'undefined') return createDefaultMetrics()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LearningMetricsData
      // Ensure all canonical subjects exist
      for (const s of CANONICAL_SUBJECTS) {
        if (!parsed.subjects[s.code]) {
          parsed.subjects[s.code] = {
            ...s,
            topicsCompleted: [],
            questionsAttempted: 0,
            questionsCorrect: 0,
          }
        }
      }
      return parsed
    }

    // Migration from old practice attempts if available
    const oldAttemptsRaw = window.localStorage.getItem('vivabank-practice-attempts')
    const metrics = createDefaultMetrics()
    if (oldAttemptsRaw) {
      try {
        const oldAttempts = JSON.parse(oldAttemptsRaw) as Array<{
          id: string
          date: string
          score: number
          total: number
          weakTopics?: string[]
          mode?: string
          difficulty?: string
        }>

        if (Array.isArray(oldAttempts) && oldAttempts.length > 0) {
          const cn = metrics.subjects['CS301']
          const datesSet = new Set<string>()

          for (const att of oldAttempts) {
            const acc = att.total > 0 ? Math.round((att.score / att.total) * 100) : 0
            metrics.exams.push({
              id: att.id,
              subject: 'Computer Networks',
              type: 'practice',
              date: att.date,
              score: att.score,
              total: att.total,
              accuracy: acc,
              mode: att.mode,
              difficulty: att.difficulty,
              weakTopics: att.weakTopics,
            })

            cn.questionsAttempted += att.total
            cn.questionsCorrect += att.score

            const dt = att.date ? getTodayDateString(new Date(att.date)) : getTodayDateString()
            datesSet.add(dt)

            // Award verified XP for existing quiz completion
            const earnedXp = att.score * 15 + 50
            metrics.xpHistory.push({
              id: `migrated-${att.id}`,
              date: att.date,
              action: `Completed Practice Quiz (${att.score}/${att.total})`,
              xp: earnedXp,
              isAllStar: acc >= 85,
            })
          }

          metrics.activityDates = Array.from(datesSet).sort()
        }
      } catch (e) {
        console.warn('Could not migrate old attempts', e)
      }
    }

    // Check revised questions
    const revisedRaw = window.localStorage.getItem('vivabank-revised')
    if (revisedRaw) {
      try {
        const revised = JSON.parse(revisedRaw) as string[]
        if (Array.isArray(revised) && revised.length > 0) {
          const cn = metrics.subjects['CS301']
          // Example units mapped to topics
          if (revised.some((id) => id.includes('tcp') || id.includes('handshake'))) {
            if (!cn.topicsCompleted.includes('Transport Layer: UDP/TCP')) {
              cn.topicsCompleted.push('Transport Layer: UDP/TCP')
            }
          }
          if (revised.some((id) => id.includes('subnetting'))) {
            if (!cn.topicsCompleted.includes('Network Layer & Routing')) {
              cn.topicsCompleted.push('Network Layer & Routing')
            }
          }
          if (revised.some((id) => id.includes('arq'))) {
            if (!cn.topicsCompleted.includes('Data Link Layer & LLC')) {
              cn.topicsCompleted.push('Data Link Layer & LLC')
            }
          }
          if (revised.some((id) => id.includes('shannon'))) {
            if (!cn.topicsCompleted.includes('Physical Layer & Transmission')) {
              cn.topicsCompleted.push('Physical Layer & Transmission')
            }
          }
          if (revised.some((id) => id.includes('dns'))) {
            if (!cn.topicsCompleted.includes('Application Layer & Sockets')) {
              cn.topicsCompleted.push('Application Layer & Sockets')
            }
          }
        }
      } catch (e) {
        console.warn('Could not read revised questions', e)
      }
    }

    saveLearningMetrics(metrics)
    return metrics
  } catch (e) {
    console.error('Failed to load learning metrics', e)
    return createDefaultMetrics()
  }
}

export function saveLearningMetrics(metrics: LearningMetricsData): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics))
  } catch (e) {
    console.warn('Failed to save learning metrics', e)
  }
}

/* ────────────────────────────────────────────────────────────────
   Subject Name Normalizer / Code Resolver
──────────────────────────────────────────────────────────────── */
export function resolveSubjectCode(subjectNameOrCode: string): string {
  const query = subjectNameOrCode.trim().toLowerCase()
  for (const s of CANONICAL_SUBJECTS) {
    if (s.code.toLowerCase() === query) return s.code
    if (s.name.toLowerCase() === query) return s.code
    if (s.shortLabel.toLowerCase() === query) return s.code
  }
  if (query.includes('network')) return 'CS301'
  if (query.includes('data struct') || query.includes('algo')) return 'CS201'
  if (query.includes('operat') || query === 'os') return 'CS302'
  if (query.includes('data') || query.includes('dbms') || query.includes('sql')) return 'CS303'
  if (query.includes('machine') || query.includes('ml') || query.includes('ai')) return 'AI401'
  if (query.includes('web')) return 'CS204'
  return 'CS301'
}

/* ────────────────────────────────────────────────────────────────
   1. Prep Progress Calculations
   Strict definition: % of defined syllabus topics completed
──────────────────────────────────────────────────────────────── */
export interface SubjectPrepProgress {
  code: string
  name: string
  shortLabel: string
  color: string
  totalTopics: number
  topicsCompletedCount: number
  completionPct: number // Real: (topicsCompleted / totalTopics) * 100
  questionsAttempted: number
  questionsCorrect: number
  accuracyPct: number
  topicsCompleted: string[]
  allTopics: string[]
}

export function getSubjectProgress(metrics: LearningMetricsData, subjectCode: string): SubjectPrepProgress {
  const code = resolveSubjectCode(subjectCode)
  const sub = metrics.subjects[code] || CANONICAL_SUBJECTS.find((s) => s.code === code)
  const totalTopics = sub?.totalTopics || 7
  const topicsCompleted = sub?.topicsCompleted || []
  const topicsCompletedCount = topicsCompleted.length
  const completionPct = totalTopics > 0 ? Math.round((topicsCompletedCount / totalTopics) * 100) : 0
  const questionsAttempted = sub?.questionsAttempted || 0
  const questionsCorrect = sub?.questionsCorrect || 0
  const accuracyPct = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0

  return {
    code,
    name: sub?.name || 'Computer Networks',
    shortLabel: sub?.shortLabel || 'Comp. Networks',
    color: sub?.color || '#7c3aed',
    totalTopics,
    topicsCompletedCount,
    completionPct,
    questionsAttempted,
    questionsCorrect,
    accuracyPct,
    topicsCompleted,
    allTopics: sub?.topics || [],
  }
}

export function getAllSubjectsProgress(metrics: LearningMetricsData): SubjectPrepProgress[] {
  return CANONICAL_SUBJECTS.map((s) => getSubjectProgress(metrics, s.code))
}

export function getOverallSyllabusProgress(metrics: LearningMetricsData): {
  completedTopics: number
  totalTopics: number
  completionPct: number
  questionsAttempted: number
  questionsCorrect: number
} {
  let completedTopics = 0
  let totalTopics = 0
  let questionsAttempted = 0
  let questionsCorrect = 0

  for (const s of CANONICAL_SUBJECTS) {
    const sub = metrics.subjects[s.code]
    totalTopics += s.totalTopics
    if (sub) {
      completedTopics += sub.topicsCompleted.length
      questionsAttempted += sub.questionsAttempted
      questionsCorrect += sub.questionsCorrect
    }
  }

  const completionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  return {
    completedTopics,
    totalTopics,
    completionPct,
    questionsAttempted,
    questionsCorrect,
  }
}

/* ────────────────────────────────────────────────────────────────
   2. XP, Streak, League Calculations
   Strict: Only verified actions.
   Never increment XP or rank on day change.
   Streaks calculated strictly from activity dates.
──────────────────────────────────────────────────────────────── */
export interface XPStats {
  totalXP: number
  weeklyXP: number
  allStarXP: number
}

/**
 * Weekly XP formula: Sum XP events from the start of the current week through the present
 */
export function getStartOfWeek(d: Date = new Date()): number {
  const date = new Date(d)
  const day = date.getDay() // 0 = Sunday, 1 = Monday, ...
  const diff = (day === 0 ? -6 : 1) - day // Monday start
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function getXPStats(metrics: LearningMetricsData): XPStats {
  const startOfWeek = getStartOfWeek()

  let totalXP = 0
  let weeklyXP = 0
  let allStarXP = 0

  for (const record of metrics.xpHistory) {
    totalXP += record.xp
    const recordTime = new Date(record.date).getTime()
    if (!isNaN(recordTime) && recordTime >= startOfWeek) {
      weeklyXP += record.xp
    }
    if (record.isAllStar) {
      allStarXP += record.xp
    }
  }

  return { totalXP, weeklyXP, allStarXP }
}

export interface StreakStats {
  streak: number
  activeToday: boolean
  lastActiveDate: string | null
}

export function getStreakStats(metrics: LearningMetricsData): StreakStats {
  const dates = Array.from(new Set(metrics.activityDates)).sort()
  if (dates.length === 0) {
    return { streak: 0, activeToday: false, lastActiveDate: null }
  }

  const today = getTodayDateString(new Date())
  const yesterdayDate = new Date(Date.now() - 86400000)
  const yesterday = getTodayDateString(yesterdayDate)

  const activeToday = dates.includes(today)
  const activeYesterday = dates.includes(yesterday)
  const lastActiveDate = dates[dates.length - 1]

  // If user has not had activity today AND not yesterday, streak has broken
  if (!activeToday && !activeYesterday) {
    return { streak: 0, activeToday: false, lastActiveDate }
  }

  // Count backwards day by day from anchor (today if active today, else yesterday)
  let count = 0
  let checkDate = activeToday ? new Date() : yesterdayDate

  while (true) {
    const ds = getTodayDateString(checkDate)
    if (dates.includes(ds)) {
      count++
      // Move 1 day back
      checkDate = new Date(checkDate.getTime() - 86400000)
    } else {
      break
    }
  }

  return {
    streak: count,
    activeToday,
    lastActiveDate,
  }
}

export interface LeagueStats {
  leagueName: string
  tierBadge: string
  rankNumber: number
  rankBadge: string
  currentTierMin: number
  currentTierMax: number
  xpUntilNext: number
  tierFillPct: number
  totalXP: number
}

export function getLeagueStats(totalXP: number, rankNumber: number | null = null): LeagueStats {
  // Leagues:
  // Bronze: 0 - 499
  // Silver: 500 - 1,499
  // Gold: 1,500 - 3,499
  // Platinum: 3,500 - 6,999
  // Diamond: 7,000+
  let leagueName = 'Bronze League'
  let tierBadge = '🥉 Bronze League'
  let currentTierMin = 0
  let currentTierMax = 500

  if (totalXP >= 7000) {
    leagueName = 'Diamond League'
    tierBadge = '💎 Diamond League'
    currentTierMin = 7000
    currentTierMax = 10000
  } else if (totalXP >= 3500) {
    leagueName = 'Platinum League'
    tierBadge = '⚡ Platinum League'
    currentTierMin = 3500
    currentTierMax = 7000
  } else if (totalXP >= 1500) {
    leagueName = 'Gold League'
    tierBadge = '🏆 Gold League'
    currentTierMin = 1500
    currentTierMax = 3500
  } else if (totalXP >= 500) {
    leagueName = 'Silver League'
    tierBadge = '🥈 Silver League'
    currentTierMin = 500
    currentTierMax = 1500
  }

  const span = Math.max(1, currentTierMax - currentTierMin)
  const earnedInTier = Math.max(0, totalXP - currentTierMin)
  const tierFillPct = Math.min(100, Math.round((earnedInTier / span) * 100))
  const xpUntilNext = Math.max(0, currentTierMax - totalXP)

  const rankBadge = rankNumber === null ? 'Unavailable' : `#${rankNumber}`

  return {
    leagueName,
    tierBadge,
    rankNumber: rankNumber ?? 0,
    rankBadge,
    currentTierMin,
    currentTierMax,
    xpUntilNext,
    tierFillPct,
    totalXP,
  }
}

/* ────────────────────────────────────────────────────────────────
   3. Exam Hub Calculations
   Strict: Real exam attempts, accuracy, and best scores.
   If 0 attempts -> 'Not attempted' instead of manufacturing a score.
──────────────────────────────────────────────────────────────── */
export interface SubjectExamStats {
  code: string
  subject: string
  shortLabel: string
  color: string
  attempted: boolean
  attemptsCount: number
  bestScorePct: number | null
  avgAccuracyPct: number | null
  latestScorePct: number | null
  statusLabel: string
}

export function getSubjectExamStats(metrics: LearningMetricsData, subjectCode: string): SubjectExamStats {
  const code = resolveSubjectCode(subjectCode)
  const sub = CANONICAL_SUBJECTS.find((s) => s.code === code)
  const subjectName = sub?.name || 'Computer Networks'
  const shortLabel = sub?.shortLabel || 'Comp. Networks'
  const color = sub?.color || '#7c3aed'

  const matchedExams = metrics.exams.filter((e) => {
    return resolveSubjectCode(e.subject) === code
  })

  if (matchedExams.length === 0) {
    return {
      code,
      subject: subjectName,
      shortLabel,
      color,
      attempted: false,
      attemptsCount: 0,
      bestScorePct: null,
      avgAccuracyPct: null,
      latestScorePct: null,
      statusLabel: 'Not attempted',
    }
  }

  const scores = matchedExams.map((e) => e.accuracy)
  const bestScorePct = Math.max(...scores)
  const avgAccuracyPct = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
  const latestScorePct = matchedExams[matchedExams.length - 1].accuracy

  return {
    code,
    subject: subjectName,
    shortLabel,
    color,
    attempted: true,
    attemptsCount: matchedExams.length,
    bestScorePct,
    avgAccuracyPct,
    latestScorePct,
    statusLabel: `${bestScorePct}%`,
  }
}

export function getAllExamStats(metrics: LearningMetricsData): SubjectExamStats[] {
  return CANONICAL_SUBJECTS.map((s) => getSubjectExamStats(metrics, s.code))
}

export function getTotalExamsTaken(metrics: LearningMetricsData): number {
  return metrics.exams.length
}

/* ────────────────────────────────────────────────────────────────
   Verified Action Recorders (Mutators)
──────────────────────────────────────────────────────────────── */
export function recordVerifiedExam(
  current: LearningMetricsData,
  params: {
    subject: string
    type: 'viva' | 'practice'
    score: number // correct count
    total: number
    accuracy: number
    topicsCovered?: string[]
    mode?: string
    difficulty?: string
    persistToSupabase?: boolean
  }
): LearningMetricsData {
  const code = resolveSubjectCode(params.subject)
  const sub = current.subjects[code] || {
    ...CANONICAL_SUBJECTS.find((s) => s.code === code)!,
    topicsCompleted: [],
    questionsAttempted: 0,
    questionsCorrect: 0,
  }

  const today = getTodayDateString(new Date())
  const nowIso = new Date().toISOString()

  // 1. Add Exam Record
  const newExam: ExamRecord = {
    id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    subject: sub.name,
    type: params.type,
    date: nowIso,
    score: params.score,
    total: params.total,
    accuracy: Math.round(params.accuracy),
    mode: params.mode,
    difficulty: params.difficulty,
    weakTopics: [],
  }

  const nextExams = [newExam, ...current.exams]

  // 2. Update Subject Questions Attempted & Correct
  const updatedQuestionsAttempted = sub.questionsAttempted + params.total
  const updatedQuestionsCorrect = sub.questionsCorrect + params.score

  // 3. Mark covered topics as completed
  const completedSet = new Set(sub.topicsCompleted)
  if (params.topicsCovered && params.topicsCovered.length > 0) {
    for (const t of params.topicsCovered) {
      completedSet.add(t)
    }
  }

  const updatedSubject: SubjectMetric = {
    ...sub,
    questionsAttempted: updatedQuestionsAttempted,
    questionsCorrect: updatedQuestionsCorrect,
    topicsCompleted: Array.from(completedSet),
  }

  // 4. Update Activity Dates strictly for streak
  const datesSet = new Set(current.activityDates)
  datesSet.add(today)

  // Transparent rewards: completing an exam is worth 10 XP and each correct
  // answer is worth 2 XP. The server applies the same event key once.
  const isAllStar = params.accuracy >= 90
  const xpEarned = 10 + params.score * 2

  const newXp: XPRecord = {
    id: `xp-${Date.now()}`,
    date: nowIso,
    action: `Completed ${params.type === 'viva' ? 'Viva' : 'Practice'} Exam: ${sub.name} (${params.score}/${params.total})`,
    xp: xpEarned,
    eventKey: `exam:${newExam.id}`,
    isAllStar,
  }

  const nextMetrics: LearningMetricsData = {
    ...current,
    subjects: {
      ...current.subjects,
      [code]: updatedSubject,
    },
    exams: nextExams,
    activityDates: Array.from(datesSet).sort(),
    xpHistory: [newXp, ...current.xpHistory],
  }

  saveLearningMetrics(nextMetrics)

  // Asynchronously persist to Supabase PostgreSQL database
  if (params.persistToSupabase !== false) {
    dbRecordExamAttempt({
      subject: sub.name,
      examType: params.type,
      score: params.score,
      total: params.total,
      accuracy: Math.round(params.accuracy),
      topicsCovered: params.topicsCovered,
      mode: params.mode,
      difficulty: params.difficulty,
    })
    dbRecordDailyActivity(today)
  }
  if (params.topicsCovered) {
    for (const t of params.topicsCovered) {
      dbRecordTopicProgress({ subjectCode: code, topicName: t, isCompleted: true })
    }
  }

  return nextMetrics
}

export function recordVerifiedQuestionAnswer(
  current: LearningMetricsData,
  params: {
    subject: string
    questionId?: string
    topic?: string
    isCorrect: boolean
    accuracy?: number
  }
): LearningMetricsData {
  const code = resolveSubjectCode(params.subject)
  const sub = current.subjects[code] || {
    ...CANONICAL_SUBJECTS.find((s) => s.code === code)!,
    topicsCompleted: [],
    questionsAttempted: 0,
    questionsCorrect: 0,
  }

  const today = getTodayDateString(new Date())
  const nowIso = new Date().toISOString()

  // Activity Date logged
  const datesSet = new Set(current.activityDates)
  datesSet.add(today)

  const updatedQuestionsAttempted = sub.questionsAttempted + 1
  const updatedQuestionsCorrect = sub.questionsCorrect + (params.isCorrect ? 1 : 0)

  // XP: Awarded only for verified actions
  let xpRecords = [...current.xpHistory]
  const isAllStar = (params.accuracy ?? 100) >= 90
  const questionId = params.questionId || params.topic || `q-${Date.now()}`
  const eventKey = `question-correct:${questionId}`

  if (params.isCorrect && !xpRecords.some((record) => record.eventKey === eventKey)) {
    xpRecords = [
      {
        id: `xp-q-${Date.now()}`,
        date: nowIso,
        action: `Correct answer in ${sub.name}`,
        xp: 2,
        eventKey,
        isAllStar,
      },
      ...xpRecords,
    ]
  }

  const nextMetrics: LearningMetricsData = {
    ...current,
    subjects: {
      ...current.subjects,
      [code]: {
        ...sub,
        questionsAttempted: updatedQuestionsAttempted,
        questionsCorrect: updatedQuestionsCorrect,
      },
    },
    activityDates: Array.from(datesSet).sort(),
    xpHistory: xpRecords,
  }

  saveLearningMetrics(nextMetrics)

  // Asynchronously persist to Supabase PostgreSQL database
  dbRecordQuestionAttempt({
    questionId,
    subjectCode: code,
    topicName: params.topic,
    isCorrect: params.isCorrect,
    accuracyScore: params.accuracy ?? (params.isCorrect ? 100 : 0),
  })
  dbRecordDailyActivity(today)

  return nextMetrics
}

export function toggleTopicStudyCompletion(
  current: LearningMetricsData,
  subjectCode: string,
  topicName: string
): LearningMetricsData {
  const code = resolveSubjectCode(subjectCode)
  const sub = current.subjects[code]
  if (!sub) return current

  const completedSet = new Set(sub.topicsCompleted)
  const isAdding = !completedSet.has(topicName)

  if (isAdding) {
    completedSet.add(topicName)
  } else {
    completedSet.delete(topicName)
  }

  const today = getTodayDateString(new Date())
  const nowIso = new Date().toISOString()

  const datesSet = new Set(current.activityDates)
  let xpRecords = [...current.xpHistory]

  if (isAdding) {
    datesSet.add(today)
    xpRecords = [
      {
        id: `xp-topic-${Date.now()}`,
        date: nowIso,
        action: `Completed topic: ${topicName} (${sub.name})`,
        xp: 5,
        eventKey: `topic:${code}:${topicName}`,
      },
      ...xpRecords,
    ]
  }

  const nextMetrics: LearningMetricsData = {
    ...current,
    subjects: {
      ...current.subjects,
      [code]: {
        ...sub,
        topicsCompleted: Array.from(completedSet),
      },
    },
    activityDates: Array.from(datesSet).sort(),
    xpHistory: xpRecords,
  }

  saveLearningMetrics(nextMetrics)

  // Asynchronously persist to Supabase PostgreSQL database
  dbRecordTopicProgress({
    subjectCode: code,
    topicName,
    isCompleted: isAdding,
  })
  if (isAdding) {
    dbRecordDailyActivity(today)
  }

  return nextMetrics
}

export function resetAllLearningMetrics(): LearningMetricsData {
  const blank = createDefaultMetrics()
  saveLearningMetrics(blank)
  return blank
}
