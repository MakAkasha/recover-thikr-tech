'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import QRScanner from '@/components/QRScanner';

function ConnectContent() {
  const params = useSearchParams();
  const storeId = params.get('storeId') ?? '';

  async function initWhatsapp() {
    if (!storeId) return;
    await fetch(`http://localhost:3001/api/whatsapp/${storeId}/connect`, { method: 'POST' });
  }

  return (
    <DashboardShell title="إعداد المتجر" subtitle="4 خطوات سريعة للتفعيل الكامل">

      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <h2 className="font-bold mb-2">الخطوة 1: ربط متجر سلة</h2>
        <a
          href="https://accounts.salla.sa/oauth2/auth"
          className="inline-block rounded-lg bg-brand text-white px-4 py-2 font-semibold"
        >
          ربط متجر سلة
        </a>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm mt-6">
        <h2 className="font-bold mb-2">الخطوة 2: ربط واتساب</h2>
        <button onClick={initWhatsapp} className="rounded-lg border border-slate-300 px-4 py-2 mb-4">
          بدء إنشاء QR
        </button>
        <QRScanner storeId={storeId} />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm mt-6">
        <h2 className="font-bold mb-2">الخطوة 3: إعدادات الاسترجاع</h2>
        <p className="text-slate-600">يمكنك ضبط التأخير، نسبة الخصم، ونص الرسالة من صفحة الرسائل.</p>
      </div>
    </DashboardShell>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<main className="p-6 md:p-10" dir="rtl" lang="ar">جاري التحميل...</main>}>
      <ConnectContent />
    </Suspense>
  );
}
