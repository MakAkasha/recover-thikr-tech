import StatsCards from '@/components/StatsCards';
import DashboardShell from '@/components/DashboardShell';
import { env } from '@/lib/env';

async function getStats() {
  try {
    const res = await fetch(`${env.appUrl}/api/dashboard`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  } catch {
    return {
      recoveredCarts: 0,
      recoveredRevenue: 0,
      messagesSent: 0,
      recoveryRate: 0,
      recent: [],
    };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <DashboardShell title="لوحة التحكم" subtitle="متابعة الاسترجاع والأداء بشكل لحظي">
      <StatsCards stats={stats} />

      <section className="mt-8 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <h2 className="font-bold mb-3">النشاط الأخير</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 border-b">
                <th className="text-right py-2">العميل</th>
                <th className="text-right py-2">الحالة</th>
                <th className="text-right py-2">القيمة</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent?.length ? (
                stats.recent.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2">{row.customerName}</td>
                    <td className="py-2">{row.status}</td>
                    <td className="py-2">{row.cartValue} ر.س</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={3}>
                    لا توجد بيانات حتى الآن
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
