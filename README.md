# VivaBank

![VivaBank sign-in UI](./docs/screenshots/auth-page.png)

## Core idea

VivaBank is a focused academic practice platform for engineering students. It helps students prepare for university vivas and technical exams using course-specific questions, structured practice sessions, and AI-assisted viva preparation.

The goal is simple: turn scattered exam preparation into one consistent workspace where students can study, practise, review mistakes, and track their real learning activity.

## The problem

Engineering students often prepare from disconnected notes, question banks, and last-minute revision material. This makes it difficult to:

- Find questions for the correct course and topic.
- Practise both objective and written answers.
- Simulate a technical viva.
- Know which topics need more attention.
- Keep a reliable history of completed practice and exam attempts.

## The solution

VivaBank brings these activities together in one application:

- **Course-specific question banks** for Computer Networks, DSA, Operating Systems, Databases, Machine Learning, and Web Engineering.
- **MCQ practice** with selectable options and instant feedback.
- **Short-answer practice** for written explanations and numerical questions.
- **AI viva preparation** with generated questions, examiner-style feedback, and configurable difficulty.
- **Persistent assessment history** backed by Supabase.
- **Honest progress tracking** based on saved attempts rather than invented dashboard values.
- **Secure student accounts** with Supabase Auth and Row Level Security.

## How it works

1. Create an account or sign in.
2. Choose a course and topic.
3. Select MCQ, short-answer, or AI viva practice.
4. Submit answers and review feedback.
5. View saved attempts and progress from the dashboard.

Practice and viva submissions are designed to be persisted server-side so results can survive refreshes and be retrieved on another signed-in device.

## UI preview

### Sign in

![VivaBank authentication screen](./docs/screenshots/auth-page.png)

The interface uses a dark academic workspace with warm charcoal panels and amber actions for important controls and progress indicators.

### Dashboard, practice, and viva workspace

The application includes:

- A dashboard for syllabus progress, exam history, XP, streaks, and leaderboard status.
- A dedicated practice workspace for MCQ and short-answer sessions.
- An AI viva workspace with question configuration, examiner personas, timer controls, answer submission, and review feedback.

> Screenshots should be refreshed as the authenticated dashboard and viva flows are updated.

## Main technology

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth and PostgreSQL
- Gemini-powered question generation

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
GEMINI_API_KEY=your-server-side-gemini-key
```

Never commit database passwords, Supabase service-role keys, authentication tokens, or Gemini secrets.

## Supabase database

The database migrations are in [`supabase/migrations`](./supabase/migrations). Apply them in order in a development Supabase project.

The current migration history includes:

1. Profiles and authentication security
2. Question storage
3. Secure quiz and exam attempts
4. Viva rubric snapshots — currently under migration review

There are two competing version-004 migration files in the repository. Do not apply both until the migration history is consolidated and each migration has a unique version.

## Useful commands

```bash
npm run lint
npm run build
```

## Project status

The authentication flow, course question banks, MCQ/short-answer practice, AI question persistence, and server-backed assessment foundations are implemented. The next backend work is to finalize the version-004 viva migration, derive all dashboard metrics from persisted activity, and complete live Supabase/RLS verification.
