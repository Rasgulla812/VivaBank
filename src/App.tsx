import { useCallback, useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import './App.css'

/* ── Subject data ── */
const subjects = [
  { name: 'Computer Networks', code: 'CS301', icon: '⚙', color: 'purple', desc: 'Protocol suites, TCP/IP architecture, ARP, Routing algorithms, and Socket programming.', topics: ['ARP & Layer 2', 'TCP/UDP Protocols', 'Routing Protocols (BGP/OSPF)'] },
  { name: 'Data Structures & Algorithms', code: 'CS201', icon: '</>', color: 'blue', desc: 'Trees, Graphs, Dynamic Programming, Complexity Analysis, Sorting, and Searching.', topics: ['Binary Search Trees', 'Graph Algorithms', 'Dynamic Programming'] },
  { name: 'Operating Systems', code: 'CS302', icon: '⊞', color: 'green', desc: 'Process management, Deadlocks, Paging, Virtual Memory, Concurrency, and System Calls.', topics: ['Deadlock Detection & Prevention', 'Virtual Memory & Paging', 'Threads & Synchronization'] },
  { name: 'Database Systems', code: 'CS303', icon: '▤', color: 'pink', desc: 'Relational model, SQL optimization, B+ Tree indexing, Normalization, and ACID transactions.', topics: ['SQL Joins & Optimization', 'B+ Tree Indexing', 'Normalization Forms'] },
  { name: 'Machine Learning & AI', code: 'AI401', icon: '⚡', color: 'orange', desc: 'Supervised/Unsupervised models, Neural Networks, Backpropagation, and Model Evaluation.', topics: ['Gradient Descent', 'Decision Trees', 'Neural Network Architecture'] },
  { name: 'Web Engineering', code: 'CS204', icon: '⊕', color: 'cyan', desc: 'DOM architecture, REST APIs, GraphQL, Security (CORS/CSRF), and Web Performance.', topics: ['REST API Design', 'Authentication & JWT', 'Performance Optimization'] },
]

/* ── Examiner personas ── */
const examiners = [
  { name: 'AI Logic Core', style: 'Strict & Academic', desc: 'Highly formal and mathematically rigorous. Expects exact...', avatar: 'LC' },
  { name: 'Neural Guide AI', style: 'Foundational & Encouraging', desc: 'Focuses on fundamental understanding and core...', avatar: 'NG' },
  { name: 'Edge Case Engine', style: 'Practical Scenarios & Edge Cases', desc: 'Tests real-world practical trade-offs, production failure modes,...', avatar: 'EE' },
]

/* ── Question templates ── */
const questionTemplates = [
  (subject: string) => `"Describe the complete step-by-step resolution process when a browser navigates to a new domain name. Differentiate Recursive vs Iterative ${subject} queries."`,
  (subject: string) => `Compare two important approaches in ${subject}. When would you choose each one and what trade-offs exist?`,
  (subject: string) => `Walk through a practical problem in ${subject} and explain your step-by-step solution approach.`,
  (subject: string) => `What are two common mistakes students make in ${subject}, and how can they be avoided in practice?`,
  (subject: string) => `Describe one fundamental limitation of ${subject} and suggest a modern way to improve or work around it.`,
  (subject: string) => `Explain the core architecture behind ${subject}. How does it handle scalability and fault tolerance?`,
  (subject: string) => `Given a real-world scenario in ${subject}, walk me through how you would debug a critical failure.`,
]

const subjectHints: Record<string, string[]> = {
  'Computer Networks': ['network', 'protocol', 'packet', 'router', 'address', 'DNS', 'TCP'],
  'Data Structures & Algorithms': ['algorithm', 'complexity', 'data structure', 'tree', 'graph', 'sort'],
  'Operating Systems': ['process', 'memory', 'kernel', 'thread', 'scheduling', 'deadlock'],
  'Database Systems': ['database', 'query', 'table', 'transaction', 'index', 'SQL', 'normalization'],
  'Machine Learning & AI': ['model', 'training', 'data', 'feature', 'prediction', 'neural'],
  'Web Engineering': ['DOM', 'API', 'REST', 'security', 'performance', 'HTTP'],
}

const questionBankQuestions = (subject: string, topic: string) => [
  `What is ${topic}, and why is it important when studying ${subject}?`,
  `Walk through how ${topic} works in ${subject}. Include the key steps, components, or concepts involved.`,
  `Describe a practical scenario where ${topic} is used in ${subject}. What trade-offs or common mistakes should you consider?`,
]

const careerNotifications = [
  {
    category: 'Government exams',
    message: 'Track UPSC Engineering Services (ESE) notifications and application windows.',
    source: 'UPSC official portal',
    url: 'https://upsc.gov.in/',
  },
  {
    category: 'GATE & PSU',
    message: 'Check the latest GATE announcements and PSU recruitment pathways for engineers.',
    source: 'GATE official website',
    url: 'https://gate2026.iitg.ac.in/',
  },
  {
    category: 'Engineering roles',
    message: 'Find government engineering vacancies and apprenticeship opportunities.',
    source: 'National Career Service',
    url: 'https://www.ncs.gov.in/',
  },
  {
    category: 'Internships',
    message: 'Explore technical internships and industry training opportunities for students.',
    source: 'AICTE Internship Portal',
    url: 'https://internship.aicte-india.org/',
  },
]

function App() {
  const [activeDialog, setActiveDialog] = useState<'viva' | 'key' | 'bank' | null>(null)
  const [selectedSubject, setSelectedSubject] = useState('Computer Networks')
  const [selectedBankSubject, setSelectedBankSubject] = useState('Computer Networks')
  const [selectedBankTopic, setSelectedBankTopic] = useState(subjects[0].topics[0])
  const [bankTopicInput, setBankTopicInput] = useState('')
  const [questionCount, setQuestionCount] = useState(4)
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(60)
  const [examStarted, setExamStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [examComplete, setExamComplete] = useState(false)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<{
    title: string; correction: string; instruction: string; tone: 'good' | 'needs-work';
    accuracy: number; depth: number; clarity: number;
    strengths: string[]; gaps: string[];
    commentary: string; action: string;
  } | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [savedKey, setSavedKey] = useState(false)
  const [candidateName, setCandidateName] = useState('Alex River')
  const [selectedExaminer, setSelectedExaminer] = useState(0)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const [examSource, setExamSource] = useState<'standard' | 'custom'>('standard')
  const [customSyllabus, setCustomSyllabus] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [notificationIndex, setNotificationIndex] = useState(0)
  const [notificationsVisible, setNotificationsVisible] = useState(true)

  const currentPrompt = questionTemplates[(currentQuestion - 1) % questionTemplates.length](selectedSubject)
  const currentSubjectData = subjects.find(s => s.name === selectedSubject)
  const bankSubjectData = subjects.find(s => s.name === selectedBankSubject)
  const bankQuestions = questionBankQuestions(selectedBankSubject, selectedBankTopic)
  const currentNotification = careerNotifications[notificationIndex]

  const closeDialog = () => setActiveDialog(null)

  const openQuestionBank = () => {
    const subject = subjects.find(s => s.name === selectedBankSubject) ?? subjects[0]
    setSelectedBankTopic(subject.topics[0])
    setBankTopicInput('')
    setActiveDialog('bank')
  }

  const selectBankSubject = (subjectName: string) => {
    const subject = subjects.find(s => s.name === subjectName)
    if (!subject) return
    setSelectedBankSubject(subject.name)
    setSelectedBankTopic(subject.topics[0])
    setBankTopicInput('')
  }

  useEffect(() => {
    if (!notificationsVisible) return
    const rotation = window.setInterval(() => {
      setNotificationIndex((index) => (index + 1) % careerNotifications.length)
    }, 8000)
    return () => window.clearInterval(rotation)
  }, [notificationsVisible])

  const generateBankQuestions = () => {
    const topic = bankTopicInput.trim()
    if (!topic) return
    setSelectedBankTopic(topic)
    setBankTopicInput('')
  }

  const startExam = () => {
    setCurrentQuestion(1)
    setTimeRemaining(secondsPerQuestion)
    setExamComplete(false)
    setAnswer('')
    setFeedback(null)
    setShowHint(false)
    setExamStarted(true)
    closeDialog()
  }

  const nextQuestion = useCallback(() => {
    if (currentQuestion >= questionCount) {
      setExamStarted(false)
      setExamComplete(true)
      return
    }
    setCurrentQuestion((q) => q + 1)
    setTimeRemaining(secondsPerQuestion)
    setAnswer('')
    setFeedback(null)
    setShowHint(false)
  }, [currentQuestion, questionCount, secondsPerQuestion])

  const checkAnswer = () => {
    const normalizedAnswer = answer.trim().toLowerCase()
    const hints = subjectHints[selectedSubject] ?? []
    const matchedHints = hints.filter((hint) => normalizedAnswer.includes(hint.toLowerCase()))
    const acc = Math.min(95, 40 + matchedHints.length * 12 + Math.min(normalizedAnswer.length / 10, 25))
    const dep = Math.min(95, 35 + matchedHints.length * 11 + Math.min(normalizedAnswer.length / 12, 30))
    const cla = Math.min(95, 55 + Math.min(normalizedAnswer.length / 8, 30))

    if (normalizedAnswer.length < 25) {
      setFeedback({
        title: 'Your answer needs more detail', correction: 'The response is too brief to demonstrate understanding of the topic.',
        instruction: `Define the key idea, explain how it works, and connect it to a practical example in ${selectedSubject}.`,
        tone: 'needs-work', accuracy: 32, depth: 28, clarity: 45,
        strengths: [], gaps: ['Insufficient detail', 'Missing key concepts'],
        commentary: `"Your response lacks sufficient depth. Let us revisit the fundamentals of ${selectedSubject}."`,
        action: 'deep dive'
      })
    } else if (matchedHints.length === 0) {
      setFeedback({
        title: 'Good attempt, but add subject language',
        correction: `Your answer does not yet mention the core concepts expected in ${selectedSubject}.`,
        instruction: `Use specific terms such as ${hints.slice(0, 3).join(', ')}, then explain how they relate to the question.`,
        tone: 'needs-work', accuracy: Math.round(acc), depth: Math.round(dep), clarity: Math.round(cla),
        strengths: ['Logical structure'], gaps: hints.slice(0, 2),
        commentary: `"Your response lacks precise technical terminology regarding ${selectedSubject}. Let us step back to core principles."`,
        action: 'cross examine'
      })
    } else {
      setFeedback({
        title: 'Solid direction',
        correction: `You used relevant ${selectedSubject} concepts: ${matchedHints.slice(0, 3).join(', ')}.`,
        instruction: 'To improve, justify your approach and include one concrete example or trade-off.',
        tone: 'good', accuracy: Math.round(acc), depth: Math.round(dep), clarity: Math.round(cla),
        strengths: matchedHints.slice(0, 3), gaps: hints.filter(h => !matchedHints.includes(h)).slice(0, 2),
        commentary: `"Good understanding demonstrated. Your grasp of ${matchedHints[0]} shows solid foundational knowledge."`,
        action: 'proceed'
      })
    }
  }

  const passQuestion = () => {
    setFeedback({
      title: 'Question skipped',
      correction: 'No answer was submitted, so this question will not receive a score.',
      instruction: `Review the core concepts of ${selectedSubject} and try to explain the idea in your own words next time.`,
      tone: 'needs-work', accuracy: 0, depth: 0, clarity: 0,
      strengths: [], gaps: ['No attempt made'],
      commentary: '"The candidate chose to skip this question. Moving to the next topic."',
      action: 'skip'
    })
  }

  useEffect(() => {
    if (!examStarted || feedback) return
    const timer = window.setInterval(() => {
      setTimeRemaining((time) => {
        if (time <= 1) {
          nextQuestion()
          return secondsPerQuestion
        }
        return time - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [examStarted, feedback, nextQuestion, secondsPerQuestion])

  const overallScore = feedback ? Math.round((feedback.accuracy + feedback.depth + feedback.clarity) / 3) : 0

  return (
    <main className={`app-shell ${theme === 'light' ? 'theme-light' : ''}`}>
      {/* ── Top Bar ── */}
      <header className="topbar">
        <a className="brand" href="#top">
          <div className="brand-icon" aria-hidden="true">
            <BookOpen size={21} strokeWidth={2.2} />
          </div>
          <div className="brand-text">
            <div className="brand-name">Viva<span>Bank</span></div>
          </div>
        </a>
        <nav className="nav-actions">
          <button className="nav-link" type="button" onClick={openQuestionBank}>▣ Question Bank</button>
          <button
            className="btn-theme-toggle"
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
          <button className="btn-setup-key" type="button" onClick={() => setActiveDialog('key')}>
            ⌕ Setup Gemini Key <span className={`dot ${savedKey ? 'active' : ''}`} />
          </button>
          <button className="btn-start-viva" type="button" onClick={() => setActiveDialog('viva')}>
            ▶ Start Viva
          </button>
        </nav>
      </header>

      {notificationsVisible && (
        <aside className="notification-bar" aria-label="Career and exam notifications">
          <div className="notification-content">
            <span className="notification-badge">● Updates</span>
            <span className="notification-category">{currentNotification.category}</span>
            <span className="notification-message">{currentNotification.message}</span>
            <a
              className="notification-link"
              href={currentNotification.url}
              target="_blank"
              rel="noreferrer"
            >
              {currentNotification.source} ↗
            </a>
          </div>
          <div className="notification-actions">
            <button
              type="button"
              className="notification-arrow"
              onClick={() => setNotificationIndex((index) => (index - 1 + careerNotifications.length) % careerNotifications.length)}
              aria-label="Previous notification"
            >
              ←
            </button>
            <span className="notification-count">{notificationIndex + 1}/{careerNotifications.length}</span>
            <button
              type="button"
              className="notification-arrow"
              onClick={() => setNotificationIndex((index) => (index + 1) % careerNotifications.length)}
              aria-label="Next notification"
            >
              →
            </button>
            <button
              type="button"
              className="notification-close"
              onClick={() => setNotificationsVisible(false)}
              aria-label="Dismiss notifications"
            >
              ×
            </button>
          </div>
        </aside>
      )}

      {/* ── Subject Selection ── */}
      <section className="subject-section" id="subjects">
        <div className="section-header">
          <div>
            <h2>Select Subject to Practice</h2>
            <p>Choose a course syllabus to initiate your viva examination</p>
          </div>
          <a href="#custom" className="custom-upload-link">Custom Syllabus / Code Upload →</a>
        </div>
        <div className="subjects-grid">
          {subjects.map((subject) => (
            <button type="button" key={subject.name} className="subject-card" onClick={() => { setSelectedSubject(subject.name); setActiveDialog('viva') }}>
              <div className="card-top">
                <div className={`card-icon ${subject.color}`}>{subject.icon}</div>
                <span className="card-code">{subject.code}</span>
              </div>
              <div className="card-title">{subject.name}</div>
              <div className="card-desc">{subject.desc}</div>
              <div className="card-topics-label">KEY TOPICS</div>
              <div className="card-topics">
                {subject.topics.map(t => <span key={t} className="topic-pill">{t}</span>)}
              </div>
              <div className="card-start">Start {subject.code} Viva <span className="arrow">→</span></div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Exam Room ── */}
      {examStarted && (
        <div className="dialog-backdrop exam-backdrop">
          <div className="exam-room-layout">
            {/* Progress topbar */}
            <div className="exam-topbar">
              <div className="progress-info">
                <span className="progress-label">Question Progress</span>
                <span className="progress-count">{currentQuestion} / {questionCount}</span>
                <div className="progress-dots">
                  {Array.from({ length: questionCount }).map((_, i) => (
                    <div key={i} className={`progress-dot ${i < currentQuestion - 1 ? 'done' : i === currentQuestion - 1 ? 'current' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="adaptive-level">
                ADAPTIVE LEVEL:
                <span className="level-badge beginner">✦ Beginner</span>
              </div>
              <div className="topbar-right">
                <div className={`timer-display ${timeRemaining <= 10 ? 'urgent' : ''}`}>
                  <span className="timer-icon">⏱</span> {timeRemaining}s
                </div>
                <button className="btn-end-viva" type="button" onClick={() => setExamStarted(false)}>End Viva</button>
              </div>
            </div>

            {/* Examiner sidebar */}
            <aside className="examiner-sidebar">
              <div className="examiner-avatar-large">
                {examiners[selectedExaminer].avatar}
                <div className="online-indicator" />
              </div>
              <div className="examiner-name">{examiners[selectedExaminer].name}</div>
              <div className="examiner-title">AI Examiner Engine</div>
              <div className="examiner-dept">Department of Computer Science</div>
              <div className="listening-indicator">
                <div className="listening-dots">
                  <span /><span /><span /><span /><span />
                </div>
                <span className="listening-text">Listening</span>
              </div>
              <button className="btn-speak-question" type="button">🔊 Speak Question</button>
            </aside>

            {/* Question area */}
            <div className="question-area">
              <div className="question-meta">
                <span className="topic-badge">Topic: {currentSubjectData?.name || selectedSubject}</span>
                <span className="candidate-name">Candidate: {candidateName}</span>
              </div>

              <div className="question-text">{currentPrompt}</div>

              {showHint && (
                <div className="hint-card">
                  <div className="hint-title">💡 Examiner Hint:</div>
                  <div className="hint-text">Focus on key concepts: {(subjectHints[selectedSubject] ?? []).slice(0, 3).join(', ')}.</div>
                </div>
              )}

              {!feedback && (
                <div className="answer-section">
                  <div className="answer-header">
                    <span className="answer-label">👤 YOUR ANSWER (VOICE OR TYPING)</span>
                    <button className="btn-microphone" type="button">🎙 Use Microphone</button>
                  </div>
                  <textarea
                    key={currentQuestion}
                    className="answer-textarea"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your explanation here, or speak via mic..."
                    disabled={Boolean(feedback)}
                  />
                  <div className="answer-actions">
                    <button className="btn-hint" type="button" onClick={() => setShowHint(true)}>💡 Request Hint</button>
                    <button className="btn-pass" type="button" onClick={passQuestion}>⏭ Pass / Skip</button>
                    <button className="btn-submit" type="button" onClick={checkAnswer}>✈ Submit Answer</button>
                  </div>
                </div>
              )}

              {/* ── Evaluation Panel ── */}
              {feedback && (
                <div className="evaluation-panel">
                  <div className="eval-header">
                    <div className="eval-score-circle" style={{ '--score-pct': `${overallScore}%` } as React.CSSProperties}>
                      <span>{overallScore}%</span>
                    </div>
                    <div className="eval-title-group">
                      <h3>Turn Evaluation Breakdown</h3>
                      <div className="eval-subtitle">
                        {feedback.tone === 'good' ? 'Strong response with room for deeper analysis.' : `Cross-examining on missed core concept.`}
                      </div>
                    </div>
                    <div className="adaptive-action">Adaptive Action: {feedback.action}</div>
                  </div>

                  <div className="score-metrics">
                    <div className="metric-card">
                      <div className="metric-label">Accuracy</div>
                      <div className="metric-value accuracy">{feedback.accuracy}%</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Depth</div>
                      <div className="metric-value depth">{feedback.depth}%</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Clarity</div>
                      <div className="metric-value clarity">{feedback.clarity}%</div>
                    </div>
                  </div>

                  <div className="examiner-commentary">
                    <div className="commentary-header">🔊 Examiner Commentary ({examiners[selectedExaminer].name}):</div>
                    <div className="commentary-text">{feedback.commentary}</div>
                  </div>

                  <div className="strengths-gaps">
                    <div className="strength-section">
                      <h4>✅ Key Strengths Recognized</h4>
                      <div className="strength-pills">
                        {feedback.strengths.length > 0 ? feedback.strengths.map(s => <span key={s} className="strength-pill">{s}</span>) : <span className="strength-pill" style={{ opacity: 0.5 }}>None identified</span>}
                      </div>
                    </div>
                    <div className="gap-section">
                      <h4>⚠ Identified Conceptual Gaps</h4>
                      <div className="gap-pills">
                        {feedback.gaps.length > 0 ? feedback.gaps.map(g => <span key={g} className="gap-pill">{g}</span>) : <span className="gap-pill" style={{ opacity: 0.5 }}>None identified</span>}
                      </div>
                    </div>
                  </div>

                  <button className="btn-proceed" type="button" onClick={nextQuestion}>
                    {currentQuestion === questionCount ? 'Finish Viva →' : 'Proceed to Next Question →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Completion Dialog ── */}
      {examComplete && (
        <div className="dialog-backdrop">
          <section className="dialog completion-dialog">
            <div className="dialog-icon">✓</div>
            <h2>Viva Complete!</h2>
            <p>You completed the <strong>{selectedSubject}</strong> practice viva with {questionCount} questions at {secondsPerQuestion} seconds per question.</p>
            <p>Candidate: <strong>{candidateName}</strong> · Examiner: <strong>{examiners[selectedExaminer].name}</strong></p>
            <button className="btn-proceed" type="button" onClick={() => setExamComplete(false)}>Back to Dashboard →</button>
          </section>
        </div>
      )}

      {/* ── Configuration / API Key Dialog ── */}
      {activeDialog && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeDialog()}>
          <section className={`dialog ${activeDialog === 'key' ? 'api-dialog' : activeDialog === 'bank' ? 'question-bank-dialog' : ''}`} role="dialog" aria-modal="true">
            <button className="dialog-close" type="button" onClick={closeDialog}>×</button>
            {activeDialog === 'bank' ? (
              <>
                <div className="dialog-icon">▣</div>
                <h2 className="dialog-title">Question Bank</h2>
                <p className="dialog-subtitle">Choose a subject and topic to practice focused questions.</p>

                <div className="question-bank-subjects" aria-label="Question bank subjects">
                  {subjects.map((subject) => (
                    <button
                      type="button"
                      key={subject.name}
                      className={`question-bank-subject ${selectedBankSubject === subject.name ? 'selected' : ''}`}
                      onClick={() => selectBankSubject(subject.name)}
                    >
                      {subject.code}
                    </button>
                  ))}
                </div>

                <div className="question-bank-topic-label">Topics in {selectedBankSubject}</div>
                <div className="question-bank-topics">
                  {bankSubjectData?.topics.map((topic) => (
                    <button
                      type="button"
                      key={topic}
                      className={`question-bank-topic ${selectedBankTopic === topic ? 'selected' : ''}`}
                      onClick={() => setSelectedBankTopic(topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>

                <div className="question-bank-custom-topic">
                  <label className="field-label" htmlFor="question-bank-topic">Need another topic?</label>
                  <div className="question-bank-topic-input">
                    <input
                      id="question-bank-topic"
                      className="text-input"
                      type="text"
                      value={bankTopicInput}
                      onChange={(e) => setBankTopicInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') generateBankQuestions() }}
                      placeholder="Type a topic, concept, or chapter..."
                    />
                    <button
                      className="question-bank-generate"
                      type="button"
                      onClick={generateBankQuestions}
                      disabled={!bankTopicInput.trim()}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="question-bank-selected-topic">Questions for: <strong>{selectedBankTopic}</strong></div>
                <div className="question-bank-list">
                  {bankQuestions.map((question, index) => (
                    <div className="question-bank-item" key={question}>
                      <span className="question-bank-number">{index + 1}</span>
                      <span>{question}</span>
                    </div>
                  ))}
                </div>

                <button className="btn-begin-exam" type="button" onClick={closeDialog}>
                  Done with Question Bank
                </button>
              </>
            ) : activeDialog === 'viva' ? (
              <>
                <div className="dialog-icon">⚙</div>
                <h2 className="dialog-title">Configure Your Viva Examination</h2>
                <p className="dialog-subtitle">Set exam parameters, select examiner persona & audio preferences</p>

                <div className="field-group">
                  <label className="field-label"><span className="icon">👤</span> Candidate Full Name</label>
                  <input className="text-input" type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Enter your name" />
                </div>

                <div className="field-group">
                  <span className="source-toggle-label">Examination Source</span>
                  <div className="source-toggle">
                    <button className={`source-btn ${examSource === 'standard' ? 'active' : ''}`} type="button" onClick={() => setExamSource('standard')}>Standard Course</button>
                    <button className={`source-btn ${examSource === 'custom' ? 'active' : ''}`} type="button" onClick={() => setExamSource('custom')}>Paste Code / Syllabus</button>
                  </div>
                </div>

                {examSource === 'standard' ? (
                  <div className="subject-grid-small">
                    {subjects.map((s) => (
                      <button type="button" key={s.name} className={`subject-chip ${selectedSubject === s.name ? 'selected' : ''}`} onClick={() => setSelectedSubject(s.name)}>
                        <span className="chip-code">{s.code}</span>
                        <span className="chip-name">{s.name}</span>
                        {selectedSubject === s.name && <span className="check-mark">✓</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="field-group custom-source-field">
                    <label className="field-label" htmlFor="custom-syllabus">Paste your code or syllabus</label>
                    <textarea
                      id="custom-syllabus"
                      className="text-input custom-syllabus-input"
                      value={customSyllabus}
                      onChange={(e) => setCustomSyllabus(e.target.value)}
                      placeholder="Paste topics, notes, or source code here..."
                      rows={5}
                    />
                  </div>
                )}

                <div className="persona-section-label">Select AI Examiner Persona</div>
                <div className="persona-grid">
                  {examiners.map((ex, i) => (
                    <button type="button" key={ex.name} className={`persona-card ${selectedExaminer === i ? 'selected' : ''}`} onClick={() => setSelectedExaminer(i)}>
                      <div className={`persona-avatar ${i === 1 ? 'elena' : i === 2 ? 'alex' : ''}`}>{ex.avatar}</div>
                      <div className="persona-name">{ex.name}</div>
                      <div className="persona-style">{ex.style}</div>
                      <div className="persona-desc">{ex.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="settings-row">
                  <div className="setting-group">
                    <div className="setting-label">Questions per Exam</div>
                    <div className="option-pills">
                      {[3, 4, 5, 7].map((n) => (
                        <button type="button" key={n} className={`option-pill ${questionCount === n ? 'active' : ''}`} onClick={() => setQuestionCount(n)}>{n} Qs</button>
                      ))}
                    </div>
                  </div>
                  <div className="setting-group">
                    <div className="setting-label">Timer Limit <span className="setting-value">{secondsPerQuestion}s / Q</span></div>
                    <div className="option-pills">
                      {[30, 60, 90].map((s) => (
                        <button type="button" key={s} className={`option-pill ${secondsPerQuestion === s ? 'active' : ''}`} onClick={() => setSecondsPerQuestion(s)}>{s}s</button>
                      ))}
                      <button type="button" className={`option-pill ${secondsPerQuestion === 0 ? 'active' : ''}`} onClick={() => setSecondsPerQuestion(0)}>Off</button>
                    </div>
                  </div>
                  <div className="setting-group">
                    <div className="setting-label">Voice Audio <span className="setting-value">{voiceEnabled ? 'AI Speech' : 'Off'}</span></div>
                    <div className="voice-toggle">
                      <span className="voice-icon">🔊</span>
                      <span className="voice-text">Speech {voiceEnabled ? 'On' : 'Off'}</span>
                      <button type="button" className={`toggle-switch ${voiceEnabled ? 'on' : ''}`} onClick={() => setVoiceEnabled(!voiceEnabled)} />
                    </div>
                  </div>
                </div>

                <button className="btn-begin-exam" type="button" onClick={startExam}>▶ Begin Practical Viva Exam</button>
              </>
            ) : (
              <>
                <div className="dialog-icon">🔑</div>
                <h2 className="dialog-title">Setup Gemini Key</h2>
                <p className="dialog-subtitle">Your key stays in this browser and powers the adaptive examiner when the API is connected.</p>
                <div className="field-group">
                  <label className="field-label"><span className="icon">🔐</span> Gemini API key</label>
                  <input className="text-input" type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); setSavedKey(false) }} placeholder="AIza..." />
                </div>
                <button className="btn-proceed" type="button" onClick={() => setSavedKey(true)}>{savedKey ? '✓ Key saved for this session' : 'Save Gemini key'}</button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default App
