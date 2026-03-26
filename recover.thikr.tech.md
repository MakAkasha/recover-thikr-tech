# recover.thikr.tech — Salla Abandoned Cart WhatsApp Recovery
> Full project reference for Cline. Read this entire file before writing any code.

---

## 1. Project Overview

**Product name:** Recover  
**Domain:** recover.thikr.tech  
**Purpose:** A SaaS tool for Saudi Salla store owners that automatically sends personalized Arabic WhatsApp messages to customers who abandon their carts, recovering lost revenue.  
**Target market:** Saudi e-commerce store owners on the Salla platform  
**Monetization:** Monthly subscription per store (via Moyasar)  
**Language:** All customer-facing copy is in Arabic (RTL). Admin/dashboard UI is bilingual AR/EN.

---

## 2. How It Works (End-to-End Flow)

```
1. Store owner signs up on recover.thikr.tech
2. They connect their Salla store via Salla OAuth
3. They scan a WhatsApp QR code to link their WhatsApp Business number
4. Recover registers a webhook on their Salla store for abandoned_cart events
5. When a customer abandons a cart:
   a. Salla fires a webhook to recover.thikr.tech/api/webhook/salla/:storeId
   b. API validates the webhook signature
   c. A Bull job is queued with a 1-hour delay
   d. After 1 hour, the worker checks Salla API — if order is now complete, cancel the job
   e. If still abandoned, whatsapp-web.js sends a personalized Arabic message
   f. Message includes customer name, cart items summary, and a time-sensitive discount code
   g. Delivery is logged to the database
6. Store owner views recovery stats on their dashboard
```

---

## 3. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| API server | Node.js + Express | Lightweight, good whatsapp-web.js support |
| Job queue | Bull + Redis | Delayed jobs, retries, job cancellation |
| Database | PostgreSQL | Relational data, subscriptions, logs |
| WhatsApp | whatsapp-web.js | Free, no Meta approval needed |
| Dashboard | Next.js 14 (App Router) | Fast, SSR, easy auth |
| Auth | NextAuth.js (magic link via email) | Simple for store owners |
| Payments | Moyasar | Saudi-native, supports mada + Visa |
| Styling | Tailwind CSS + shadcn/ui | Fast UI development |
| ORM | Prisma | Type-safe DB access |
| Container | Docker + Docker Compose | Matches VPS deployment setup |

---

## 4. Project Structure

```
recover/
├── docker-compose.yml
├── .env                          ← never commit this
├── .env.example
├── README.md
│
├── api/                          ← Node.js backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.ts              ← Express app entry
│       ├── config.ts             ← env vars & constants
│       ├── routes/
│       │   ├── webhook.ts        ← POST /webhook/salla/:storeId
│       │   ├── auth.ts           ← Salla OAuth callback
│       │   └── internal.ts       ← internal health/status endpoints
│       ├── services/
│       │   ├── salla.ts          ← Salla API client
│       │   ├── whatsapp.ts       ← whatsapp-web.js session manager
│       │   ├── queue.ts          ← Bull queue setup
│       │   └── discount.ts       ← discount code generator
│       ├── workers/
│       │   └── recovery.worker.ts ← processes queued jobs
│       ├── db/
│       │   └── client.ts         ← Prisma client singleton
│       ├── middleware/
│       │   └── validateWebhook.ts ← Salla HMAC signature check
│       └── utils/
│           ├── messages.ts       ← Arabic message templates
│           └── salahTimes.ts     ← prayer time awareness
│
├── dashboard/                    ← Next.js frontend
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx          ← landing/login page
│       │   ├── dashboard/
│       │   │   ├── page.tsx      ← stats overview
│       │   │   ├── connect/
│       │   │   │   └── page.tsx  ← Salla OAuth + WhatsApp QR
│       │   │   ├── messages/
│       │   │   │   └── page.tsx  ← message template editor
│       │   │   └── billing/
│       │   │       └── page.tsx  ← subscription management
│       │   └── api/
│       │       ├── auth/[...nextauth]/route.ts
│       │       └── dashboard/route.ts
│       └── components/
│           ├── QRScanner.tsx     ← whatsapp QR display
│           ├── StatsCards.tsx
│           └── MessagePreview.tsx ← Arabic RTL preview
│
└── data/                         ← Docker volumes (gitignored)
    ├── postgres/
    ├── redis/
    └── whatsapp-sessions/        ← persisted WA sessions
```

