# Baqi API — Phase 1

Backend core for `baqi.thikr.tech` (Node.js + Express + TypeScript + Prisma + Bull).

## Implemented in this phase

- TypeScript API scaffold with strict mode
- Prisma schema for Store, Subscription, RecoveryLog, DiscountCode
- `GET /api/health` health endpoint
- Salla OAuth callback: `GET /api/auth/salla/callback`
- Salla webhook endpoint with HMAC validation: `POST /api/webhook/salla/:storeId`
- Bull queue with delayed, retried, deduplicated jobs (`jobId: recovery-{cartId}`)
- Recovery worker flow (active store check, cart conversion check, salah delay, discount generation, WhatsApp send, log update)
- WhatsApp session manager with persistent LocalAuth path `/data/whatsapp-sessions`
- WebSocket QR stream endpoint: `/api/ws?storeId=<id>`

## Quick start

1. Copy env file:

```bash
copy .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run migration (requires PostgreSQL running and DATABASE_URL set):

```bash
npm run prisma:migrate -- --name init
```

5. Start API and worker in separate terminals:

```bash
npm run dev
npm run worker
```

## Verification scripts

You can run quick checks against a running local API:

```bash
npm run verify:basic
```

This verifies:
- `GET /api/health`
- `GET /api/whatsapp/health`
- `GET /api/admin/sessions`
- invalid Moyasar webhook request path returns expected validation error

For signed webhook checks:

```bash
npm run verify:webhooks
```

Optional env vars used by signed checks:
- `API_BASE_URL` (default: `http://localhost:3001`)
- `SALLA_WEBHOOK_SECRET` (required for Salla signed check)
- `SALLA_TEST_STORE_ID` (default: `test-store`)
- `MOYASAR_API_KEY` (required for Moyasar signed check)

If signing secrets are not set, the script will skip those checks gracefully.
