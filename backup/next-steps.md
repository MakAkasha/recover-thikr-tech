# next-steps.md — Baqi.thikr.tech
> Post-build action plan. Work through this top to bottom. Each section is a self-contained task.

---

## Status Summary

Cline scaffolded the full project structure:
- `api/` — Node.js + TypeScript backend (webhook, queue, whatsapp-web.js)
- `dashboard/` — Next.js 14 frontend
- `docker-compose.yml` — full stack (api, dashboard, postgres, redis)
- Language breakdown: TypeScript 96.9% ✅

What this doc covers: everything between "code exists" and "paying customers".

---

## PHASE 1 — Local Verification (do this before touching the VPS)

### 1.1 Create your `.env` file

The repo has `.env.example` but no `.env`. Create it locally first:

```bash
cp .env.example .env
```

Fill in every variable. For local dev use these placeholder values:

```env
NODE_ENV=development
API_PORT=3001
DASHBOARD_PORT=3000
API_URL=http://localhost:3001
DASHBOARD_URL=http://localhost:3000

DATABASE_URL=postgresql://Baqi:localpass@postgres:5432/Baqi
REDIS_URL=redis://redis:6379

SALLA_CLIENT_ID=FILL_LATER
SALLA_CLIENT_SECRET=FILL_LATER
SALLA_WEBHOOK_SECRET=any-random-string-for-local-testing

MOYASAR_API_KEY=FILL_LATER
MOYASAR_PUBLIC_KEY=FILL_LATER

EMAIL_SERVER=smtp://test@test.com:password@localhost:1025
EMAIL_FROM=noreply@thikr.tech

NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

POSTGRES_PASSWORD=localpass
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

### 1.2 Run the full stack locally with Docker

```bash
cd Baqi
docker compose up --build
```

Expected: all 4 containers start (api, dashboard, postgres, redis). Check:
- `http://localhost:3000` — dashboard loads
- `http://localhost:3001/api/health` — returns `{ status: "ok" }`

If api crashes on startup, check logs:
```bash
docker compose logs api --tail=50
```

---

### 1.3 Run Prisma migrations

```bash
docker compose exec api npx prisma migrate dev --name init
docker compose exec api npx prisma generate
```

Verify DB schema was created:
```bash
docker compose exec postgres psql -U Baqi -d Baqi -c "\dt"
```

You should see: `stores`, `subscriptions`, `recovery_logs`, `discount_codes` tables.

---

### 1.4 Test the webhook endpoint locally

Use `curl` to simulate a Salla abandoned cart webhook. First generate a valid HMAC signature:

```bash
# Generate test HMAC (replace YOUR_WEBHOOK_SECRET with value from .env)
echo -n '{"event":"abandoned.cart","merchant":12345,"data":{"id":"cart_test_001","customer":{"id":1,"first_name":"محمد","last_name":"العمري","mobile":"+966501234567","email":"test@test.com"},"items":[{"id":1,"name":"حذاء رياضي","quantity":1,"price":299.00}],"total":299.00,"currency":"SAR"}}' | openssl dgst -sha256 -hmac "YOUR_WEBHOOK_SECRET"
```

Then fire the webhook:
```bash
curl -X POST http://localhost:3001/api/webhook/salla/TEST_STORE_ID \
  -H "Content-Type: application/json" \
  -H "x-salla-signature: HMAC_VALUE_FROM_ABOVE" \
  -d '{"event":"abandoned.cart","merchant":12345,"data":{"id":"cart_test_001","customer":{"id":1,"first_name":"محمد","last_name":"العمري","mobile":"+966501234567","email":"test@test.com"},"items":[{"id":1,"name":"حذاء رياضي","quantity":1,"price":299.00}],"total":299.00,"currency":"SAR"}}'
```

Expected: `201` response, job appears in Bull queue.

---

### 1.5 Test WhatsApp QR flow

- Open `http://localhost:3000/dashboard/connect`
- Complete the WhatsApp QR step — scan with your personal WhatsApp to verify the session initializes
- Check that `data/whatsapp-sessions/` gets populated after scan
- Verify `store.whatsappConnected = true` in DB

---

### 1.6 Review generated code — things to verify manually

Go through these files and confirm Cline implemented them correctly. Fix anything missing before deploying.

