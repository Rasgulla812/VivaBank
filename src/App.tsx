import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { ArrowLeft, BookOpen, Bookmark, Check, ChevronRight, Compass, LayoutDashboard, Library, Search, SlidersHorizontal } from 'lucide-react'
import './App.css'
import Dashboard from './Dashboard'

/* ── Subject data ── */
const computerNetworksTopics = [
  'Introduction, OSI & TCP/IP',
  'Physical Layer & Transmission',
  'Data Link Layer & LLC',
  'MAC & Shared Ethernet',
  'Network Layer & Routing',
  'Transport Layer: UDP/TCP',
  'Application Layer & Sockets',
]

const subjects = [
  { name: 'Computer Networks', code: 'CS301', icon: '⚙', color: 'purple', desc: 'Data communications, layered architectures, transmission, reliable delivery, routing, TCP/IP, and application protocols.', topics: computerNetworksTopics },
  { name: 'Data Structures & Algorithms', code: 'CS201', icon: '</>', color: 'blue', desc: 'Trees, Graphs, Dynamic Programming, Complexity Analysis, Sorting, and Searching.', topics: ['Binary Search Trees', 'Graph Algorithms', 'Dynamic Programming'] },
  { name: 'Operating Systems', code: 'CS302', icon: '⊞', color: 'green', desc: 'Process management, Deadlocks, Paging, Virtual Memory, Concurrency, and System Calls.', topics: ['Deadlock Detection & Prevention', 'Virtual Memory & Paging', 'Threads & Synchronization'] },
  { name: 'Database Systems', code: 'CS303', icon: '▤', color: 'pink', desc: 'Relational model, SQL optimization, B+ Tree indexing, Normalization, and ACID transactions.', topics: ['SQL Joins & Optimization', 'B+ Tree Indexing', 'Normalization Forms'] },
  { name: 'Machine Learning & AI', code: 'AI401', icon: '⚡', color: 'orange', desc: 'Supervised/Unsupervised models, Neural Networks, Backpropagation, and Model Evaluation.', topics: ['Gradient Descent', 'Decision Trees', 'Neural Network Architecture'] },
  { name: 'Web Engineering', code: 'CS204', icon: '⊕', color: 'cyan', desc: 'DOM architecture, REST APIs, GraphQL, Security (CORS/CSRF), and Web Performance.', topics: ['REST API Design', 'Authentication & JWT', 'Performance Optimization'] },
]

type Difficulty = 'Easy' | 'Medium' | 'Hard'
interface CuratedQuestion {
  id: string
  subject: string
  branch: string
  semester: string
  unit: string
  experiment: string
  prompt: string
  answer: string
  explanation: string
  difficulty: Difficulty
  tags: string[]
  source: string
}

