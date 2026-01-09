# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Danilo: Sales AI" is a sales CRM application for the Brandão Facial Institute that uses Google Gemini AI with RAG (Retrieval-Augmented Generation) to assist sales representatives. The app manages leads, tasks, and AI-powered conversations trained on sales playbooks and FAQs.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run Next.js linter
```

## Architecture

### Stack
- **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Neon serverless (`@neondatabase/serverless`)
- **AI**: Google Gemini 2.5 Flash with File Search (RAG)
- **Auth**: Clerk (`@clerk/nextjs`)
- **Deployment**: Vercel with Cron Jobs

### Key Directories
```
app/
├── api/              # Backend API routes
│   ├── ai/reply/     # Gemini AI response generation (saves messages to DB)
│   ├── cron/followups/ # Hourly automated follow-up task creation
│   ├── leads/        # Lead CRUD
│   ├── rag/          # RAG store create/upload
│   └── tasks/        # Task queries
├── layout.tsx        # Root layout with ClerkProvider
└── page.tsx          # Main dashboard (lead selection, chat, tasks)

components/           # React components (ChatInterface is the main chat UI)
services/             # Client-side service bridge (geminiService.ts)
lib/                  # Database connection (db.ts)
types.ts              # TypeScript interfaces (Lead, Task, RagStore, etc.)
```

### Data Flow Pattern
1. Frontend components call functions in `services/geminiService.ts`
2. Service functions make fetch requests to `/api/*` endpoints
3. API routes handle Gemini AI calls and PostgreSQL queries
4. API keys (Gemini) are kept server-side only

### Domain Model
- **Lead**: name, phone, specialty (Cirurgião Plástico|Dermatologista|Otorrino|Outro), stage (Descoberta|Consideração|Negociação|Fechamento), temperature (Frio|Morno|Quente)
- **Task**: lead_id, description, due_date, status, type (followup_24h|followup_72h|followup_7d|manual)
- **Messages**: lead_id, role (user|model), content

### RAG Integration
- RAG stores use Google Gemini's File Search feature
- Default store: `workspaces/default/stores/main`
- Documents uploaded via `/api/rag/upload` are stored in Gemini's file search system
- AI responses include grounding chunks showing source context

## Environment Variables

Required in `.env.local`:
```
GEMINI_API_KEY=       # Google Gemini API key (also aliased as API_KEY)
DATABASE_URL=         # Neon PostgreSQL connection string
NEXT_PUBLIC_CLERK_*   # Clerk authentication keys
```

## Cron Jobs

Configured in `vercel.json`:
- `/api/cron/followups` runs hourly to auto-generate follow-up tasks for leads in "Negociação" stage with no contact for 24+ hours

## Language Note

UI text and comments are primarily in Portuguese (Brazilian). Lead specialties, stages, and temperatures use Portuguese terms.
