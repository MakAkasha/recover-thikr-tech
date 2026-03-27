import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'باقي | استرجاع السلات المتروكة',
  description: 'استرجع مبيعاتك المفقودة تلقائياً عبر واتساب',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
