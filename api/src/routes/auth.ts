import { Router } from 'express';
import { addDays } from '../utils/time';
import { prisma } from '../db/client';
import { config } from '../config';
import { exchangeCodeForTokens, fetchStoreProfile, registerAbandonedCartWebhook } from '../services/salla';

export const authRouter = Router();

authRouter.get('/salla/callback', async (req, res, next) => {
  try {
    const code = req.query.code;
    if (typeof code !== 'string') {
      res.status(400).json({ error: 'Missing code query parameter' });
      return;
    }

    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchStoreProfile(tokens.access_token);

    const store = await prisma.store.upsert({
      where: { sallaStoreId: profile.id },
      update: {
        sallaAccessToken: tokens.access_token,
        sallaRefreshToken: tokens.refresh_token,
        sallaStoreName: profile.name,
        sallaStoreUrl: profile.domain,
      },
      create: {
        sallaStoreId: profile.id,
        sallaAccessToken: tokens.access_token,
        sallaRefreshToken: tokens.refresh_token,
        sallaStoreName: profile.name,
        sallaStoreUrl: profile.domain,
        ownerEmail: 'owner@unknown.local',
        ownerName: 'Store Owner',
        isActive: true,
      },
    });

    await prisma.subscription.upsert({
      where: { storeId: store.id },
      update: {},
      create: {
        storeId: store.id,
        status: 'trial',
        trialEndsAt: addDays(new Date(), 14),
      },
    });

    await registerAbandonedCartWebhook(store);

    res.redirect(`${config.dashboardUrl}/dashboard/connect?storeId=${store.id}`);
  } catch (error) {
    next(error);
  }
});