---

## 5. Database Schema (Prisma)

```prisma
// api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Store {
  id                String    @id @default(cuid())
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Salla integration
  sallaStoreId      String    @unique
  sallaAccessToken  String
  sallaRefreshToken String
  sallaStoreName    String
  sallaStoreUrl     String

  // Owner
  ownerEmail        String
  ownerName         String

  // WhatsApp session
  whatsappSessionId String?
  whatsappConnected Boolean   @default(false)
  whatsappNumber    String?

  // Settings
  delayMinutes      Int       @default(60)   // how long to wait before sending
  discountPercent   Int       @default(10)   // discount % to offer
  messageTemplate   String?                  // custom Arabic template, null = use default
  isActive          Boolean   @default(false) // false until subscription active

  // Relations
  subscription      Subscription?
  recoveryLogs      RecoveryLog[]
  discountCodes     DiscountCode[]
}

model Subscription {
  id              String    @id @default(cuid())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  storeId         String    @unique
  store           Store     @relation(fields: [storeId], references: [id])

  plan            String    @default("starter")  // starter | pro
  status          String    @default("trial")    // trial | active | cancelled | expired
  trialEndsAt     DateTime
  currentPeriodEnd DateTime?

  // Moyasar
  moyasarSubId    String?
  moyasarCustId   String?
}

model RecoveryLog {
  id              String    @id @default(cuid())
  createdAt       DateTime  @default(now())

  storeId         String
  store           Store     @relation(fields: [storeId], references: [id])

  // Cart info from Salla webhook
  sallaCartId     String
  sallaOrderId    String?
  customerName    String
  customerPhone   String
  cartValue       Float
  cartItems       Json      // array of {name, qty, price}

  // Job info
  bullJobId       String?
  scheduledFor    DateTime

  // Outcome
  status          String    @default("queued") // queued | sent | cancelled | failed | recovered
  sentAt          DateTime?
  recoveredAt     DateTime?
  recoveredValue  Float?

  discountCode    String?
}

model DiscountCode {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())

  storeId     String
  store       Store     @relation(fields: [storeId], references: [id])

  code        String    @unique
  percent     Int
  usedAt      DateTime?
  cartId      String?
}
```

---

## 6. Environment Variables

```env
# .env.example

# App
NODE_ENV=production
API_PORT=3001
DASHBOARD_PORT=3000
API_URL=https://recover.thikr.tech/api
DASHBOARD_URL=https://recover.thikr.tech

# Database
DATABASE_URL=postgresql://recover:CHANGE_ME@postgres:5432/recover

# Redis
REDIS_URL=redis://redis:6379

# Salla OAuth App
SALLA_CLIENT_ID=
SALLA_CLIENT_SECRET=
SALLA_WEBHOOK_SECRET=     ← used to validate incoming webhook HMAC

# Moyasar Payments
MOYASAR_API_KEY=
MOYASAR_PUBLIC_KEY=

# Email (magic link auth)
EMAIL_SERVER=smtp://user:pass@smtp.hostinger.com:587
EMAIL_FROM=noreply@thikr.tech

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://recover.thikr.tech

# Prayer times API (Aladhan - free)
ALADHAN_API_URL=https://api.aladhan.com/v1
```

---

## 7. Salla Webhook Integration

### Registering the webhook
After a store owner connects their Salla account via OAuth, call Salla API to register the webhook:

```
POST https://api.salla.dev/admin/v2/webhooks
Authorization: Bearer {sallaAccessToken}
{
  "name": "Recover - Abandoned Cart",
  "event": "abandoned.cart",
  "url": "https://recover.thikr.tech/api/webhook/salla/{storeId}",
  "secret": "{SALLA_WEBHOOK_SECRET}"
}
```

### Validating incoming webhooks
Salla signs every webhook with HMAC-SHA256. Validate before processing:

```typescript
// middleware/validateWebhook.ts
import crypto from 'crypto';

export function validateSallaWebhook(req, res, next) {
  const signature = req.headers['x-salla-signature'];
  const body = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', process.env.SALLA_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  next();
}
```

