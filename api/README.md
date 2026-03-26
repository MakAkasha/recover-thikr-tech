# Recover API — Phase 1

Backend core for `recover.thikr.tech` (Node.js + Express + TypeScript + Prisma + Bull).

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
