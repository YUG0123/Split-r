# Splitr

A full-stack expense-splitting app (Splitwise-style) with real-time balances, group expense tracking, and AI-generated spending insights.

**Live demo:** _add your deployed Vercel URL here_

---

## Features

- Create groups, add expenses, and split them equally, by percentage, or by exact amount
- Real-time balance tracking per group and between individual users (via Convex)
- Direct one-on-one expense tracking outside of groups
- Settlement recording to clear outstanding balances
- AI-generated spending insight summaries (Gemini)
- Scheduled payment reminder emails (Inngest + Resend)
- Auth via Clerk

## Tech stack

| Layer          | Choice                              |
|----------------|--------------------------------------|
| Framework      | Next.js 16 (App Router)              |
| Backend/DB     | Convex (real-time serverless functions + DB) |
| Auth           | Clerk                                |
| Background jobs / cron | Inngest                      |
| AI             | Google Gemini (`@google/generative-ai`) |
| Email          | Resend                               |
| UI             | Tailwind CSS + shadcn/ui + Radix     |
| Forms/validation | react-hook-form + zod              |

### Why Convex instead of a traditional REST API + Postgres?

Convex gives real-time subscriptions out of the box (dashboard balances update live across clients without manual polling or websocket wiring), colocates schema + query + mutation logic in one place, and its query builder makes indexed access patterns explicit rather than something bolted on with an ORM later.

## Architecture (high level)

```
Client (Next.js) ──▶ Convex queries/mutations ──▶ Convex DB
        │                                              ▲
        │                                              │
        └──▶ Clerk (auth) ──────────────────────────────
        
Inngest (cron) ──▶ Convex HTTP client ──▶ Convex mutations
        │
        └──▶ Gemini (spending insights) / Resend (email)
```

Expenses and settlements are stored per-group (or ungrouped, for direct expenses between two users). Balances are computed on read from the raw expense/settlement records rather than stored as a running total, so they're always consistent with the underlying data.

## Getting started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account
- A [Google AI Studio](https://aistudio.google.com) API key (for Gemini)
- A [Resend](https://resend.com) API key
- An [Inngest](https://inngest.com) account (for local dev, the Inngest CLI)

### Setup

```bash
git clone https://github.com/YUG0123/Split-r.git
cd Split-r
npm install
cp .env.example .env.local   # then fill in the values, see below
npx convex dev                # first run will link/create your Convex deployment
npm run dev
```

In a separate terminal, run the Inngest dev server if you want to test scheduled jobs locally:

```bash
npx inngest-cli@latest dev
```

App runs at `http://localhost:3000`.

### Environment variables

See `.env.example` for the full list. At minimum you need Convex + Clerk keys to run the app; Gemini/Resend keys are only needed for the AI insights and email-reminder features.

## Project structure

```
app/(main)/          – authenticated app routes (dashboard, groups, expenses, settlements)
convex/              – Convex schema, queries, and mutations
lib/inngest/         – scheduled jobs (payment reminders, spending insights)
components/          – shared UI components (shadcn/ui based)
```

## Known limitations / roadmap

- Debt settlement across groups isn't globally minimized yet (per-group netting only)
- No recurring-expense support yet
- No automated test suite yet

## License

MIT — see [LICENSE](./LICENSE)
