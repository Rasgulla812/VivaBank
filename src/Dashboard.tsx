import { useState, useEffect, useRef } from 'react'
import './Dashboard.css'

/* ────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────── */
interface DashboardProps {
  onStartViva: (subject: string) => void
  onOpenQuestionBank: () => void
  candidateName: string
}

/* ────────────────────────────────────────────────────────────────
   Data
──────────────────────────────────────────────────────────────── */
const dashSubjects = [
  {
    name: 'Computer Networks',
    code: 'CS301',
    topics: 7,
    subtopics: 54,
    progress: 62,
    progressColor: '#7c3aed',
    bg: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop',
    board: 'MUJ',
    level: 'B.Tech',
  },
  {
    name: 'Data Structures',
    code: 'CS201',
    topics: 9,
    subtopics: 81,
    progress: 78,
    progressColor: '#3b82f6',
    bg: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&auto=format&fit=crop',
    board: 'MUJ',
    level: 'B.Tech',
  },
  {
    name: 'Operating Systems',
    code: 'CS302',
    topics: 8,
    subtopics: 73,
    progress: 45,
    progressColor: '#22c55e',
    bg: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop',
    board: 'MUJ',
    level: 'B.Tech',
  },
  {
    name: 'Database Systems',
    code: 'CS303',
    topics: 6,
    subtopics: 49,
    progress: 55,
    progressColor: '#ec4899',
    bg: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop',
    board: 'MUJ',
    level: 'B.Tech',
  },
  {
    name: 'Machine Learning',
    code: 'AI401',
    topics: 11,
    subtopics: 97,
    progress: 33,
    progressColor: '#f59e0b',
    bg: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&auto=format&fit=crop',
    board: 'MUJ',
    level: 'B.Tech',
  },
  {
    name: 'Web Engineering',
    code: 'CS204',
    topics: 5,
    subtopics: 38,
    progress: 88,
    progressColor: '#06b6d4',
    bg: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&auto=format&fit=crop',
    board: 'MUJ',
    level: 'B.Tech',
  },
]

const recentQuestions = [
  {
    id: 1,
    question: 'Explain TCP three-way handshake and its purpose',
    subject: 'Computer Networks',
    topic: 'TCP/IP',
    timeAgo: '2h ago',
    score: 78,
    tone: 'good' as const,
    iconBg: '#7c3aed',
    icon: '⚙',
  },
  {
    id: 2,
    question: 'Describe Banker\'s Algorithm for deadlock avoidance',
    subject: 'Operating Systems',
    topic: 'Deadlocks',
    timeAgo: 'Yesterday',
    score: 52,
    tone: 'needs-work' as const,
    iconBg: '#22c55e',
    icon: '⊞',
  },
  {
    id: 3,
    question: 'Compare B+ tree vs Hash indexing in databases',
    subject: 'Database Systems',
    topic: 'Indexing',
    timeAgo: '3 days ago',
    score: 91,
    tone: 'good' as const,
    iconBg: '#ec4899',
    icon: '▤',
  },
  {
    id: 4,
    question: 'Explain gradient descent and its variants',
    subject: 'Machine Learning',
    topic: 'Optimization',
    timeAgo: '4 days ago',
    score: 44,
    tone: 'needs-work' as const,
    iconBg: '#f59e0b',
    icon: '⚡',
  },
]

const practicals = [
  {
    id: 1,
    day: '20',
    month: 'Oct',
    name: 'Socket Programming Lab',
    subject: 'Computer Networks — CS301',
    time: '10:00 AM',
    status: 'urgent' as const,
    accentColor: '#fbbf24',
  },
  {
    id: 2,
    day: '23',
    month: 'Oct',
    name: 'AVL Tree Implementation',
    subject: 'Data Structures — CS201',
    time: '02:00 PM',
    status: 'upcoming' as const,
    accentColor: '#7c3aed',
  },
  {
    id: 3,
    day: '27',
    month: 'Oct',
    name: 'Process Scheduling Simulation',
    subject: 'Operating Systems — CS302',
    time: '11:00 AM',
    status: 'upcoming' as const,
    accentColor: '#7c3aed',
  },
  {
    id: 4,
    day: '30',
    month: 'Oct',
    name: 'SQL Query Optimization',
    subject: 'Database Systems — CS303',
    time: '03:30 PM',
    status: 'soon' as const,
    accentColor: '#06b6d4',
  },
]