const curatedQuestions: CuratedQuestion[] = [
  {
    id: 'cn-tcp-handshake',
    subject: 'Computer Networks',
    branch: 'Computer Science',
    semester: 'Semester 5',
    unit: 'Transport Layer: UDP/TCP',
    experiment: 'Socket Programming Lab',
    prompt: 'Explain the complete process of TCP connection establishment. Why is the three-way handshake required?',
    answer: 'The client sends a SYN with an initial sequence number. The server replies with SYN-ACK, acknowledging that number and providing its own sequence number. The client sends ACK, confirming the server sequence number. Both endpoints are now synchronized and can exchange reliable, full-duplex data.',
    explanation: 'Three messages allow both endpoints to prove reachability and synchronize sequence numbers in both directions without treating an old duplicate request as a new connection.',
    difficulty: 'Medium',
    tags: ['TCP', 'handshake', 'reliability'],
    source: 'MUJ CS301 syllabus · Transport Layer',
  },
  {
    id: 'cn-subnetting',
    subject: 'Computer Networks',
    branch: 'Computer Science',
    semester: 'Semester 5',
    unit: 'Network Layer & Routing',
    experiment: 'IP Addressing Worksheet',
    prompt: 'A /24 network must be divided into at least six equal subnets. Determine the new prefix and usable hosts per subnet.',
    answer: 'Borrow 3 host bits because 2³ = 8 subnets, giving a /27 prefix. Each subnet has 2⁵ = 32 addresses, of which 30 are usable after removing the network and broadcast addresses.',
    explanation: 'Subnetting trades host bits for network bits. Always choose the smallest number of borrowed bits that meets the required subnet count, then calculate usable hosts from the remaining host bits.',
    difficulty: 'Hard',
    tags: ['IPv4', 'CIDR', 'numerical'],
    source: 'MUJ CS301 syllabus · Classless Addressing',
  },
  {
    id: 'cn-arq',
    subject: 'Computer Networks',
    branch: 'Computer Science',
    semester: 'Semester 5',
    unit: 'Data Link Layer & LLC',
    experiment: 'Reliable Transmission Lab',
    prompt: 'Compare Stop-and-Wait, Go-Back-N, and Selective Repeat ARQ.',
    answer: 'Stop-and-Wait allows one outstanding frame and retransmits it after a timeout. Go-Back-N pipelines frames but retransmits the errored frame and all later frames. Selective Repeat pipelines frames and retransmits only missing or damaged frames, giving better efficiency at the cost of buffering and more complex receiver logic.',
    explanation: 'The best choice depends on delay, error rate, memory, and implementation complexity. Selective Repeat is most efficient on long, noisy links.',
    difficulty: 'Medium',
    tags: ['ARQ', 'LLC', 'error control'],
    source: 'MUJ CS301 syllabus · Data Link Layer',
  },
  {
    id: 'cn-shannon',
    subject: 'Computer Networks',
    branch: 'Computer Science',
    semester: 'Semester 5',
    unit: 'Physical Layer & Transmission',
    experiment: 'Channel Capacity Worksheet',
    prompt: 'A channel has a bandwidth of 3 kHz and an SNR of 30 dB. Use Shannon capacity to estimate its maximum data rate.',
    answer: 'Convert 30 dB to a power ratio: SNR = 10³. Shannon capacity is C = B log₂(1 + SNR) = 3000 log₂(1001), approximately 29.9 kbps.',
    explanation: 'Shannon capacity is an upper bound for a noisy channel. It does not guarantee that a particular coding or modulation scheme will achieve that rate.',
    difficulty: 'Hard',
    tags: ['Shannon', 'capacity', 'numerical'],
    source: 'MUJ CS301 syllabus · Channel Capacity',
  },
  {
    id: 'cn-dns',
    subject: 'Computer Networks',
    branch: 'Computer Science',
    semester: 'Semester 5',
    unit: 'Application Layer & Sockets',
    experiment: 'Socket Programming Lab',
    prompt: 'Differentiate recursive and iterative DNS resolution.',
    answer: 'In recursive resolution, the server contacted by the client takes responsibility for finding the final answer, possibly querying other DNS servers. In iterative resolution, each server returns the best referral or answer it knows, and the requester continues the lookup.',
    explanation: 'Recursive service is convenient for clients, while iterative referrals distribute lookup work across the hierarchy and make delegation explicit.',
    difficulty: 'Easy',
    tags: ['DNS', 'application layer', 'resolution'],
    source: 'MUJ CS301 syllabus · Application Layer',
  },
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

const computerNetworksQuestions = [
  'Explain why layered network architectures are used. Compare the responsibilities of OSI and TCP/IP models.',
  'Differentiate analog and digital data, and explain how channel capacity is affected by bandwidth, noise, and signal levels.',
  'Compare guided and wireless transmission media. When is line-of-sight propagation required?',
  'A channel has a bandwidth of 3 kHz and an SNR of 30 dB. Use Shannon capacity to estimate its maximum data rate.',
  'Compare NRZ-L, Manchester, and differential Manchester line coding with respect to synchronization and bandwidth.',
  'Explain PCM and delta modulation. What causes quantization noise and slope-overload distortion?',
  'Compare asynchronous and synchronous transmission. Why is framing needed for reliable data-link communication?',
  'Given a received bit sequence and a generator polynomial, demonstrate CRC error detection and state when the frame is rejected.',
  'Compare Stop-and-Wait, Go-Back-N, and Selective Repeat ARQ in terms of windows, retransmissions, and link utilization.',
  'Explain HDLC frame fields and compare PPP framing and link-control negotiation.',
  'Compare bus, star, and ring topologies. Which failure modes are most important in each?',
  'Explain TDMA, FDMA, CSMA, and the difference between CSMA/CD and CSMA/CA.',
  'A 100 Mbps Ethernet link has a 10 ms round-trip propagation delay. Calculate the bandwidth-delay product and explain its meaning.',
  'Explain ARP, RARP, ICMP, and NAT, and describe where each operates in the TCP/IP stack.',
  'Compare IPv4 and IPv6 addressing and headers. Why was IPv6 introduced?',
  'A /24 network must be divided into at least six equal subnets. Determine the new prefix and usable hosts per subnet.',
  'Explain classful addressing, classless addressing, CIDR, and VLSM with a suitable allocation example.',
  'Compare distance-vector and link-state routing. Explain count-to-infinity and the role of Dijkstra’s algorithm.',
  'Compare UDP and TCP headers and explain when an application should prefer each transport protocol.',
  'Walk through TCP connection establishment, reliable delivery, flow control, and connection termination.',
  'Explain TCP congestion control, including slow start, congestion avoidance, fast retransmit, and fast recovery.',
  'A TCP sender has a congestion window of 16 MSS when loss is detected by timeout. What happens to cwnd and ssthresh under classic TCP congestion control?',
  'Explain socket programming using the sequence of calls for a TCP server and a TCP client.',
  'Compare DNS, SMTP, FTP, and HTTP by purpose, transport usage, and typical request-response behavior.',
  'A GATE-style question asks which layer handles end-to-end reliability. Justify the answer and distinguish it from link-level reliability.',
  'An interview asks why Ethernet uses a minimum frame size. Relate your answer to collision detection and propagation delay.',
  'An objective exam gives a private IPv4 address and asks whether it is routable on the public Internet. Explain the role of NAT.',
]

const subjectHints: Record<string, string[]> = {
  'Computer Networks': ['layer', 'protocol', 'packet', 'frame', 'router', 'address', 'TCP', 'UDP', 'DNS', 'ARP'],
  'Data Structures & Algorithms': ['algorithm', 'complexity', 'data structure', 'tree', 'graph', 'sort'],
  'Operating Systems': ['process', 'memory', 'kernel', 'thread', 'scheduling', 'deadlock'],
  'Database Systems': ['database', 'query', 'table', 'transaction', 'index', 'SQL', 'normalization'],
  'Machine Learning & AI': ['model', 'training', 'data', 'feature', 'prediction', 'neural'],
  'Web Engineering': ['DOM', 'API', 'REST', 'security', 'performance', 'HTTP'],
}

const questionBankQuestions = (subject: string, topic: string, rotation = 0) => {
  if (subject === 'Computer Networks') {
    const topicQuestions = [
      `Explain the key concepts in ${topic} and relate them to the correct network layer or sub-layer.`,
      `Compare two protocols or techniques from ${topic}. State their use cases, limitations, and exam-relevant differences.`,
      `Solve a numerical problem based on ${topic}: calculate the relevant rate, delay, capacity, address range, window, or efficiency, showing each formula and step.`,
      `A competitive-exam question tests ${topic}. Frame the likely options, identify the correct answer, and explain why the distractors are wrong.`,
      `Describe a real network scenario involving ${topic}. Trace the data flow and identify one likely failure and its diagnosis.`,
      `State two common misconceptions about ${topic} and correct them using precise networking terminology.`,
    ]
    return topicQuestions.map((_, index) => topicQuestions[(index + rotation) % topicQuestions.length])
  }

  return [
    `What is ${topic}, and why is it important when studying ${subject}?`,
    `Walk through how ${topic} works in ${subject}. Include the key steps, components, or concepts involved.`,
    `Describe a practical scenario where ${topic} is used in ${subject}. What trade-offs or common mistakes should you consider?`,
  ]
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

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

type AppView = 'dashboard' | 'subjects' | 'subject-detail' | 'question-detail' | 'bookmarks' | 'practice-session' | 'practice-results'

type PracticeAnswer = { selected?: string; text: string; correct: boolean; feedback?: string; unitMissing?: boolean }
type PracticeAttempt = { id: string; date: string; score: number; total: number; weakTopics: string[]; mode: 'mcq' | 'short'; difficulty: Difficulty }
type GeneratedQuestionType = 'short-answer' | 'conceptual' | 'mcq' | 'follow-up'
type GeneratedQuestion = { question: string; type: GeneratedQuestionType; modelAnswer: string; rubric: string[] }

type NumericalCheck = { value: number; units: string[] }
type PracticeBlueprint = {
  id: string
  mode: 'mcq' | 'short'
  prompt?: string
  options?: string[]
  correct?: string
  numerical?: NumericalCheck[]
}

const practiceBlueprints: PracticeBlueprint[] = [
  {
    id: 'cn-tcp-handshake',
    mode: 'mcq' as const,
    prompt: 'Which sequence correctly describes TCP connection establishment?',
    options: ['SYN → SYN-ACK → ACK', 'ACK → SYN → SYN-ACK', 'SYN → ACK → FIN', 'FIN → FIN-ACK → ACK'],
    correct: 'SYN → SYN-ACK → ACK',
  },
  {
    id: 'cn-subnetting',
    mode: 'short',
    numerical: [
      { value: 27, units: ['/', 'prefix', 'cidr'] },
      { value: 30, units: ['host', 'hosts', 'usable'] },
    ],
  },
  {
    id: 'cn-arq',
    mode: 'mcq' as const,
    prompt: 'Which ARQ protocol retransmits only the frames that are lost or damaged?',
    options: ['Stop-and-Wait ARQ', 'Go-Back-N ARQ', 'Selective Repeat ARQ', 'Pure ALOHA'],
    correct: 'Selective Repeat ARQ',
  },
  {
    id: 'cn-shannon',
    mode: 'short',
    numerical: [{ value: 29.9, units: ['kbps', 'kilobit', 'kilobits'] }],
  },
  {
    id: 'cn-dns',
    mode: 'mcq' as const,
    prompt: 'What happens during recursive DNS resolution?',
    options: [
      'The contacted DNS server finds the final answer on behalf of the client',
      'The client contacts every authoritative server directly',
      'The query is broadcast to every DNS server',
      'The DNS server establishes a circuit-switched connection',
    ],
    correct: 'The contacted DNS server finds the final answer on behalf of the client',
  },
]

function numericalAnswer(text: string, checks: NumericalCheck[]) {
  const numbers = [...text.matchAll(/(?:\d+\.\d+|\d+)/g)].map((match) => Number(match[0]))
  const valuesMatch = checks.every((check) => numbers.some((number) => Math.abs(number - check.value) < 0.05))
  if (!valuesMatch) return { correct: false, feedback: 'Check the numerical value and try again.' }

  const normalized = text.toLowerCase()
  const missingUnit = checks.some((check) => !check.units.some((unit) => normalized.includes(unit)))
  return missingUnit
    ? { correct: true, unitMissing: true, feedback: 'Correct numerical value. Add the unit to make your answer complete.' }
    : { correct: true, feedback: 'Correct numerical value and unit.' }
}

function loadAttempts(): PracticeAttempt[] {
  const stored = window.localStorage.getItem('vivabank-practice-attempts')
  if (!stored) return []
  try {
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as PracticeAttempt[] : []
  } catch (error) {
    console.warn('Unable to restore practice history.', error)
    return []
  }
}

function loadIdSet(key: string) {
  const stored = window.localStorage.getItem(key)
  if (!stored) return new Set<string>()
  try {
    const parsed: unknown = JSON.parse(stored)
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [])
  } catch (error) {
    console.warn(`Unable to restore ${key}.`, error)
    return new Set<string>()
  }
}

function validateGeneratedQuestions(value: unknown): GeneratedQuestion[] {
    if (!Array.isArray(value)) return []
    return value.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const candidate = item as Record<string, unknown>
      if (typeof candidate.question !== 'string' || candidate.question.trim().length < 15) return []
      const type = candidate.type
      if (!['short-answer', 'conceptual', 'mcq', 'follow-up'].includes(String(type))) return []
      if (typeof candidate.modelAnswer !== 'string' || candidate.modelAnswer.trim().length < 20) return []
      const rubric = Array.isArray(candidate.rubric) ? candidate.rubric.filter((part): part is string => typeof part === 'string' && part.trim().length > 0).slice(0, 5) : []
      return rubric.length >= 2 ? [{ question: candidate.question.trim(), type: type as GeneratedQuestionType, modelAnswer: candidate.modelAnswer.trim(), rubric }] : []
    }).slice(0, 10)
  }

