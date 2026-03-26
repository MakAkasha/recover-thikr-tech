import { Router } from 'express';
import { prisma } from '../db/client';
import { validateSallaWebhook } from '../middleware/validateWebhook';
import { rateLimitWebhook } from '../middleware/rateLimit';
import { scheduleRecovery } from '../services/queue';
import { RecoveryJobData } from '../types';

export const webhookRouter = Router();

webhookRouter.post('/salla/:storeId', rateLimitWebhook(), validateSallaWebhook, async (req, res, next) => {
  try {
    const payload = JSON.parse((req.body as Buffer).toString('utf8'));
    const storeId = String(req.params.storeId ?? '');
    if (!storeId) {
      res.status(400).json({ error: 'Missing storeId' });
      return;
    }
    const store = await prisma.store.findUnique({ where: { id: storeId }, include: { subscription: true } });

    if (!store) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    if (!store.isActive) {
      res.status(202).json({ ok: true, skipped: 'store_inactive' });
      return;
    }

    const cart = payload?.data;
    const cartId = String(cart?.id ?? '');
    if (!cartId) {
      res.status(400).json({ error: 'Missing cart id' });
      return;
    }

    const customerName = `${cart?.customer?.first_name ?? ''} ${cart?.customer?.last_name ?? ''}`.trim() || 'عميلنا الكريم';
    const rawPhone = String(cart?.customer?.mobile ?? '');
    const maskedPhone = rawPhone.length > 4 ? `${rawPhone.slice(0, 4)}******${rawPhone.slice(-2)}` : '***';
    const cartItems = Array.isArray(cart?.items)
      ? cart.items.map((item: any) => ({
          name: String(item.name ?? 'منتج'),
          quantity: Number(item.quantity ?? 1),
          price: Number(item.price ?? 0),
        }))
      : [];
    const cartValue = Number(cart?.total ?? 0);

    const scheduledFor = new Date(Date.now() + store.delayMinutes * 60 * 1000);

    const log = await prisma.recoveryLog.create({
      data: {
        storeId,
        sallaCartId: cartId,
        customerName,
        customerPhone: maskedPhone,
        cartValue,
        cartItems,
        scheduledFor,
      },
    });

    const jobData: RecoveryJobData = {
      storeId,
      cartId,
      customerName,
      customerPhone: rawPhone,
      cartItems,
      cartValue,
    };

    const job = await scheduleRecovery(jobData, store.delayMinutes * 60 * 1000);

    await prisma.recoveryLog.update({
      where: { id: log.id },
      data: { bullJobId: String(job.id) },
    });

    res.status(201).json({ ok: true });
  } catch (error: any) {
    if (error?.message?.includes('JobId')) {
      res.status(202).json({ ok: true, deduplicated: true });
      return;
    }
    next(error);
  }
});
