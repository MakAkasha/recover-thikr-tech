import DashboardShell from '@/components/DashboardShell';

export default function BillingPage() {
  return (
    <DashboardShell title="الاشتراك والفوترة" subtitle="إدارة خطتك ورفع السعة حسب نمو متجرك">

      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <h2 className="font-bold mb-2">الخطة الحالية</h2>
        <p className="text-slate-600">الحالة: تجربة مجانية</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold">Starter</h3>
          <p className="text-slate-600 mt-2">99 ر.س / شهر</p>
          <p className="text-slate-500 text-sm">حتى 500 رسالة</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold">Pro</h3>
          <p className="text-slate-600 mt-2">249 ر.س / شهر</p>
          <p className="text-slate-500 text-sm">رسائل غير محدودة + تحليلات</p>
        </div>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-amber-800 mt-6">
        سيتم دمج Moyasar Checkout هنا في المرحلة التالية الخاصة بربط الدفع الفعلي.
      </div>
    </DashboardShell>
  );
}
