import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6" dir="rtl" lang="ar">
      <div className="max-w-3xl w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-8 md:p-12 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">استرجع مبيعاتك المفقودة تلقائياً عبر واتساب</h1>
        <p className="mt-4 text-slate-600 leading-8">
          ريكفر يساعد متجرك على إرسال رسائل واتساب ذكية للعملاء الذين تركوا السلة، لزيادة المبيعات بشكل تلقائي.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="rounded-xl bg-brand text-white px-6 py-3 font-semibold">
            ابدأ تجربتك المجانية 14 يوم
          </Link>
          <Link href="/dashboard/connect" className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700">
            ربط متجر سلة الآن
          </Link>
        </div>
      </div>
    </main>
  );
}
