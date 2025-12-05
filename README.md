# State of Code AI 🤖

A developer survey platform exploring how developers use AI coding agents, built with a unique terminal-styled interface. Collect, analyze, and publish annual surveys on AI-powered development tools.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-green?style=flat-square)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=flat-square)

## ✨ Features

- **Terminal-Style UI** — Retro terminal interface with ASCII art, keyboard navigation, and a developer-focused aesthetic
- **Local-First Architecture** — Answers are saved locally first, then synced to the server for a seamless offline-friendly experience
- **Keyboard Navigation** — Full vim-style keyboard support (`j/k`, `h/l`, number keys, shortcuts)
- **Matrix Question Views** — Specialized UI for rating multiple AI tools efficiently
- **Anonymous Sessions** — Token-based anonymous survey sessions with IP tracking for duplicate prevention
- **Dynamic Question Logic** — Skip conditions to show/hide questions based on previous answers
- **Email Subscriptions** — Collect emails to notify participants when results are published
- **Multi-Category Surveys** — Organized sections covering AI IDEs, Extensions, Autonomous Agents, App Builders, and more

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **UI** | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Database** | [Neon](https://neon.tech/) (Serverless PostgreSQL) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) |
| **Language** | TypeScript 5 |

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── [year]/survey/            # Dynamic survey pages by year
│   ├── api/                      # API routes
│   │   ├── responses/            # Save individual/batch responses
│   │   ├── sessions/             # Session management & completion
│   │   ├── subscribe/            # Email subscription
│   │   └── surveys/[year]/       # Fetch survey data by year
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage (redirects to current survey)
├── components/                   # React components
│   ├── TerminalSurvey.tsx        # Main terminal-style survey component
│   ├── SurveyHeader.tsx          # Survey header
│   ├── SurveyIntro.tsx           # Introduction section
│   └── ...                       # Other UI components
├── data/
│   └── surveyQuestions.ts        # Survey question definitions
├── db/
│   ├── schema.ts                 # Drizzle database schema
│   ├── index.ts                  # Database connection
│   ├── seed.ts                   # Database seeding script
│   └── migrate-*.ts              # Migration scripts
├── hooks/
│   ├── useSurvey.ts              # Server-first survey hook
│   └── useLocalFirstSurvey.ts    # Local-first survey hook
└── lib/
    └── survey-types.ts           # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- A [Neon](https://neon.tech/) PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/socai.git
   cd socai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
   ```

4. **Set up the database**
   ```bash
   # Generate migrations from schema
   npm run db:generate
   
   # Apply migrations to database
   npm run db:migrate
   
   # Seed initial survey data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 📊 Database Schema

The database consists of the following main tables:

| Table | Description |
|-------|-------------|
| `surveys` | Survey definitions with year, title, status (draft/open/closed) |
| `categories` | Question categories (About You, AI IDEs, Extensions, etc.) |
| `questions` | Individual questions with type, options, and skip conditions |
| `survey_questions` | Join table linking surveys to questions |
| `sessions` | Anonymous respondent sessions with tokens |
| `responses` | Individual question responses |
| `email_subscriptions` | Email subscribers for result notifications |

### Question Types

- **single** — Single-choice selection
- **multiple** — Multiple-choice selection  
- **scale** — Numeric scale (e.g., 1-5 satisfaction)
- **text** — Free-form text input

## 🔌 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/surveys/[year]` | GET | Fetch survey data with questions |
| `/api/sessions` | GET | Get session by token |
| `/api/sessions` | POST | Create new anonymous session |
| `/api/sessions/complete` | POST | Mark session as completed |
| `/api/responses` | POST | Save individual response |
| `/api/responses/batch` | POST | Save multiple responses at once |
| `/api/subscribe` | POST | Subscribe email for notifications |

## ⌨️ Keyboard Shortcuts

The terminal survey supports full keyboard navigation:

| Key | Action |
|-----|--------|
| `↑` / `k` | Move up |
| `↓` / `j` | Move down |
| `←` / `h` | Move left (matrix view) |
| `→` / `l` | Move right (matrix view) |
| `1-9`, `0`, `a-z` | Quick select option |
| `Space` | Toggle selection (multiple choice) |
| `Enter` | Submit answer |
| `s` | Skip question |
| `b` / `Backspace` | Go back |
| `[` / `]` | Previous/next category tab |
| `⌥1-9` | Jump to category tab |

## 🧪 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Apply migrations
npm run db:push          # Push schema changes (dev)
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed database

# Data migrations
npm run db:migrate-about-you       # Add about you questions
npm run db:migrate-ai-tools        # Add AI tools questions
npm run db:migrate-ai-sections     # Add AI sections
npm run db:add-ai-models           # Add AI models questions
npm run db:consolidate-ai-tools    # Consolidate AI tool categories
```

## 🎨 Survey Categories

The 2025 survey covers:

1. **About You** — Demographics, experience, role, location
2. **AI IDEs** — Cursor, Windsurf, Zed, Antigravity, Kiro
3. **Extensions** — GitHub Copilot, Cline, Augment Code, Amazon Q
4. **Autonomous Agents** — Claude Code, Codex, Devin, Jules, OpenHands
5. **App Builders** — Replit, Lovable, Bolt.new, v0

Each category includes:
- Usage/awareness questions for each tool
- Satisfaction scale (1-5)
- Pain points feedback
- "Other" free-text option

## 🏗 Architecture

### Local-First Approach

The survey uses a local-first architecture for optimal user experience:

1. **Answers saved to localStorage immediately** — No waiting for network
2. **Session token persisted locally** — Resume anytime
3. **Batch submission on completion** — All answers sent at once
4. **Merge strategy** — Local changes take precedence over server

### Session Management

- Anonymous sessions identified by random 64-character tokens
- Sessions track: start time, completion status, last activity
- IP address stored for duplicate prevention
- Sessions can be resumed across browser sessions

## 📝 Adding New Questions

1. Add question definitions in `src/data/surveyQuestions.ts`
2. Create a migration script in `src/db/migrate-*.ts`
3. Run the migration: `npx tsx src/db/migrate-*.ts`
4. Questions are automatically linked to the survey

## 🚢 Deployment

The easiest way to deploy is with [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your `DATABASE_URL` environment variable
4. Deploy!

For other platforms, ensure:
- Node.js 18+ runtime
- Environment variables are set
- Database is accessible from deployment region

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Built with ❤️ for the developer community
  <br>
  <a href="https://stateofcode.ai">stateofcode.ai</a>
</p>