### Salla abandoned_cart webhook payload
```json
{
  "event": "abandoned.cart",
  "merchant": 12345,
  "data": {
    "id": "cart_abc123",
    "customer": {
      "id": 678,
      "first_name": "محمد",
      "last_name": "العمري",
      "mobile": "+966501234567",
      "email": "customer@example.com"
    },
    "items": [
      {
        "id": 1,
        "name": "حذاء رياضي نايك",
        "quantity": 1,
        "price": 299.00
      }
    ],
    "total": 299.00,
    "currency": "SAR",
    "created_at": "2024-01-15T14:30:00Z"
  }
}
```

---

## 8. Bull Queue — Job Flow

```typescript
// services/queue.ts
import Bull from 'bull';

export const recoveryQueue = new Bull('cart-recovery', {
  redis: process.env.REDIS_URL
});

// Adding a job (from webhook handler)
export async function scheduleRecovery(data: RecoveryJobData, delayMs: number) {
  return recoveryQueue.add(data, {
    delay: delayMs,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    jobId: `recovery-${data.cartId}` // unique — allows cancellation
  });
}

// Cancelling a job (if order completes before delay)
export async function cancelRecovery(cartId: string) {
  const job = await recoveryQueue.getJob(`recovery-${cartId}`);
  if (job) await job.remove();
}
```

```typescript
// workers/recovery.worker.ts
recoveryQueue.process(async (job) => {
  const { storeId, cartId, customerPhone, customerName, cartItems, cartValue } = job.data;

  // 1. Verify store is still active
  const store = await prisma.store.findUnique({ where: { id: storeId }, include: { subscription: true } });
  if (!store?.isActive) return { skipped: 'store_inactive' };

  // 2. Check if order was completed on Salla
  const isCompleted = await sallaService.isCartConverted(store.sallaAccessToken, cartId);
  if (isCompleted) {
    await prisma.recoveryLog.update({ where: { sallaCartId: cartId }, data: { status: 'cancelled' } });
    return { skipped: 'order_completed' };
  }

  // 3. Check prayer times — don't send during salah
  const isSalahTime = await checkSalahTime('Riyadh'); // use customer city if available
  if (isSalahTime) {
    await job.delay(15 * 60 * 1000); // retry in 15 min
    throw new Error('Salah time — delaying');
  }

  // 4. Generate discount code
  const discountCode = await generateDiscountCode(storeId, store.discountPercent);

  // 5. Build Arabic message
  const message = buildArabicMessage({ customerName, cartItems, cartValue, discountCode, discountPercent: store.discountPercent });

  // 6. Send via whatsapp-web.js
  await whatsappService.sendMessage(storeId, customerPhone, message);

  // 7. Log success
  await prisma.recoveryLog.update({
    where: { sallaCartId: cartId },
    data: { status: 'sent', sentAt: new Date(), discountCode }
  });
});
```

---

## 9. Arabic Message Templates

```typescript
// utils/messages.ts

export function buildArabicMessage({ customerName, cartItems, cartValue, discountCode, discountPercent }) {
  const itemsList = cartItems
    .map(item => `• ${item.name} (${item.quantity}x) — ${item.price} ر.س`)
    .join('\n');

  return `
السلام عليكم ${customerName} 👋

لاحظنا أنك تركت بعض المنتجات في سلة التسوق الخاصة بك 🛒

*المنتجات المتبقية:*
${itemsList}

*المجموع: ${cartValue} ر.س*

🎁 لأننا نقدّر تسوقك معنا، إليك كود خصم خاص:
*${discountCode}*
يمنحك خصم ${discountPercent}٪ على طلبك كاملاً

⏰ *الكود صالح لمدة 24 ساعة فقط*

أتمّ طلبك الآن وسنوصله إليك في أسرع وقت 🚀
  `.trim();
}

// Ramadan variant (detect Hijri month)
export function buildRamadanMessage({ customerName, cartItems, cartValue, discountCode, discountPercent, daysLeft }) {
  return `
رمضان كريم ${customerName} 🌙

${daysLeft > 0 ? `تبقى ${daysLeft} يوم على نهاية رمضان —` : ''} لا تفوّت فرصة إتمام طلبك!

...
  `.trim();
}
```

---

## 10. Prayer Time Awareness

Use the free Aladhan API to check if current time falls within a prayer window (±15 min):

