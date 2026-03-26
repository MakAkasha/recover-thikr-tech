import crypto from 'crypto';
import { Router } from 'express';
import { prisma } from '../db/client';

export const paymentsRouter = Router();

// POST /api/payments/moyasar/webhook
paymentsRouter.post('/moyasar/webhook', async (req, res, next) => {
  try {
    const secret = process.env.MOYASAR_API_KEY;
    const signature = req.headers['x-moyasar-signature'];
    const raw = req.body as Buffer;

    if (!secret || !Buffer.isBuffer(raw) || typeof signature !== 'string') {
      res.status(400).json({ error: 'Invalid webhook request' });
      return;
    }

    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const recv = Buffer.from(signature, 'utf8');
    const exp = Buffer.from(expected, 'utf8');
    if (recv.length !== exp.length || !crypto.timingSafeEqual(recv, exp)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const payload = JSON.parse(raw.toString('utf8'));
    const status = payload?.status;
    const customerId = payload?.source?.company ?? payload?.metadata?.moyasarCustId;

    if (status !== 'paid' || !customerId) {
      res.status(202).json({ ok: true, skipped: true });
      return;
    }

    const subscription = await prisma.subscription.findFirst({ where: { moyasarCustId: String(customerId) } });
    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        currentPeriodEnd,
      },
    });

    await prisma.store.update({
      where: { id: subscription.storeId },
      data: { isActive: true },
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});