async function generateWithGemini(apiKey: string, request: string): Promise<GeneratedQuestion[]> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: request }] }] }),
    })
    if (!response.ok) throw new Error(`AI generation failed (${response.status}).`)
    const payload: unknown = await response.json()
    const text = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('The AI returned an empty response.')
    const json = text.match(/\[[\s\S]*\]/)?.[0]
    if (!json) throw new Error('The AI response was not valid JSON.')
    const questions = validateGeneratedQuestions(JSON.parse(json))
    if (questions.length === 0) throw new Error('The AI response did not contain valid questions.')
    return questions
}

function PracticePage({ questions, index, answers, timeRemaining, mode, difficulty, onAnswer, onNext, onFinish, onExit }: {
  questions: CuratedQuestion[]
  index: number
  answers: Record<string, PracticeAnswer>
  timeRemaining: number
  mode: 'mcq' | 'short'
  difficulty: Difficulty
  onAnswer: (answer: PracticeAnswer) => void
  onNext: () => void
  onFinish: () => void
  onExit: () => void
}) {
  const question = questions[index]
  const practiceMeta = practiceBlueprints.find((item) => item.id === question.id)
  const mcqOptions = practiceMeta?.options
  const current = answers[question.id]
  const isLast = index === questions.length - 1
  const handleShortAnswer = (text: string) => {
    const numericalResult = practiceMeta?.numerical
      ? numericalAnswer(text, practiceMeta.numerical)
      : {
        correct: text.trim().length > 20 && question.answer.split(' ').some((word) => word.length > 4 && text.toLowerCase().includes(word.toLowerCase())),
        feedback: text.trim().length > 20 ? 'Answer recorded.' : 'Add a little more detail to your answer.',
      }
    onAnswer({ text, ...numericalResult })
  }
  return <section className="workspace-page practice-page">
    <div className="practice-session-header"><div><span className="eyebrow">Practice session · {difficulty}</span><h1>{mode === 'mcq' ? 'Concept check' : 'Short-answer practice'}</h1></div><button className="secondary-action" type="button" onClick={onExit}>Exit session</button></div>
    <div className="practice-progress-row"><span>Question {index + 1} of {questions.length}</span><div className="practice-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><strong>{Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}</strong></div>
    <article className="content-card practice-question-card"><div className="question-detail-meta"><span className="status-badge blue">{question.unit}</span><span className="muted-label">{question.difficulty} · {question.tags.join(' · ')}</span></div><h2>{mode === 'mcq' ? (practiceMeta?.prompt ?? question.prompt) : question.prompt}</h2>{mode === 'mcq' && mcqOptions ? <div className="mcq-options">{mcqOptions.map((option) => <button key={option} type="button" className={`mcq-option${current?.selected === option ? ' selected' : ''}`} onClick={() => onAnswer({ selected: option, text: option, correct: option === practiceMeta.correct, feedback: option === practiceMeta.correct ? 'Correct answer.' : 'That option is not correct.' })}><span>{String.fromCharCode(65 + mcqOptions.indexOf(option))}</span>{option}</button>)}</div> : <><textarea className="practice-answer-input" value={current?.text ?? ''} onChange={(event) => handleShortAnswer(event.target.value)} placeholder="Write your answer in your own words..." />{current?.feedback && <p className={`practice-answer-feedback${current.unitMissing ? ' unit-missing' : ''}`}>{current.feedback}</p>}</>}</article>
    <div className="practice-actions">{index > 0 && <button className="secondary-action" type="button" onClick={onNext}>Skip for now</button>}{isLast ? <button className="primary-action" type="button" onClick={onFinish}>Finish practice <Check size={16} /></button> : <button className="primary-action" type="button" onClick={onNext} disabled={!current}>Next question <ChevronRight size={16} /></button>}</div>
  </section>
}