```typescript
// utils/salahTimes.ts
import axios from 'axios';

export async function checkSalahTime(city: string = 'Riyadh'): Promise<boolean> {
  const today = new Date();
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

  const { data } = await axios.get(`https://api.aladhan.com/v1/timingsByCity/${dateStr}`, {
    params: { city, country: 'SA', method: 4 } // method 4 = Umm Al-Qura
  });

  const timings = data.data.timings;
  const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const now = today.getHours() * 60 + today.getMinutes();
  const buffer = 15; // minutes before and after

  for (const prayer of prayerNames) {
    const [h, m] = timings[prayer].split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (now >= prayerMinutes - buffer && now <= prayerMinutes + buffer) {
      return true; // currently within a salah window
    }
  }
  return false;
}
```

---

## 11. whatsapp-web.js Session Manager

Each store gets its own WhatsApp session. Sessions are persisted to disk so they survive container restarts.

```typescript
// services/whatsapp.ts
import { Client, LocalAuth } from 'whatsapp-web.js';
import path from 'path';

const sessions = new Map<string, Client>();

export async function getOrCreateSession(storeId: string, onQR: (qr: string) => void): Promise<Client> {
  if (sessions.has(storeId)) return sessions.get(storeId)!;

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: storeId,
      dataPath: path.join('/data/whatsapp-sessions')
    }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    }
  });

  client.on('qr', onQR);
  client.on('ready', async () => {
    await prisma.store.update({
      where: { id: storeId },
      data: { whatsappConnected: true, whatsappNumber: client.info.wid.user }
    });
  });
  client.on('disconnected', () => {
    sessions.delete(storeId);
    prisma.store.update({ where: { id: storeId }, data: { whatsappConnected: false } });
  });

  await client.initialize();
  sessions.set(storeId, client);
  return client;
}

export async function sendMessage(storeId: string, phone: string, message: string) {
  const client = sessions.get(storeId);
  if (!client) throw new Error('WhatsApp session not found');
  const chatId = phone.replace('+', '') + '@c.us';
  await client.sendMessage(chatId, message);
}
```

---

## 12. Docker Compose

```yaml
# recover/docker-compose.yml
services:
  api:
    build: ./api
    container_name: recover-api
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file: .env
    volumes:
      - ./data/whatsapp-sessions:/data/whatsapp-sessions
    depends_on:
      - postgres
      - redis
    networks:
      - thikr-proxy
      - recover-internal

  dashboard:
    build: ./dashboard
    container_name: recover-dashboard
    restart: always
    ports:
      - "3002:3000"
    env_file: .env
    depends_on:
      - api
    networks:
      - thikr-proxy
      - recover-internal

  postgres:
    image: postgres:16-alpine
    container_name: recover-postgres
    restart: always
    environment:
      POSTGRES_USER: recover
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: recover
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      - recover-internal

  redis:
    image: redis:7-alpine
    container_name: recover-redis
    restart: always
    volumes:
      - ./data/redis:/data
    networks:
      - recover-internal

networks:
  thikr-proxy:
    external: true
  recover-internal:
    driver: bridge
