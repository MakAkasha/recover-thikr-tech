import Bull from 'bull';
import { config } from '../config';
import { RecoveryJobData } from '../types';

export const recoveryQueue = new Bull<RecoveryJobData>('cart-recovery', {
  redis: config.redisUrl,
});

export async function scheduleRecovery(data: RecoveryJobData, delayMs: number): Promise<Bull.Job<RecoveryJobData>> {
  return recoveryQueue.add(data, {
    delay: delayMs,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 500,
    removeOnFail: 500,
    jobId: `recovery-${data.cartId}`,
  });
}

export async function cancelRecovery(cartId: string): Promise<void> {
  const job = await recoveryQueue.getJob(`recovery-${cartId}`);
  if (job) await job.remove();
}
