import http from 'http';
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { config } from './config';
import { internalRouter } from './routes/internal';
import { authRouter } from './routes/auth';
import { webhookRouter } from './routes/webhook';
import { paymentsRouter } from './routes/payments';
import { initQrWebSocket } from './ws/qrSocket';
import { getOrCreateSession } from './services/whatsapp';
import { startMaintenanceJobs } from './jobs/maintenance';

const app = express();

app.use(cors());
app.use(pinoHttp());

// Salla webhook must use raw body for HMAC validation
app.use('/api/webhook/salla/:storeId', express.raw({ type: 'application/json', limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', internalRouter);
app.use('/api/auth', authRouter);
app.use('/api/webhook', webhookRouter);

// Moyasar webhook must use raw body for signature verification
app.use('/api/payments/moyasar/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
app.use('/api/payments', paymentsRouter);

app.post('/api/whatsapp/:storeId/connect', async (req, res, next) => {
  try {
    const { storeId } = req.params;
    await getOrCreateSession(storeId);
    res.status(202).json({ ok: true, status: 'initializing' });
  } catch (error) {
    next(error);
  }
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: err?.message ?? 'Internal server error' });
});

const server = http.createServer(app);
initQrWebSocket(server);
startMaintenanceJobs();

server.listen(config.apiPort, () => {
  // eslint-disable-next-line no-console
  console.log(`Recover API listening on port ${config.apiPort}`);
});
