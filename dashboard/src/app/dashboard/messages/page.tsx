'use client';

import { useMemo, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import MessagePreview from '@/components/MessagePreview';

const defaultTemplate = `السلام عليكم {اسم_العميل} 👋

لاحظنا أنك تركت منتجات في سلة التسوق 🛒

{المنتجات}

المجموع: {المجموع} ر.س
كود الخصم: {كود_الخصم}
خصم {نسبة_الخصم}% لمدة 24 ساعة`;

export default function MessagesPage() {
  const [template, setTemplate] = useState(defaultTemplate);

  const preview = useMemo(
    () =>
      template
        .replaceAll('{اسم_العميل}', 'محمد')
        .replaceAll('{المنتجات}', '• حذاء رياضي (1x) — 299 ر.س')
        .replaceAll('{المجموع}', '299')
        .replaceAll('{كود_الخصم}', 'RECOVER-X7K2P')
        .replaceAll('{نسبة_الخصم}', '10'),
    [template],
  );

  return (
    <DashboardShell title="محرر الرسائل" subtitle="صمم رسائل عربية واضحة مع معاينة فورية">
      <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <h1 className="text-2xl font-extrabold mb-4">محرر الرسائل</h1>
        <p className="text-slate-600 mb-4">المتغيرات المتاحة: {'{اسم_العميل}'}، {'{المنتجات}'}، {'{المجموع}'}، {'{كود_الخصم}'}، {'{نسبة_الخصم}'}</p>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full min-h-80 rounded-lg border border-slate-300 p-3 text-sm leading-7"
        />
      </section>

      <section>
        <MessagePreview message={preview} />
      </section>
      </div>
    </DashboardShell>
  );
}
