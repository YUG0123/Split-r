# Splitr

A full-stack expense-splitting app (Splitwise-style) with real-time balances, group expense tracking, recurring expenses, minimum-transaction debt settlement, and AI-powered receipt scanning and spending insights.

**Live demo:** https://split-r-phi.vercel.app

---

## Features

- Create groups, add expenses, and split them equally, by percentage, or by exact amount
- Real-time balance tracking per group and between individual users (via Convex)
- Direct one-on-one expense tracking outside of groups
- Recurring expenses (weekly/monthly) that auto-generate on schedule via a daily cron job
- Minimum-transaction debt settlement — computes net balances per group and suggests the fewest payments needed to settle everyone up, rather than tracking every pairwise debt individually
- Settlement recording to clear outstanding balances, including one-click recording of suggested settlements
- Receipt scanning — upload a photo of a receipt and Gemini Vision prefills the description, amount, date, and category
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
| AI             | Google Gemini (`@google/generative-ai`) — chat + vision |
| Email          | Resend                               |
| UI             | Tailwind CSS + shadcn/ui + Radix     |
| Forms/validation | react-hook-form + zod              |
| Testing        | Vitest (unit tests on debt-simplification and validation logic) |

### Why Convex instead of a traditional REST API + Postgres?

Convex gives real-time subscriptions out of the box (dashboard balances update live across clients without manual polling or websocket wiring), colocates schema + query + mutation logic in one place, and its query builder makes indexed access patterns explicit rather than something bolted on with an ORM later.

### Why a greedy algorithm for debt settlement?

True minimum-transaction debt settlement is NP-hard in the general case. `simplifyDebts` (in `convex/lib/debtSimplification.js`) uses a greedy approach instead — repeatedly matching the largest creditor with the largest debtor — which is well-known, easy to reason about, and close to optimal in practice. Covered by unit tests in `convex/tests/debtSimplification.test.js`, including a case showing a 3-person debt chain collapse from 3 pairwise debts to 1 real transaction.

## Architecture (high level)

```
Client (Next.js) ──▶ Convex queries/mutations ──▶ Convex DB
        │                                              ▲
        │                                              │
        └──▶ Clerk (auth) ──────────────────────────────
        
Inngest (cron) ──▶ Convex (public functions, see convex/inngest.js) ──▶ Convex DB
        │
        └──▶ Gemini (spending insights, recurring expenses) / Resend (email)

Client ──▶ /api/receipt-scan (Next.js route) ──▶ Gemini Vision ──▶ prefilled expense form
```

Expenses and settlements are stored per-group (or ungrouped, for direct expenses between two users). Balances are computed on read from the raw expense/settlement records rather than stored as a running total, so they're always consistent with the underlying data.

Inngest cron jobs call Convex through **public** functions (not `internal.*`) — Convex's HTTP client, which Inngest uses, can only invoke public functions; internal functions are reserved for calls between Convex functions themselves.

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

### Running tests

```bash
npx vitest run
```

### Environment variables

See `.env.example` for the full list. At minimum you need Convex + Clerk keys to run the app; Gemini/Resend keys are only needed for the AI insights, receipt scanning, and email-reminder features.

## Project structure

```
app/(main)/          – authenticated app routes (dashboard, groups, expenses, settlements)
app/api/              – API routes (Inngest webhook, receipt-scan)
convex/              – Convex schema, queries, mutations
convex/lib/          – pure, unit-testable business logic (debt simplification, date math, validation)
convex/tests/        – Vitest unit tests
lib/inngest/         – scheduled jobs (payment reminders, spending insights, recurring expenses)
components/          – shared UI components (shadcn/ui based)
```

## Known limitations / roadmap

- Debt simplification runs per-group; a global settlement plan across all of a user's groups at once isn't implemented
- Receipt scanning works on single-item/total receipts; itemized line-item splitting isn't extracted yet
- No end-to-end (Playwright/Cypress) tests — current test coverage is unit-level on pure business logic only

## License

MIT — see [LICENSE](./LICENSE)