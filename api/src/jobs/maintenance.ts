import cron from 'node-cron';
import { prisma } from '../db/client';

export function startMaintenanceJobs(): void {
  // 90-day retention for recovery logs
  cron.schedule('15 3 * * *', async () => {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await prisma.recoveryLog.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });
  });
}
