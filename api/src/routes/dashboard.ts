import { Router } from 'express';
import { prisma } from '../db/client';

export const dashboardRouter = Router();

// In a real app, you'd extract storeId from the authenticated user token
// Since NextAuth logic is partially incomplete, we'll accept storeId as a query param for now
dashboardRouter.get('/', async (req, res) => {
  const storeId = req.query.storeId as string;
  if (!storeId) {
    return res.status(400).json({ error: 'storeId query parameter is required' });
  }

  try {
    const recoveredCarts = await prisma.recoveryLog.count({
      where: { storeId, status: 'recovered' },
    });

    const recoveredRevenueAgg = await prisma.recoveryLog.aggregate({
      _sum: { recoveredValue: true },
      where: { storeId, status: 'recovered' },
    });
    const recoveredRevenue = recoveredRevenueAgg._sum.recoveredValue || 0;

    const messagesSent = await prisma.recoveryLog.count({
      where: { storeId, status: 'sent' },
    });

    const totalProcessed = await prisma.recoveryLog.count({
      where: { storeId, status: { in: ['sent', 'recovered'] } },
    });

    const recoveryRate = totalProcessed > 0
      ? Math.round((recoveredCarts / totalProcessed) * 100)
      : 0;

    const recent = await prisma.recoveryLog.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        customerName: true,
        status: true,
        cartValue: true,
      },
    });

    res.json({
      recoveredCarts,
      recoveredRevenue,
      messagesSent,
      recoveryRate,
      recent,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