**`api/src/middleware/validateWebhook.ts`**
- [ ] HMAC-SHA256 validation uses `crypto.timingSafeEqual` (not `===`) to prevent timing attacks
- [ ] Returns `401` on invalid signature, not `400`
- [ ] Raw body is used for HMAC (not parsed JSON — use `express.raw()` for this route)

**`api/src/workers/recovery.worker.ts`**
- [ ] Checks `store.isActive` before sending
- [ ] Calls Salla API to verify cart is still abandoned before sending
- [ ] Calls `checkSalahTime()` and delays job by 15 min if true
- [ ] Generates unique discount code before sending
- [ ] Updates `RecoveryLog.status` to `sent` after success
- [ ] Updates `RecoveryLog.status` to `failed` on error (don't silently swallow exceptions)

**`api/src/services/whatsapp.ts`**
- [ ] Puppeteer args include `--no-sandbox` and `--disable-setuid-sandbox`
- [ ] Session `dataPath` points to `/data/whatsapp-sessions` (must match Docker volume mount)
- [ ] `disconnected` event updates DB and removes session from the in-memory map
- [ ] Phone number formatting: strips `+`, appends `@c.us`

**`api/src/utils/messages.ts`**
- [ ] Arabic message is RTL — no Latin characters mixed in awkwardly
- [ ] Discount code is bold in WhatsApp (wrap in `*CODE*`)
- [ ] Cart items list is formatted clearly with price in SAR
- [ ] Message includes a time pressure line ("الكود صالح 24 ساعة فقط")

**`dashboard/src/app/dashboard/connect/page.tsx`**
- [ ] QR code displays via WebSocket, not polling
- [ ] QR refreshes automatically if it expires (whatsapp-web.js fires a new `qr` event)
- [ ] Shows "Connected ✓" state after successful scan with the connected number visible

**`docker-compose.yml`**
- [ ] `api` service mounts `./data/whatsapp-sessions:/data/whatsapp-sessions`
- [ ] `postgres` and `redis` are on `Baqi-internal` network only (not exposed to `thikr-proxy`)
- [ ] `api` and `dashboard` are on both `thikr-proxy` and `Baqi-internal`
- [ ] All containers have `restart: always`

---

## PHASE 2 — Salla Developer Account Setup

### 2.1 Create a Salla Partner App

1. Go to https://salla.partners and create an account
2. Create a new app — type: **Public App** (so any store can install it)
3. App settings:
   - **OAuth Redirect URI**: `https://Baqi.thikr.tech/api/auth/salla/callback`
   - **Scopes**: `offline_access`, `orders.read`, `products.read`, `webhooks.write`
   - **Webhook events**: `abandoned.cart`
4. Copy `Client ID` and `Client Secret` into your `.env`
5. Set a strong random string for `SALLA_WEBHOOK_SECRET` — same value in your Salla app settings and `.env`

### 2.2 Test Salla OAuth locally with ngrok

Salla OAuth requires a public HTTPS URL even for testing. Use ngrok:

```bash
# Install ngrok, then:
ngrok http 3001
```

Temporarily set `API_URL` in `.env` to the ngrok HTTPS URL, test the full OAuth flow end-to-end, then revert before deploying to VPS.

---

## PHASE 3 — VPS Deployment

### 3.1 Clone repo on VPS

```bash
ssh mak@YOUR_VPS_IP
cd /home/mak/thikr/tools
git clone https://github.com/MakAkasha/Baqi-thikr-tech Baqi
cd Baqi
```

### 3.2 Create production `.env`

```bash
cp .env.example .env
nano .env
```

Key differences from local `.env`:
- `NODE_ENV=production`
- `API_URL=https://Baqi.thikr.tech/api`
- `DASHBOARD_URL=https://Baqi.thikr.tech`
- `NEXTAUTH_URL=https://Baqi.thikr.tech`
- Use strong random passwords for `POSTGRES_PASSWORD` (min 32 chars)

### 3.3 Add DNS A record

In Hostinger DNS panel:
```
A    Baqi    →    YOUR_VPS_IP    TTL: 300
```

Verify propagation:
```bash
dig Baqi.thikr.tech +short
```

### 3.4 Set up Nginx for Baqi.thikr.tech

```bash
sudo nano /etc/nginx/sites-available/Baqi.thikr.tech
```

Paste:
```nginx
server {
    listen 80;
    server_name Baqi.thikr.tech;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name Baqi.thikr.tech;

    ssl_certificate /etc/letsencrypt/live/Baqi.thikr.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/Baqi.thikr.tech/privkey.pem;

    # Dashboard
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (WhatsApp QR streaming)
    location /api/ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
```

Enable and get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/Baqi.thikr.tech /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx -d Baqi.thikr.tech
sudo nginx -s reload
```

### 3.5 Build and start on VPS

```bash
cd /home/mak/thikr/tools/Baqi
docker compose up --build -d
```

Run migrations:
```bash
docker compose exec api npx prisma migrate deploy
```

Verify all containers are running:
```bash
docker compose ps
docker compose logs --tail=30
```

Verify live:
- `https://Baqi.thikr.tech` — dashboard loads
- `https://Baqi.thikr.tech/api/health` — returns `{ status: "ok" }`

---

## PHASE 4 — Moyasar Payment Integration

### 4.1 Create Moyasar account

1. Go to https://moyasar.com — sign up for a business account
2. Complete KYC (requires Saudi CR number or Iqama)
3. Get API keys from Moyasar dashboard — use **test keys** first
4. Add to `.env`: `MOYASAR_API_KEY` and `MOYASAR_PUBLIC_KEY`

### 4.2 Verify subscription webhook handler exists

Moyasar sends a webhook when payment succeeds. Confirm this route is in `api/src/routes/`:

```typescript
// POST /api/payments/moyasar/webhook
// Must:
// 1. Verify Moyasar webhook signature
// 2. Find store by moyasarCustId
// 3. Set subscription.status = 'active'
// 4. Set store.isActive = true
// 5. Set subscription.currentPeriodEnd = now + 30 days
```

If Cline didn't build this route, add it before going live — without it, paid stores won't be activated automatically.

### 4.3 Pricing to configure in Moyasar

| Plan | Price | Arabic Label |
|------|-------|--------------|
| Starter | 99 SAR/month | باقة البداية — حتى 500 رسالة |
| Pro | 249 SAR/month | الباقة الاحترافية — رسائل غير محدودة |

---

## PHASE 5 — Pre-Launch Checklist

### Security
- [ ] `SALLA_WEBHOOK_SECRET` is a strong random string (min 32 chars)
- [ ] Postgres is NOT exposed on a public port (internal network only)
- [ ] Redis is NOT exposed on a public port (internal network only)
- [ ] `.env` is in `.gitignore` and was never committed — verify: `git log --all --full-history -- .env`
- [ ] API rate limiting active on webhook endpoint (recommended: max 100 req/min per IP)
- [ ] Webhook HMAC uses `crypto.timingSafeEqual` not `===`

### Reliability
- [ ] Bull queue has retry logic (3 attempts, exponential backoff)
- [ ] WhatsApp session reconnects automatically on disconnect
- [ ] Salla token refresh is implemented (tokens expire every 14 days)
- [ ] Docker containers all have `restart: always`
- [ ] Postgres data persists across `docker compose down` (named volume or bind mount)

### Arabic / UX
- [ ] All dashboard pages render correctly RTL (test in Chrome with Arabic locale)
- [ ] Message preview in template editor shows exactly what WhatsApp will display
- [ ] Discount code is bold (`*CODE*`) and clearly visible
- [ ] Consistent number formatting throughout (pick either Eastern Arabic numerals ٢٩٩ or Western 299 — don't mix)

### Legal — Saudi PDPL
- [ ] Privacy policy page exists at `Baqi.thikr.tech/privacy`
- [ ] Customer phone numbers are not logged in plaintext in application logs
- [ ] Data retention: `RecoveryLog` records auto-delete after 90 days (add a cron job)
- [ ] Store owner onboarding includes a note that they are responsible for obtaining customer consent

---

## PHASE 6 — First Customer Acquisition

### 6.1 Submit to Salla App Store

This is the highest-leverage distribution channel. Store owners browse it actively when looking for tools.

Required for submission:
- App icon (512×512 PNG)
- Screenshots of the dashboard in Arabic
- Short description in Arabic (max 150 chars)
- Long description explaining the value
- Privacy policy URL (`Baqi.thikr.tech/privacy`)
- Support email

Suggested short description:
> "استرجع عربات التسوق المتروكة تلقائياً عبر واتساب وزد مبيعاتك بدون جهد"

### 6.2 Find beta customers

Target: Salla store owners with 50–500 orders/month. They feel the pain of abandoned carts but don't have developers to solve it.

Where to find them:
- **X (Twitter)**: Search `متجر سلة` — store owners complain about lost sales regularly
- **Telegram**: سلة للتجار، ريادة الأعمال السعودية
- **LinkedIn**: Saudi e-commerce managers and store owners

Offer the first 10 stores a **free 60-day trial** in exchange for honest feedback and a testimonial. Set `trialEndsAt = now + 60 days` manually in the DB for these accounts.

### 6.3 Track these metrics from day one

| Metric | How to calculate |
|--------|-----------------|
| Recovery Rate | Logs with `status = recovered` ÷ total `status = sent` |
| Revenue Recovered | Sum of `recoveredValue` where `status = recovered` |
| Avg Recovery Time | Average of `recoveredAt - sentAt` |
| Messages Sent This Month | Count of `sent` logs in current month |

Show "Revenue Recovered" prominently on the dashboard — a store recovering 5% of abandoned carts at 300 SAR average order is a clear, tangible number that sells itself.

---

## PHASE 7 — Ongoing Maintenance

### Salla token refresh — critical, don't skip

Salla access tokens expire every 14 days. Without refresh logic, connected stores will silently stop working. Add a daily cron job in the API:

```typescript
// node-cron — runs at 3am daily
cron.schedule('0 3 * * *', async () => {
  const stores = await prisma.store.findMany({ where: { isActive: true } });
  for (const store of stores) {
    try {
      const newTokens = await sallaService.refreshToken(store.sallaRefreshToken);
      await prisma.store.update({
        where: { id: store.id },
        data: {
          sallaAccessToken: newTokens.access_token,
          sallaRefreshToken: newTokens.refresh_token
        }
      });
    } catch {
      // Token invalid — store needs to reconnect
      await prisma.store.update({
        where: { id: store.id },
        data: { isActive: false }
      });
      // TODO: send reconnect email to store owner
    }
  }
});
```

### WhatsApp session health

Add an internal health endpoint so you can monitor session status:
```
GET /api/admin/sessions
→ [{ storeId, connected, number, lastSeen }]
```

### Daily database backups

Add to VPS crontab (`crontab -e`):
```bash
0 2 * * * docker compose -f /home/mak/thikr/tools/Baqi/docker-compose.yml exec -T postgres pg_dump -U Baqi Baqi > /home/mak/backups/Baqi-$(date +\%Y\%m\%d).sql
# Keep last 30 days
find /home/mak/backups -name "Baqi-*.sql" -mtime +30 -delete
```

---

## Quick Reference — Useful Commands

```bash
# Navigate to project on VPS
cd /home/mak/thikr/tools/Baqi

# View all logs live
docker compose logs -f

# View only API logs
docker compose logs api -f --tail=100

# Restart a single service
docker compose restart api

# Pull latest code and redeploy
git pull && docker compose up --build -d

# Run a Prisma migration after schema change
docker compose exec api npx prisma migrate deploy

# Open Postgres shell
docker compose exec postgres psql -U Baqi -d Baqi

# Check Bull queue depth
docker compose exec redis redis-cli LLEN bull:cart-recovery:wait

# Force-remove a stuck WhatsApp session and restart
docker compose exec api rm -rf /data/whatsapp-sessions/STORE_ID
docker compose restart api
```

---

## Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WhatsApp bans the number | High — all messages stop | Use a dedicated WhatsApp Business number per store, not personal. Set a daily send cap (200 msg/day). Educate store owners. |
| Salla changes webhook payload schema | Medium — jobs break silently | Log the raw webhook body in `RecoveryLog`. Add payload version detection. |
| whatsapp-web.js breaks after a WA update | Medium — all sends fail | Pin to a specific package version. Monitor the repo's GitHub issues. Have a fallback plan (Twilio or 360dialog API). |
| Store owner sends bulk spam | High — WA ban + legal liability | Hard cap: 200 messages/day/store. Full send log. ToS clause making store owner responsible for consent. |
| Puppeteer memory leak over time | Medium — API container OOMs | Set `mem_limit: 1g` in docker-compose for the api service. Monitor with `docker stats`. |
| Concurrent duplicate webhooks (same cart fired twice) | Low — duplicate messages to customer | Bull `jobId: recovery-{cartId}` prevents this — verify this is in place. |

---

*Last updated: March 2026. Review again after first 10 paying stores.*
