import { CartItem } from '../types';

interface MessageInput {
  customerName: string;
  cartItems: CartItem[];
  cartValue: number;
  discountCode: string;
  discountPercent: number;
}

export function buildArabicMessage({ customerName, cartItems, cartValue, discountCode, discountPercent }: MessageInput): string {
  const itemsList = cartItems.map((item) => `• ${item.name} (${item.quantity}x) — ${item.price} ر.س`).join('\n');

  return `
السلام عليكم ${customerName} 👋

لاحظنا أنك تركت بعض المنتجات في سلة التسوق الخاصة بك 🛒

*المنتجات المتبقية:*
${itemsList}

*المجموع: ${cartValue} ر.س*

🎁 لأننا نقدّر تسوقك معنا، إليك كود خصم خاص:
*${discountCode}*
يمنحك خصم ${discountPercent}٪ على طلبك كاملاً

⏰ *الكود صالح لمدة 24 ساعة فقط*

أتمّ طلبك الآن وسنوصله إليك في أسرع وقت 🚀
  `.trim();
}
