# Concentrix Bot

Two-in-one AI demo for the Concentrix case study:

1. **PDF Chatbot** — upload a PDF, ask questions, get answers with source citations.
2. **WhatsApp Campaign Dashboard** — KPI cards, charts, and an LLM-generated plain-English performance summary.

Plus a small **Admin Panel** for document management, chat logs, campaign ingestion (manual / CSV / webhook), and model settings.

## Stack

- **Next.js 16** (App Router) on Vercel
- **Supabase** — Postgres + pgvector + Storage
- **Gemini 2.5 Flash** for chat + summary, `gemini-embedding-001` for embeddings
- **Tailwind v4**, Recharts, lucide

All free-tier compatible.

## Quick start

```bash
# 1. Install
npm install

# 2. Create a Supabase project, run supabase/schema.sql in the SQL editor.

# 3. Copy env and fill in keys
cp .env.example .env.local

# 4. Run
npm run dev
```

Open <http://localhost:3000>.

## Routes

| Path | What |
| --- | --- |
| `/chatbot` | Task 1 — chat over uploaded PDFs |
| `/dashboard` | Task 2 — campaign KPIs + AI summary |
| `/admin` | Documents, chat logs, campaigns, settings |

## Architecture

```
PDF upload → pdf-parse → chunk → Gemini embed → Supabase pgvector
Question  → embed → match_chunks RPC → Gemini answer + citations → chat_logs
Campaigns → manual / CSV / webhook → Supabase → Recharts + Gemini summary
```

## Deploy

Push to GitHub, import in Vercel, add the same env vars. Supabase + Gemini stay free.
