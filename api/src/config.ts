import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPort: Number(process.env.API_PORT ?? 3001),
  trustProxy: (process.env.TRUST_PROXY ?? 'true') === 'true',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  bodyLimit: process.env.BODY_LIMIT ?? '1mb',
  webhookRateLimitMax: Number(process.env.WEBHOOK_RATE_LIMIT_MAX ?? 60),
  webhookRateLimitWindowMs: Number(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS ?? 60_000),
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL'),
  sallaClientId: process.env.SALLA_CLIENT_ID ?? '',
  sallaClientSecret: process.env.SALLA_CLIENT_SECRET ?? '',
  sallaWebhookSecret: process.env.SALLA_WEBHOOK_SECRET ?? '',
  sallaOAuthBaseUrl: process.env.SALLA_OAUTH_BASE_URL ?? 'https://accounts.salla.sa/oauth2',
  sallaApiBaseUrl: process.env.SALLA_API_BASE_URL ?? 'https://api.salla.dev/admin/v2',
  dashboardUrl: process.env.DASHBOARD_URL ?? 'http://localhost:3000',
  apiUrl: process.env.API_URL ?? 'http://localhost:3001/api',
  aladhanApiUrl: process.env.ALADHAN_API_URL ?? 'https://api.aladhan.com/v1',
};
