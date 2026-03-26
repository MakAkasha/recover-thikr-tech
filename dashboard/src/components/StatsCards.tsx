type Stats = {
  recoveredCarts: number;
  recoveredRevenue: number;
  messagesSent: number;
  recoveryRate: number;
};

export default function StatsCards({ stats }: { stats: Stats }) {
  const items = [
    { title: 'السلات المسترجعة', value: stats.recoveredCarts, accent: 'from-cyan-500 to-teal-500' },
    { title: 'الإيرادات المسترجعة', value: `${stats.recoveredRevenue} ر.س`, accent: 'from-emerald-500 to-green-500' },
    { title: 'الرسائل المرسلة', value: stats.messagesSent, accent: 'from-indigo-500 to-violet-500' },
    { title: 'نسبة الاسترجاع', value: `${stats.recoveryRate}%`, accent: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" dir="rtl" lang="ar">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${item.accent}`} />
          <div className="text-slate-500 text-sm">{item.title}</div>
          <div className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
