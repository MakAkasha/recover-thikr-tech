import { prisma } from '../db/client';
import { generateDiscountCode } from '../services/discount';
import { recoveryQueue } from '../services/queue';
import { isCartConverted } from '../services/salla';
import { sendMessage } from '../services/whatsapp';
import { RecoveryJobData } from '../types';
import { buildArabicMessage } from '../utils/messages';
import { checkSalahTime } from '../utils/salahTimes';

recoveryQueue.process(async (job) => {
  const { storeId, cartId, customerPhone, customerName, cartItems, cartValue } = job.data as RecoveryJobData;

  const store = await prisma.store.findUnique({ where: { id: storeId }, include: { subscription: true } });
  if (!store?.isActive) return { skipped: 'store_inactive' };

  const completed = await isCartConverted(storeId, cartId);
  if (completed) {
    await prisma.recoveryLog.updateMany({ where: { storeId, sallaCartId: cartId }, data: { status: 'cancelled' } });
    return { skipped: 'order_completed' };
  }

  const isSalah = await checkSalahTime('Riyadh');
  if (isSalah) {
    await (job as any).moveToDelayed(Date.now() + 15 * 60 * 1000);
    throw new Error('Salah time — delaying');
  }

  const discountCode = await generateDiscountCode(storeId, store.discountPercent, cartId);
  const message = buildArabicMessage({
    customerName,
    cartItems,
    cartValue,
    discountCode,
    discountPercent: store.discountPercent,
  });

  await sendMessage(storeId, customerPhone, message);

  await prisma.recoveryLog.updateMany({
    where: { storeId, sallaCartId: cartId },
    data: {
      status: 'sent',
      sentAt: new Date(),
      discountCode,
    },
  });

  return { sent: true };
});

// eslint-disable-next-line no-console
console.log('Recovery worker started');