/* ────────────────────────────────────────────────────────────────
   Calendar helpers
──────────────────────────────────────────────────────────────── */
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const MONTH_SHORT: Record<string, number> = {
  Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,
  Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11,
}

function buildCalendarGrid(monthShort: string, year: number) {
  const monthIdx = MONTH_SHORT[monthShort] ?? 9
  const firstDay = new Date(year, monthIdx, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return { cells, monthIdx, monthName: MONTH_NAMES[monthIdx] }
}

function downloadICS(p: { name: string; subject: string; day: string; month: string; time: string }, year: number) {
  const monthIdx = MONTH_SHORT[p.month] ?? 9
  const mm = String(monthIdx + 1).padStart(2, '0')
  const dd = p.day.padStart(2, '0')
  const [timePart, meridiem] = p.time.split(' ')
  const [hhValue, min] = timePart.split(':').map(Number)
  let hh = hhValue
  if (meridiem === 'PM' && hh !== 12) hh += 12
  if (meridiem === 'AM' && hh === 12) hh = 0
  const startH = String(hh).padStart(2, '0')
  const endH   = String(hh + 2).padStart(2, '0')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VivaBank//EN',
    'BEGIN:VEVENT',
    `DTSTART:${year}${mm}${dd}T${startH}${String(min).padStart(2,'0')}00`,
    `DTEND:${year}${mm}${dd}T${endH}${String(min).padStart(2,'0')}00`,
    `SUMMARY:${p.name}`,
    `DESCRIPTION:${p.subject} practical`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${p.name}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${p.name.replace(/\s+/g, '_')}.ics`
  a.click()
  URL.revokeObjectURL(a.href)
}

const prepProgress = [
  { label: 'Comp. Networks', pct: 62, color: '#7c3aed' },
  { label: 'Data Structures', pct: 78, color: '#3b82f6' },
  { label: 'OS', pct: 45, color: '#22c55e' },
  { label: 'Databases', pct: 55, color: '#ec4899' },
  { label: 'ML & AI', pct: 33, color: '#f59e0b' },
  { label: 'Web Engg.', pct: 88, color: '#06b6d4' },
]

const examScores = [
  { subject: 'Comp. Networks', pct: 72, color: '#7c3aed' },
  { subject: 'Data Structures', pct: 85, color: '#3b82f6' },
  { subject: 'Op. Systems', pct: 48, color: '#22c55e' },
  { subject: 'Databases', pct: 91, color: '#ec4899' },
  { subject: 'ML & AI', pct: 37, color: '#f59e0b' },
  { subject: 'Web Engg.', pct: 95, color: '#06b6d4' },
]

/* ────────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────── */
export default function Dashboard({ onStartViva, onOpenQuestionBank, candidateName }: DashboardProps) {
  const initials = candidateName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const YEAR = 2026
  const [calendarOpenId, setCalendarOpenId] = useState<number | null>(null)
  const [savedIds, setSavedIds]             = useState<Set<number>>(new Set())
  const [browseOpen, setBrowseOpen]         = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCalendarOpenId(null)
      }
    }
    if (calendarOpenId !== null) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [calendarOpenId])

  function handleSaveToCalendar(p: typeof practicals[0]) {
    downloadICS(p, YEAR)
    setSavedIds((prev) => new Set(prev).add(p.id))
    setCalendarOpenId(null)
  }


  return (
    <div className="dashboard-shell">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <div className="dashboard-title-block">
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Track your preparation, upcoming practicals, and performance</p>
        </div>
        <div className="dashboard-meta">
          <div className="dashboard-meta-avatar">{initials}</div>
          <div>
            <div className="dashboard-meta-name">{candidateName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>B.Tech · CS · Sem 5</div>
          </div>
        </div>
      </div>

      {/* ── Continue Studying Banners ── */}
      <div className="continue-banners">
        <div className="continue-card primary" onClick={() => onStartViva('Computer Networks')} role="button" tabIndex={0}>
          <div className="continue-card-left">
            <div className="continue-label">
              <span className="continue-label-icon">✦</span>
              Continue where you left off
            </div>
            <div className="continue-subject">Computer Networks</div>
            <div className="continue-topic">TCP/IP Protocols &amp; ARP</div>
          </div>
          <div className="continue-card-right">
            <div className="continue-last-studied">
              Last Studied
              <strong>Yesterday</strong>
            </div>
            <button className="continue-btn" type="button">
              Start »
            </button>
          </div>
        </div>

        <div className="continue-card secondary" onClick={() => onStartViva('Operating Systems')} role="button" tabIndex={0}>
          <div className="continue-card-left">
            <div className="continue-label">
              <span className="continue-label-icon">◈</span>
              Your lesson of the day
            </div>
            <div className="continue-subject">Operating Systems</div>
            <div className="continue-topic">Deadlock Detection</div>
          </div>
          <div className="continue-card-right">
            <div className="continue-last-studied">
              Last Studied
              <strong>3 days ago</strong>
            </div>
            <button className="continue-btn" type="button">
              Start »
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="dashboard-main">
        {/* ── Left Column ── */}
        <div className="dashboard-left">

          {/* Subjects */}
          <div>
            <div className="db-section-title">
              Your Subjects
              <span className="db-section-link" onClick={() => {}}>Edit subjects +</span>
            </div>
            <div className="db-subjects-grid">
              {dashSubjects.map((sub) => (
                <div
                  key={sub.code}
                  className="db-subject-card"
                  onClick={() => onStartViva(sub.name)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className="db-subject-card-image"
                    style={{ backgroundImage: `url(${sub.bg})` }}
                  />
                  <div className="db-subject-card-overlay" />

                  <div className="db-subject-card-meta">
                    <div className="db-subject-stats">
                      <span className="db-subject-stat">{sub.topics} Topics</span>
                      <span className="db-subject-stat">{sub.subtopics} Subtopics</span>
                    </div>
                    <div className="db-subject-badge">
                      <span>{sub.board}</span>
                      <span>{sub.level}</span>
                    </div>
                  </div>

                  <div className="db-subject-card-content">
                    <div className="db-subject-progress-bar">
                      <div
                        className="db-subject-progress-fill"
                        style={{ width: `${sub.progress}%`, background: sub.progressColor }}
                      />
                    </div>
                    <div className="db-subject-name">{sub.name}</div>
                    <div className="db-subject-action-row">
                      <span className="db-subject-code">{sub.code}</span>
                      <span className="db-subject-chevron">›</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Practicals — shown only after at least one is saved */}
          <div>
            <div className="db-section-title">
              Upcoming Practicals
              {savedIds.size > 0 && (
                <span className="db-section-link" onClick={() => setBrowseOpen((v) => !v)}>
                  {browseOpen ? 'Close ✕' : '+ Add more'}
                </span>
              )}
            </div>

            {/* Saved practicals list */}
            {savedIds.size > 0 ? (
              <div className="db-practicals-list">
                {practicals.filter((p) => savedIds.has(p.id)).map((p) => {
                  const { cells, monthName } = buildCalendarGrid(p.month, YEAR)
                  const isOpen = calendarOpenId === p.id
                  return (
                    <div
                      key={p.id}
                      className="db-practical-item"
                      style={{ ['--accent-color' as string]: p.accentColor }}
                    >
                      <div className="db-practical-date-block">
                        <div className="db-practical-day">{p.day}</div>
                        <div className="db-practical-month">{p.month}</div>
                      </div>
                      <div className="db-practical-info">
                        <div className="db-practical-name">{p.name}</div>
                        <div className="db-practical-subject">{p.subject}</div>
                      </div>
                      <div className="db-practical-right">
                        <span className="db-practical-time">{p.time}</span>
                        <span className={`db-practical-status ${p.status}`}>
                          {p.status === 'urgent' ? '⚡ This week' : p.status === 'upcoming' ? 'Upcoming' : 'Soon'}
                        </span>
                      </div>
                      <div className="db-cal-trigger-wrap" ref={isOpen ? popoverRef : null}>
                        <button
                          type="button"
                          className="db-cal-btn saved"
                          title="Saved to calendar"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCalendarOpenId(isOpen ? null : p.id)
                          }}
                          aria-label="Saved to calendar"
                        >
                          ✓
                        </button>
                        {isOpen && (
                          <div className="db-cal-popover" onClick={(e) => e.stopPropagation()}>
                            <div className="db-cal-popover-header">
                              <span className="db-cal-month-label">{monthName} {YEAR}</span>
                              <button className="db-cal-popover-close" type="button" onClick={() => setCalendarOpenId(null)}>×</button>
                            </div>
                            <div className="db-cal-grid">
                              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                                <div key={d} className="db-cal-dow">{d}</div>
                              ))}
                              {cells.map((cell, idx) => (
                                <div key={idx} className={`db-cal-cell${cell === Number(p.day) ? ' highlight' : ''}${cell === null ? ' empty' : ''}`}>
                                  {cell ?? ''}
                                </div>
                              ))}
                            </div>
                            <div className="db-cal-event-info">
                              <span className="db-cal-event-dot" style={{ background: p.accentColor }} />
                              <span className="db-cal-event-label">{p.name}</span>
                              <span className="db-cal-event-time">{p.time}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Empty state — nothing saved yet */
              <div className="db-practicals-empty">
                <div className="db-practicals-empty-icon">🗓</div>
                <div className="db-practicals-empty-title">No practicals added yet</div>
                <div className="db-practicals-empty-sub">Browse your schedule and save dates to see them here</div>
                <button
                  type="button"
                  className="db-practicals-browse-btn"
                  onClick={() => setBrowseOpen((v) => !v)}
                >
                  {browseOpen ? 'Close' : '+ Browse & Add Practicals'}
                </button>
              </div>
            )}

            {/* Browse panel — always collapsible */}
            {browseOpen && (
              <div className="db-browse-panel">
                <div className="db-browse-panel-title">All Practicals — tap 📅 to save a date</div>
                <div className="db-practicals-list">
                  {practicals.map((p) => {
                    const { cells, monthName } = buildCalendarGrid(p.month, YEAR)
                    const isOpen  = calendarOpenId === p.id
                    const isSaved = savedIds.has(p.id)
                    return (
                      <div
                        key={p.id}
                        className={`db-practical-item${isSaved ? ' is-saved' : ''}`}
                        style={{ ['--accent-color' as string]: p.accentColor }}
                      >
                        <div className="db-practical-date-block">
                          <div className="db-practical-day">{p.day}</div>
                          <div className="db-practical-month">{p.month}</div>
                        </div>
                        <div className="db-practical-info">
                          <div className="db-practical-name">{p.name}</div>
                          <div className="db-practical-subject">{p.subject}</div>
                        </div>
                        <div className="db-practical-right">
                          <span className="db-practical-time">{p.time}</span>
                          <span className={`db-practical-status ${p.status}`}>
                            {p.status === 'urgent' ? '⚡ This week' : p.status === 'upcoming' ? 'Upcoming' : 'Soon'}
                          </span>
                        </div>
                        <div className="db-cal-trigger-wrap" ref={isOpen ? popoverRef : null}>
                          <button
                            type="button"
                            className={`db-cal-btn${isSaved ? ' saved' : ''}`}
                            title={isSaved ? 'Already saved' : 'Save to calendar'}
                            onClick={(e) => {
                              e.stopPropagation()
                              setCalendarOpenId(isOpen ? null : p.id)
                            }}
                            aria-label="Save to calendar"
                          >
                            {isSaved ? '✓' : '📅'}
                          </button>
                          {isOpen && (
                            <div className="db-cal-popover" onClick={(e) => e.stopPropagation()}>
                              <div className="db-cal-popover-header">
                                <span className="db-cal-month-label">{monthName} {YEAR}</span>
                                <button className="db-cal-popover-close" type="button" onClick={() => setCalendarOpenId(null)}>×</button>
                              </div>
                              <div className="db-cal-grid">
                                {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                                  <div key={d} className="db-cal-dow">{d}</div>
                                ))}
                                {cells.map((cell, idx) => (
                                  <div key={idx} className={`db-cal-cell${cell === Number(p.day) ? ' highlight' : ''}${cell === null ? ' empty' : ''}`}>
                                    {cell ?? ''}
                                  </div>
                                ))}
                              </div>
                              <div className="db-cal-event-info">
                                <span className="db-cal-event-dot" style={{ background: p.accentColor }} />
                                <span className="db-cal-event-label">{p.name}</span>
                                <span className="db-cal-event-time">{p.time}</span>
                              </div>
                              {!isSaved && (
                                <button
                                  type="button"
                                  className="db-cal-save-btn"
                                  onClick={() => handleSaveToCalendar(p)}
                                >
                                  ⬇ Save to Calendar (.ics)
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recently Viewed Questions */}
          <div>
            <div className="db-section-title">
              Recently Viewed Questions
              <span className="db-section-link" onClick={onOpenQuestionBank}>Open Bank →</span>
            </div>
            <div className="db-recent-list">
              {recentQuestions.map((q) => (
                <div key={q.id} className="db-recent-item" role="button" tabIndex={0}>
                  <div className="db-recent-icon" style={{ background: q.iconBg }}>
                    {q.icon}
                  </div>
                  <div className="db-recent-info">
                    <div className="db-recent-question">{q.question}</div>
                    <div className="db-recent-meta">
                      <span>{q.subject}</span>
                      <span className="db-recent-meta-dot" />
                      <span>{q.topic}</span>
                      <span className="db-recent-meta-dot" />
                      <span>{q.timeAgo}</span>
                    </div>
                  </div>
                  <div className={`db-recent-score ${q.tone}`}>
                    {q.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="db-section-title">Quick Actions</div>
            <div className="db-quick-actions">
              <button className="db-quick-btn" type="button" onClick={() => onStartViva('Computer Networks')}>
                <div className="db-quick-btn-icon" style={{ background: 'rgba(124,58,237,0.15)' }}>▶</div>
                <span className="db-quick-btn-label">Start Viva</span>
              </button>
              <button className="db-quick-btn" type="button" onClick={onOpenQuestionBank}>
                <div className="db-quick-btn-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>▣</div>
                <span className="db-quick-btn-label">Question Bank</span>
              </button>
              <button className="db-quick-btn" type="button">
                <div className="db-quick-btn-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>📊</div>
                <span className="db-quick-btn-label">My Progress</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="dashboard-right">

          {/* Preparation Progress */}
          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title">
                📈 Prep Progress
              </div>
              <button className="db-panel-btn" type="button" onClick={() => onStartViva('Computer Networks')}>
                Study now »
              </button>
            </div>
            <div className="db-progress-bars">
              {prepProgress.map((row) => (
                <div key={row.label} className="db-progress-row">
                  <span className="db-progress-label">{row.label}</span>
                  <div className="db-progress-track">
                    <div
                      className="db-progress-fill"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                  <span className="db-progress-pct">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* XP / Leaderboard */}
          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title">
                <div className="db-panel-count">🔥 1 923 XP</div>
              </div>
              <div className="db-league-badge">🏆 Gold League</div>
            </div>

            <div className="db-stats-row">
              <div className="db-stat-block">
                <span className="db-stat-label">Weekly XP</span>
                <span className="db-stat-value">125</span>
                <span className="db-stat-change up">↑ +72</span>
              </div>
              <div className="db-stat-block">
                <span className="db-stat-label">All Star XP</span>
                <span className="db-stat-value">54</span>
                <span className="db-stat-change up">↑ +32</span>
              </div>
              <div className="db-stat-block">
                <span className="db-stat-label">Streak</span>
                <span className="db-stat-value">232</span>
                <span className="db-stat-change down">↓ +2</span>
              </div>
            </div>

            <div className="db-leaderboard-divider" />

            <div className="db-xp-row">
              <span className="db-xp-total">29 519 xp</span>
              <span className="db-xp-next">2 895 xp until next rank</span>
            </div>
            <div className="db-xp-track">
              <div className="db-xp-fill" style={{ width: '68%' }} />
            </div>
            <div className="db-rank-row">
              <span>Rank 2</span>
              <span className="db-rank-badge">#79</span>
            </div>
          </div>

          {/* Exam Hub */}
          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title">
                🎯 Exam Hub <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>21</span>
              </div>
              <button className="db-panel-btn" type="button" onClick={() => onStartViva('Computer Networks')}>
                Take an Exam »
              </button>
            </div>

            <div className="db-exam-grid">
              {examScores.map((e) => (
                <div key={e.subject} className="db-exam-row">
                  <span className="db-exam-subject-name">{e.subject}</span>
                  <div className="db-exam-score-row">
                    <span className="db-exam-pct">{e.pct}%</span>
                    <div className="db-exam-bar">
                      <div className="db-exam-fill" style={{ width: `${e.pct}%`, background: e.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="db-exam-total-row">
              <span className="db-exam-total-label">📊 Total Exams Taken</span>
              <span className="db-exam-total-count">47</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
