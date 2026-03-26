# Recover Dashboard — Phase 2

Next.js 14 dashboard for store onboarding, stats, messages, and billing.

## Implemented

- Arabic RTL landing page (`/`)
- Dashboard overview (`/dashboard`)
- Connect wizard (`/dashboard/connect`) with QR WebSocket component
- Message template editor + live preview (`/dashboard/messages`)
- Billing UI (`/dashboard/billing`)
- NextAuth endpoint (`/api/auth/[...nextauth]`)
- Dashboard API route (`/api/dashboard`)

## Run locally

```bash
copy .env.example .env
npm install
npm run dev
```
