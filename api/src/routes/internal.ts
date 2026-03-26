import { Router } from 'express';
import { getSessionHealth, listSessionStatuses } from '../services/whatsapp';

export const internalRouter = Router();

internalRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'recover-api', timestamp: new Date().toISOString() });
});

internalRouter.get('/whatsapp/health', (_req, res) => {
  const status = getSessionHealth();
  res.json({ ok: true, ...status });
});

internalRouter.get('/admin/sessions', (_req, res) => {
  res.json(listSessionStatuses());
});