function ResultsPage({ attempt, questions, answers, history, onStart, onReview, onBack }: { attempt: PracticeAttempt; questions: CuratedQuestion[]; answers: Record<string, PracticeAnswer>; history: PracticeAttempt[]; onStart: () => void; onReview: (id: string) => void; onBack: () => void }) {
  const incorrect = questions.filter((question) => !answers[question.id]?.correct)
  return <section className="workspace-page results-page"><div className="page-heading"><div><span className="eyebrow">Practice complete</span><h1>Nice work. Review your result.</h1><p>Your attempt is saved locally and will remain available after refresh.</p></div><button className="primary-action" type="button" onClick={onStart}>Try another session <ChevronRight size={16} /></button></div><div className="results-grid"><article className="content-card score-card"><span className="eyebrow">Score</span><strong>{attempt.score}<small>/{attempt.total}</small></strong><span>{Math.round((attempt.score / attempt.total) * 100)}% correct</span></article><article className="content-card"><span className="eyebrow">Weak topics</span><div className="weak-topic-list">{(attempt.weakTopics.length ? attempt.weakTopics : ['No weak topics detected']).map((topic) => <span key={topic}>{topic}</span>)}</div></article></div><div className="results-section"><div className="card-section-heading"><h2>Review answers</h2><span className="muted-label">{incorrect.length} to revisit</span></div><div className="review-list">{questions.map((question) => <button key={question.id} type="button" className={`review-row ${answers[question.id]?.correct ? 'correct' : 'incorrect'}`} onClick={() => onReview(question.id)}><span>{answers[question.id]?.correct ? '✓' : '!'}</span><div><strong>{question.prompt}</strong><small>{question.unit}</small>{answers[question.id]?.feedback && <em>{answers[question.id].feedback}</em>}<em>Correct answer: {question.answer}</em><em>{question.explanation}</em></div><ChevronRight size={16} /></button>)}</div></div><div className="results-section"><div className="card-section-heading"><h2>Attempt history</h2><span className="muted-label">Saved on this device</span></div><div className="history-list">{history.slice(0, 5).map((item) => <div className="history-row" key={item.id}><span>{new Date(item.date).toLocaleDateString()}</span><strong>{item.score}/{item.total}</strong><span>{item.mode.toUpperCase()} · {item.difficulty}</span></div>)}</div><button className="page-back" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to study space</button></div></section>
}

interface StudyPageProps {
  subjects: typeof subjects
  page: AppView
  searchTerm: string
  setSearchTerm: (value: string) => void
  onOpenSubject: (name: string) => void
  onStartPractice: () => void
  selectedQuestion: CuratedQuestion
  bookmarkedIds: Set<string>
  revisedIds: Set<string>
  onToggleBookmark: (id: string) => void
  onToggleRevised: (id: string) => void
  revealedAnswer: boolean
  onToggleAnswer: () => void
  onOpenQuestion: (id?: string) => void
  onBack: () => void
  selectedSubject: string
}

