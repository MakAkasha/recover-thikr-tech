import { nanoid } from 'nanoid';
import { prisma } from '../db/client';

export async function generateDiscountCode(storeId: string, percent: number, cartId?: string): Promise<string> {
  for (let i = 0; i < 5; i += 1) {
    const code = `RECOVER-${nanoid(5).toUpperCase()}`;
    try {
      await prisma.discountCode.create({
        data: {
          storeId,
          code,
          percent,
          cartId,
        },
      });
      return code;
    } catch {
      // retry on unique conflict
    }
  }

  throw new Error('Failed to generate unique discount code');
}