```

---

## 13. Nginx Config (system nginx on VPS)

Add to `/etc/nginx/sites-available/recover.thikr.tech`:

```nginx
server {
    listen 80;
    server_name recover.thikr.tech;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name recover.thikr.tech;

    ssl_certificate /etc/letsencrypt/live/recover.thikr.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/recover.thikr.tech/privkey.pem;

    # Dashboard — root
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API — /api prefix
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support (for QR code streaming)
    location /api/ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Then run:
```bash
sudo ln -s /etc/nginx/sites-available/recover.thikr.tech /etc/nginx/sites-enabled/
sudo certbot --nginx -d recover.thikr.tech
sudo nginx -s reload
```

---

## 14. Dashboard Pages

### `/` — Landing / Login
- Hero: "استرجع مبيعاتك المفقودة تلقائياً عبر واتساب"
- CTA: "ابدأ تجربتك المجانية 14 يوم"
- Magic link email login (no password)

### `/dashboard` — Overview
- Cards: Carts Recovered | Revenue Recovered | Messages Sent | Recovery Rate %
- Chart: Recovery rate over last 30 days
- Recent activity table (RTL)

### `/dashboard/connect` — Setup Flow
- Step 1: Connect Salla store (OAuth button)
- Step 2: Scan WhatsApp QR code (websocket stream from API)
- Step 3: Configure delay + discount % + message template
- Step 4: Activate

### `/dashboard/messages` — Message Editor
- RTL Arabic textarea
- Live preview of how message will look in WhatsApp
- Available variables: `{اسم_العميل}`, `{المنتجات}`, `{المجموع}`, `{كود_الخصم}`, `{نسبة_الخصم}`

### `/dashboard/billing` — Subscription
- Current plan + status
- Moyasar payment widget
- Plan options:
  - **Starter** — 99 ر.س/شهر — up to 500 messages
  - **Pro** — 249 ر.س/شهر — unlimited messages + analytics

---

## 15. Salla OAuth Flow

```
1. Store owner clicks "Connect Salla Store"
2. Redirect to: https://accounts.salla.sa/oauth2/auth
   ?client_id={SALLA_CLIENT_ID}
   &redirect_uri=https://recover.thikr.tech/api/auth/salla/callback
   &response_type=code
   &scope=offline_access+products.read+orders.read+webhooks.write

3. Salla redirects back with ?code=xxx
4. Exchange code for access + refresh tokens:
   POST https://accounts.salla.sa/oauth2/token

5. Store Salla store info + tokens in DB
6. Register abandoned_cart webhook on store
7. Redirect store owner to /dashboard/connect (Step 2 — WhatsApp QR)
```

---

## 16. Build Order for Cline

Build in this exact sequence. Complete and test each phase before starting the next.

### Phase 1 — Backend Core
1. Initialize Node.js + TypeScript project in `api/`
2. Set up Prisma schema and run first migration
3. Build Express server with health endpoint `GET /api/health`
4. Implement Salla OAuth callback route
5. Implement webhook receiver with HMAC validation
6. Set up Bull queue + Redis connection
7. Build recovery worker with Salla cart-check + WhatsApp send
8. Build whatsapp-web.js session manager
9. Expose WebSocket endpoint for QR streaming

### Phase 2 — Dashboard
1. Initialize Next.js 14 project in `dashboard/`
2. Set up NextAuth with magic link (email)
3. Build landing page (Arabic RTL)
4. Build `/dashboard` stats page (fetch from API)
5. Build `/dashboard/connect` setup wizard
6. Build QR code display component (WebSocket)
7. Build message template editor with live preview
8. Build `/dashboard/billing` with Moyasar integration

### Phase 3 — Hardening
1. Add rate limiting to webhook endpoint
2. Add job deduplication (same cart can't be queued twice)
3. Add token refresh for Salla access tokens
4. Add monitoring endpoint for WhatsApp session health
5. Write docker-compose.yml and test full stack locally
6. Deploy to VPS

---

## 17. Key Constraints & Notes for Cline

- **All user-facing text must be in Arabic (RTL)**. Use `dir="rtl"` and `lang="ar"` on all Arabic containers.
- **Never send a WhatsApp message during prayer times.** Always call `checkSalahTime()` before sending. If it returns true, delay the job by 15 minutes and retry.
- **Never queue the same cart twice.** Use `jobId: recovery-{cartId}` in Bull so duplicate webhooks are ignored.
- **WhatsApp sessions must persist across restarts.** Mount `/data/whatsapp-sessions` as a Docker volume.
- **Salla tokens expire.** Implement refresh token logic using `sallaRefreshToken` before every Salla API call.
- **Discount codes must be unique per cart.** Generate with `nanoid` + store prefix e.g. `RECOVER-X7K2P`.
- **Do not store raw customer phone numbers in logs** beyond what's needed. Saudi PDPL compliance.
- **The API and dashboard are separate Node processes** but share the same Postgres DB and Redis instance.
- **Use TypeScript throughout.** Strict mode enabled.
- **whatsapp-web.js requires Chromium/Puppeteer.** The API Dockerfile must install Chromium dependencies.

---

## 18. Dockerfile — API (whatsapp-web.js needs Chromium)

```dockerfile
# api/Dockerfile
FROM node:20-slim

# Install Chromium for Puppeteer (required by whatsapp-web.js)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto \
    fonts-noto-cjk \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

---

## 19. Pricing & Trial Logic

- New stores get a **14-day free trial** automatically on signup
- `subscription.status = 'trial'`, `trialEndsAt = now + 14 days`
- `store.isActive = true` during trial
- When trial expires: `store.isActive = false`, webhook still receives but jobs are not queued
- Store owner sees upgrade prompt on dashboard
- On Moyasar payment success webhook: set `status = 'active'`, `store.isActive = true`

---

*End of reference document. Build Phase 1 first.*