function StudyPage({ subjects, page, searchTerm, setSearchTerm, onOpenSubject, onStartPractice, selectedQuestion, bookmarkedIds, revisedIds, onToggleBookmark, onToggleRevised, revealedAnswer, onToggleAnswer, onOpenQuestion, onBack, selectedSubject }: StudyPageProps) {
  const subject = subjects.find((item) => item.name === selectedSubject) ?? subjects[0]
  const [difficulty, setDifficulty] = useState<'All' | Difficulty>('All')
  const filteredQuestions = curatedQuestions.filter((question) => {
    const searchable = `${question.prompt} ${question.answer} ${question.unit} ${question.tags.join(' ')}`.toLowerCase()
    return searchable.includes(searchTerm.toLowerCase()) && (difficulty === 'All' || question.difficulty === difficulty)
  })
  const filteredSubjects = subjects.filter((item) => `${item.name} ${item.desc} ${item.topics.join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase()))

  if (page === 'subject-detail') {
    return (
      <section className="workspace-page">
        <button className="page-back" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to subjects</button>
        <div className="page-heading">
          <div>
            <span className="eyebrow">{subject.code} · Subject details</span>
            <h1>{subject.name}</h1>
            <p>{subject.desc}</p>
          </div>
          <button className="primary-action" type="button" onClick={onStartPractice}>Start practice <ChevronRight size={16} /></button>
        </div>
        <div className="detail-grid">
          <article className="content-card detail-overview">
            <div className={`card-icon ${subject.color}`}>{subject.icon}</div>
            <h2>Course overview</h2>
            <p>Build confidence through focused explanations, numerical problems, and competitive-exam style questions.</p>
            <div className="detail-stats"><span><strong>{subject.topics.length}</strong> learning tracks</span><span><strong>54</strong> practice prompts</span></div>
          </article>
          <article className="content-card">
            <div className="card-section-heading"><h2>Topics to master</h2><span className="muted-label">Recommended path</span></div>
            <div className="topic-list">{subject.topics.map((topic, index) => <button type="button" key={topic} onClick={() => onOpenQuestion(curatedQuestions[index % curatedQuestions.length].id)}><span className="topic-index">0{index + 1}</span><span>{topic}</span><ChevronRight size={16} /></button>)}</div>
          </article>
        </div>
      </section>
    )
  }

  if (page === 'question-detail') {
    return (
      <section className="workspace-page">
        <button className="page-back" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to question bank</button>
        <div className="page-heading"><div><span className="eyebrow">Question detail · {selectedQuestion.unit}</span><h1>{selectedQuestion.prompt}</h1><p>{selectedQuestion.semester} · {selectedQuestion.branch} · Source: {selectedQuestion.source}</p></div><button className="primary-action" type="button" onClick={onStartPractice}>Practice this <ChevronRight size={16} /></button></div>
        <article className="content-card question-detail-card">
          <div className="question-detail-meta"><span className="status-badge blue">{selectedQuestion.difficulty}</span><span className="muted-label">{selectedQuestion.tags.join(' · ')}</span></div>
          <div className="question-actions"><button className={`secondary-action ${bookmarkedIds.has(selectedQuestion.id) ? 'selected-action' : ''}`} type="button" onClick={() => onToggleBookmark(selectedQuestion.id)}><Bookmark size={16} fill={bookmarkedIds.has(selectedQuestion.id) ? 'currentColor' : 'none'} /> {bookmarkedIds.has(selectedQuestion.id) ? 'Bookmarked' : 'Bookmark'}</button><button className={`secondary-action ${revisedIds.has(selectedQuestion.id) ? 'selected-action' : ''}`} type="button" onClick={() => onToggleRevised(selectedQuestion.id)}><Check size={16} /> {revisedIds.has(selectedQuestion.id) ? 'Marked revised' : 'Mark as revised'}</button></div>
          <div className="answer-reveal"><div className="answer-reveal-header"><h2>Answer and explanation</h2><button className="text-action" type="button" onClick={onToggleAnswer}>{revealedAnswer ? 'Hide answer' : 'Reveal answer'}</button></div>{revealedAnswer ? <><p className="answer-text">{selectedQuestion.answer}</p><div className="answer-explanation"><strong>Why it matters</strong><p>{selectedQuestion.explanation}</p></div></> : <div className="answer-hidden">Try answering from memory first, then reveal the explanation.</div>}</div>
        </article>
      </section>
    )
  }

  return (
    <section className="workspace-page">
      <div className="page-heading"><div><span className="eyebrow">{selectedSubject === 'bookmarks' ? 'Your study queue' : 'Explore your syllabus'}</span><h1>{selectedSubject === 'bookmarks' ? 'Bookmarked questions' : 'Subject explorer'}</h1><p>{selectedSubject === 'bookmarks' ? 'Return to saved questions and track what you have revised.' : 'Browse structured courses or search directly across the curated question bank.'}</p></div><button className="secondary-action" type="button" onClick={() => onOpenQuestion(filteredQuestions[0]?.id)}><Bookmark size={16} /> Open a question</button></div>
      <div className="explorer-toolbar"><label className="search-field"><Search size={17} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search questions, units, tags, or subjects" /></label><select className="filter-button" value={difficulty} onChange={(event) => setDifficulty(event.target.value as 'All' | Difficulty)}><option value="All">All difficulties</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select><button className="filter-button" type="button"><SlidersHorizontal size={16} /> {filteredQuestions.length} questions</button></div>
      {selectedSubject === 'bookmarks' ? <div className="question-bank-grid">{curatedQuestions.filter((question) => bookmarkedIds.has(question.id)).map((question) => <QuestionCard key={question.id} question={question} bookmarked={bookmarkedIds.has(question.id)} revised={revisedIds.has(question.id)} onOpenQuestion={onOpenQuestion} onToggleBookmark={onToggleBookmark} />)}</div> : <div className="explorer-grid">{filteredSubjects.map((item) => <button type="button" className="explorer-card" key={item.name} onClick={() => onOpenSubject(item.name)}><div className="explorer-card-top"><div className={`card-icon ${item.color}`}>{item.icon}</div><span className="card-code">{item.code}</span></div><h2>{item.name}</h2><p>{item.desc}</p><div className="explorer-card-footer"><span>{item.topics.length} learning tracks</span><ChevronRight size={17} /></div></button>)}</div>}
      {selectedSubject === 'bookmarks' && !curatedQuestions.some((question) => bookmarkedIds.has(question.id)) && <div className="empty-note"><Bookmark size={24} /><strong>No bookmarks yet</strong><span>Open a question and save it to build your study queue.</span></div>}
      {selectedSubject !== 'bookmarks' && <div className="question-bank-section"><div className="card-section-heading"><h2>Curated questions</h2><span className="muted-label">Computer Networks · CS301</span></div><div className="question-bank-grid">{filteredQuestions.map((question) => <QuestionCard key={question.id} question={question} bookmarked={bookmarkedIds.has(question.id)} revised={revisedIds.has(question.id)} onOpenQuestion={onOpenQuestion} onToggleBookmark={onToggleBookmark} />)}</div></div>}
      {filteredQuestions.length === 0 && <div className="empty-note"><Compass size={24} /><strong>No questions found</strong><span>Try another search or difficulty.</span></div>}
    </section>
  )
}

function QuestionCard({ question, bookmarked, revised, onOpenQuestion, onToggleBookmark }: { question: CuratedQuestion; bookmarked: boolean; revised: boolean; onOpenQuestion: (id?: string) => void; onToggleBookmark: (id: string) => void }) {
  return <article className="question-card"><button className="question-card-main" type="button" onClick={() => onOpenQuestion(question.id)}><div className="question-card-meta"><span className="status-badge blue">{question.difficulty}</span><span className="muted-label">{question.unit}</span></div><h3>{question.prompt}</h3><div className="question-card-tags">{question.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><p>{question.source}</p></button><div className="question-card-footer"><button className={`icon-action ${bookmarked ? 'revised' : ''}`} type="button" onClick={() => onToggleBookmark(question.id)} aria-label="Bookmark question"><Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} /></button><span>{revised ? 'Revised' : bookmarked ? 'Bookmarked' : 'Not revised'}</span></div></article>
}

function App() {
  const [activeView, setActiveView] = useState<AppView>('dashboard')
  const [activeDialog, setActiveDialog] = useState<'viva' | 'key' | 'bank' | null>(null)
  const [selectedSubject, setSelectedSubject] = useState('Computer Networks')
  const [selectedBankSubject, setSelectedBankSubject] = useState('Computer Networks')
  const [selectedBankTopic, setSelectedBankTopic] = useState(subjects[0].topics[0])
  const [bankTopicInput, setBankTopicInput] = useState('')
  const [bankRotation, setBankRotation] = useState(0)
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
  const [vivaUnit, setVivaUnit] = useState(subjects[0].topics[0])
  const [vivaExperiment, setVivaExperiment] = useState('Socket Programming Lab')
  const [vivaDifficulty, setVivaDifficulty] = useState<Difficulty>('Medium')
  const [vivaQuestionType, setVivaQuestionType] = useState<GeneratedQuestionType>('short-answer')
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [generationError, setGenerationError] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [notificationIndex, setNotificationIndex] = useState(0)
  const [notificationsVisible, setNotificationsVisible] = useState(true)
  const [examQuestions, setExamQuestions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPageSubject, setSelectedPageSubject] = useState('Computer Networks')
  const [selectedQuestionId, setSelectedQuestionId] = useState(curatedQuestions[0].id)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => loadIdSet('vivabank-bookmarks'))
  const [revisedIds, setRevisedIds] = useState<Set<string>>(() => loadIdSet('vivabank-revised'))
  const [revealedAnswer, setRevealedAnswer] = useState(false)
  const [practiceMode, setPracticeMode] = useState<'mcq' | 'short'>('mcq')
  const [practiceDifficulty, setPracticeDifficulty] = useState<Difficulty>('Medium')
  const [practiceQuestions, setPracticeQuestions] = useState<CuratedQuestion[]>([])
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, PracticeAnswer>>({})
  const [practiceTime, setPracticeTime] = useState(300)
  const [lastAttempt, setLastAttempt] = useState<PracticeAttempt | null>(null)
  const [attemptHistory, setAttemptHistory] = useState<PracticeAttempt[]>(loadAttempts)

  const currentPrompt = examQuestions[currentQuestion - 1] ?? questionTemplates[(currentQuestion - 1) % questionTemplates.length](selectedSubject)
  const currentGeneratedQuestion = generatedQuestions[currentQuestion - 1]
  const currentSubjectData = subjects.find(s => s.name === selectedSubject)
  const bankSubjectData = subjects.find(s => s.name === selectedBankSubject)
  const bankQuestions = questionBankQuestions(selectedBankSubject, selectedBankTopic, bankRotation)
  const currentNotification = careerNotifications[notificationIndex]

  const closeDialog = () => setActiveDialog(null)

  const navigate = (view: AppView) => {
    setActiveView(view)
    setActiveDialog(null)
    if (view !== 'subject-detail') window.history.replaceState(null, '', window.location.pathname)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSetValue = (setter: Dispatch<SetStateAction<Set<string>>>, id: string, storageKey: string) => {
    setter((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      window.localStorage.setItem(storageKey, JSON.stringify([...next]))
      return next
    })
  }

  const openCuratedQuestion = (id?: string) => {
    if (id) setSelectedQuestionId(id)
    setRevealedAnswer(false)
    navigate('question-detail')
  }

  const startPractice = () => {
    const eligible = curatedQuestions.filter((question) => practiceDifficulty === 'Medium' || question.difficulty === practiceDifficulty)
    const modeEligible = eligible.filter((question) => practiceBlueprints.find((item) => item.id === question.id)?.mode === practiceMode)
    const selected = shuffle(modeEligible.length >= 2 ? modeEligible : eligible.length >= 3 ? eligible : curatedQuestions).slice(0, 4)
    setPracticeQuestions(selected)
    setPracticeIndex(0)
    setPracticeAnswers({})
    setPracticeTime(300)
    navigate('practice-session')
  }

  const finishPractice = useCallback(() => {
    const correct = practiceQuestions.filter((question) => practiceAnswers[question.id]?.correct)
    const weakTopics = practiceQuestions.filter((question) => !practiceAnswers[question.id]?.correct).map((question) => question.unit)
    const attempt: PracticeAttempt = { id: String(Date.now()), date: new Date().toISOString(), score: correct.length, total: practiceQuestions.length, weakTopics: [...new Set(weakTopics)], mode: practiceMode, difficulty: practiceDifficulty }
    const nextHistory = [attempt, ...attemptHistory]
    setLastAttempt(attempt)
    setAttemptHistory(nextHistory)
    window.localStorage.setItem('vivabank-practice-attempts', JSON.stringify(nextHistory))
    navigate('practice-results')
  }, [attemptHistory, practiceAnswers, practiceDifficulty, practiceMode, practiceQuestions])

  const selectBankSubject = (subjectName: string) => {
    const subject = subjects.find(s => s.name === subjectName)
    if (!subject) return
    setSelectedBankSubject(subject.name)
    setSelectedBankTopic(subject.topics[0])
    setBankTopicInput('')
    setBankRotation((rotation) => rotation + 1)
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
    setBankRotation((rotation) => rotation + 1)
  }

  const startExam = () => {
    const prompts = generatedQuestions.length > 0
      ? generatedQuestions.map((item) => item.question).slice(0, questionCount)
      : selectedSubject === 'Computer Networks'
      ? shuffle(computerNetworksQuestions).slice(0, Math.max(questionCount, 7))
      : shuffle(questionTemplates).map((template) => template(selectedSubject))
    setCurrentQuestion(1)
    setTimeRemaining(secondsPerQuestion)
    setExamComplete(false)
    setAnswer('')
    setFeedback(null)
    setShowHint(false)
    setExamQuestions(prompts)
    setExamStarted(true)
    closeDialog()
  }

  const generateVivaQuestions = async () => {
    if (!apiKey.trim()) {
      setGenerationError('Add your Gemini API key before generating AI questions.')
      setGenerationStatus('error')
      return
    }
    setGenerationStatus('loading')
    setGenerationError('')
    const syllabus = examSource === 'custom' ? customSyllabus.trim() : selectedSubject
    const request = `Return only a JSON array. Generate ${Math.max(questionCount, 4)} ${vivaQuestionType} viva questions for ${syllabus}, unit ${vivaUnit}, experiment ${vivaExperiment}, difficulty ${vivaDifficulty}. Each object must contain question, type (${vivaQuestionType}), modelAnswer, and rubric (an array of at least 2 concrete scoring criteria). Stay within computer networking or the supplied syllabus. Do not invent prerequisites or facts.`
    try {
      const generated = await generateWithGemini(apiKey.trim(), request)
      setGeneratedQuestions(generated)
      setGenerationStatus('idle')
    } catch (error) {
      setGeneratedQuestions([])
      setGenerationStatus('error')
      setGenerationError(error instanceof Error ? error.message : 'Unable to generate questions. Using the built-in question bank is still available.')
    }
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
    const generatedRubric = generatedQuestions[currentQuestion - 1]?.rubric ?? []
    const matchedRubric = generatedRubric.filter((criterion) => normalizedAnswer.includes(criterion.toLowerCase()))
    const evidence = matchedHints.length + matchedRubric.length
    const acc = Math.min(95, 40 + evidence * 12 + Math.min(normalizedAnswer.length / 10, 25))
    const dep = Math.min(95, 35 + evidence * 11 + Math.min(normalizedAnswer.length / 12, 30))
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
    } else if (evidence === 0) {
      setFeedback({
        title: 'Good attempt, but add rubric evidence',
        correction: `Your answer does not yet mention the core concepts expected in ${selectedSubject}.`,
        instruction: `Address these criteria: ${(generatedRubric.length ? generatedRubric : hints).slice(0, 3).join(', ')}.`,
        tone: 'needs-work', accuracy: Math.round(acc), depth: Math.round(dep), clarity: Math.round(cla),
        strengths: ['Logical structure'], gaps: (generatedRubric.length ? generatedRubric : hints).slice(0, 2),
        commentary: `"Your response lacks precise technical terminology regarding ${selectedSubject}. Let us step back to core principles."`,
        action: 'cross examine'
      })
    } else {
      setFeedback({
        title: 'Solid direction',
        correction: `Your answer addressed ${evidence} rubric point${evidence === 1 ? '' : 's'}.`,
        instruction: 'To improve, justify your approach and include one concrete example or trade-off.',
        tone: 'good', accuracy: Math.round(acc), depth: Math.round(dep), clarity: Math.round(cla),
        strengths: (matchedHints.length ? matchedHints : matchedRubric).slice(0, 3), gaps: hints.filter(h => !matchedHints.includes(h)).slice(0, 2),
        commentary: '"Good understanding demonstrated against the selected rubric."',
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

  useEffect(() => {
    if (activeView !== 'practice-session' || practiceQuestions.length === 0) return
    const timer = window.setInterval(() => {
      setPracticeTime((time) => {
        if (time <= 1) {
          finishPractice()
          return 0
        }
        return time - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [activeView, finishPractice, practiceQuestions.length])

  const overallScore = feedback ? Math.round((feedback.accuracy + feedback.depth + feedback.clarity) / 3) : 0

  return (
    <main className={`app-shell ${theme === 'light' ? 'theme-light' : ''}`}>
      <aside className="app-sidebar">
        <a className="brand sidebar-brand" href="#top">
          <div className="brand-icon" aria-hidden="true"><BookOpen size={21} strokeWidth={2.2} /></div>
          <div className="brand-text"><div className="brand-name">Viva<span>Bank</span></div><span className="sidebar-caption">Academic practice</span></div>
        </a>
        <div className="sidebar-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          <button className={activeView === 'dashboard' ? 'active' : ''} type="button" onClick={() => navigate('dashboard')}><LayoutDashboard size={17} /> Dashboard</button>
          <button className={activeView === 'subjects' || activeView === 'subject-detail' ? 'active' : ''} type="button" onClick={() => navigate('subjects')}><Library size={17} /> Subjects</button>
          <button className={activeView === 'question-detail' || activeView === 'practice-session' || activeView === 'practice-results' ? 'active' : ''} type="button" onClick={() => { setPracticeQuestions([]); setActiveView('practice-session'); setActiveDialog(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Compass size={17} /> Practice</button>
          <button className={activeView === 'bookmarks' ? 'active' : ''} type="button" onClick={() => navigate('bookmarks')}><Bookmark size={17} /> Bookmarks</button>
        </nav>
        <div className="sidebar-footer"><span className="sidebar-label">Your progress</span><strong>62%</strong><div className="sidebar-progress"><span /></div><small>Keep your study streak going.</small></div>
      </aside>
      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="mobile-brand"><BookOpen size={19} /> Viva<span>Bank</span></div>
        <label className="topbar-search"><Search size={16} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search your study space" /></label>
        <nav className="nav-actions">
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

      {/* ── Routed workspace ── */}
      {activeView === 'practice-session' && practiceQuestions.length === 0 ? (
        <section className="workspace-page practice-setup-page">
          <div className="page-heading"><div><span className="eyebrow">Practice engine</span><h1>Build a focused session</h1><p>Choose a mode and difficulty. Questions are randomized from the curated Computer Networks bank.</p></div></div>
          <div className="practice-setup-grid"><article className="content-card"><span className="eyebrow">Question mode</span><h2>How do you want to practice?</h2><div className="mode-options"><button type="button" className={practiceMode === 'mcq' ? 'selected' : ''} onClick={() => setPracticeMode('mcq')}><strong>Multiple choice</strong><span>Fast concept checks with instant scoring.</span></button><button type="button" className={practiceMode === 'short' ? 'selected' : ''} onClick={() => setPracticeMode('short')}><strong>Short answer</strong><span>Write explanations and test recall.</span></button></div></article><article className="content-card"><span className="eyebrow">Difficulty</span><h2>Set your challenge</h2><div className="difficulty-options">{(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => <button key={level} type="button" className={practiceDifficulty === level ? 'selected' : ''} onClick={() => setPracticeDifficulty(level)}>{level}</button>)}</div><button className="primary-action setup-start" type="button" onClick={startPractice}>Start randomized session <ChevronRight size={16} /></button></article></div>
        </section>
      ) : activeView === 'practice-session' ? (
        <PracticePage questions={practiceQuestions} index={practiceIndex} answers={practiceAnswers} timeRemaining={practiceTime} mode={practiceMode} difficulty={practiceDifficulty} onAnswer={(answer) => setPracticeAnswers((current) => ({ ...current, [practiceQuestions[practiceIndex].id]: answer }))} onNext={() => setPracticeIndex((index) => Math.min(index + 1, practiceQuestions.length - 1))} onFinish={finishPractice} onExit={() => navigate('dashboard')} />
      ) : activeView === 'practice-results' && lastAttempt ? (
        <ResultsPage attempt={lastAttempt} questions={practiceQuestions} answers={practiceAnswers} history={attemptHistory} onStart={() => { setPracticeQuestions([]); navigate('practice-session') }} onReview={openCuratedQuestion} onBack={() => navigate('dashboard')} />
      ) : activeView === 'dashboard' ? (
        <Dashboard
          candidateName={candidateName}
          onStartViva={(subject) => { setSelectedSubject(subject); setActiveDialog('viva') }}
          onOpenQuestionBank={() => navigate('bookmarks')}
        />
      ) : (
        <StudyPage
          subjects={subjects}
          page={activeView}
          onStartPractice={() => { setPracticeQuestions([]); navigate('practice-session') }}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedQuestion={curatedQuestions.find((question) => question.id === selectedQuestionId) ?? curatedQuestions[0]}
          bookmarkedIds={bookmarkedIds}
          revisedIds={revisedIds}
          onToggleBookmark={(id) => toggleSetValue(setBookmarkedIds, id, 'vivabank-bookmarks')}
          onToggleRevised={(id) => toggleSetValue(setRevisedIds, id, 'vivabank-revised')}
          revealedAnswer={revealedAnswer}
          onToggleAnswer={() => setRevealedAnswer((value) => !value)}
          selectedSubject={activeView === 'bookmarks' ? 'bookmarks' : activeView === 'question-detail' ? 'question' : selectedPageSubject}
          onBack={() => navigate('subjects')}
          onOpenQuestion={openCuratedQuestion}
          onOpenSubject={(subject) => {
            setSelectedPageSubject(subject)
            if (activeView === 'subjects') {
              navigate('subject-detail')
            } else {
              setSelectedSubject(subject)
              setActiveDialog('viva')
            }
          }}
        />
      )}

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
                {currentGeneratedQuestion && <span className="ai-generated-badge">AI-generated · validated</span>}
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

                  {currentGeneratedQuestion && (
                    <div className="ai-model-answer">
                      <strong>Model answer</strong>
                      <p>{currentGeneratedQuestion.modelAnswer}</p>
                      <small>Rubric: {currentGeneratedQuestion.rubric.join(' · ')}</small>
                    </div>
                  )}

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
                <p className="dialog-subtitle">Computer Networks questions include concepts, numericals, and competitive-exam patterns from the course syllabus.</p>

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
                      <span>
                        <span className="question-bank-type">
                          {selectedBankSubject === 'Computer Networks'
                            ? ['Concept', 'Compare', 'Numerical', 'Competitive', 'Scenario', 'Revision'][index]
                            : 'Practice'}
                        </span>
                        {question}
                      </span>
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

                <div className="ai-generation-section">
                  <div className="persona-section-label">AI Question Generator</div>
                  <p className="ai-generated-note">Generate validated questions for a specific unit and experiment. AI-generated content is labelled and can fall back to the curated bank if unavailable.</p>
                  <div className="ai-generation-grid">
                    <label className="field-group"><span className="field-label">Unit</span><select className="text-input" value={vivaUnit} onChange={(event) => setVivaUnit(event.target.value)}>{(subjects.find((subject) => subject.name === selectedSubject)?.topics ?? computerNetworksTopics).map((topic) => <option key={topic}>{topic}</option>)}</select></label>
                    <label className="field-group"><span className="field-label">Experiment</span><input className="text-input" value={vivaExperiment} onChange={(event) => setVivaExperiment(event.target.value)} placeholder="e.g. Socket Programming Lab" /></label>
                    <label className="field-group"><span className="field-label">Difficulty</span><select className="text-input" value={vivaDifficulty} onChange={(event) => setVivaDifficulty(event.target.value as Difficulty)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
                    <label className="field-group"><span className="field-label">Question type</span><select className="text-input" value={vivaQuestionType} onChange={(event) => setVivaQuestionType(event.target.value as GeneratedQuestionType)}><option value="short-answer">Short answer</option><option value="conceptual">Conceptual</option><option value="mcq">MCQ</option><option value="follow-up">Follow-up</option></select></label>
                  </div>
                  <button className="secondary-action" type="button" onClick={generateVivaQuestions} disabled={generationStatus === 'loading'}>{generationStatus === 'loading' ? 'Generating…' : 'Generate AI questions'}</button>
                  {generationStatus === 'error' && <p className="ai-generation-error">{generationError}</p>}
                  {generatedQuestions.length > 0 && <p className="ai-generation-success">✓ {generatedQuestions.length} AI-generated questions validated and ready.</p>}
                </div>

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

                <button className="btn-begin-exam" type="button" onClick={startExam}>▶ Begin {generatedQuestions.length > 0 ? 'AI Viva' : 'Practical Viva Exam'}</button>
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
