'use client';

import { useState } from 'react';

type LogStatus = 'queued' | 'sent' | 'recovered' | 'failed';

interface ActivityLog {
  customerName: string;
  status: LogStatus;
  cartValue: number;
}

export default function RecentActivityTable({ logs }: { logs: ActivityLog[] }) {
  const [filter, setFilter] = useState<'all' | LogStatus>('all');

  const filteredLogs = filter === 'all' ? logs : logs.filter((log) => log.status === filter);

  return (
    <section className="mt-8 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm" dir="rtl" lang="ar">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-lg text-slate-800">النشاط الأخير</h2>
        <div className="flex space-x-2 space-x-reverse">
          {(['all', 'queued', 'sent', 'recovered', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' && 'الكل'}
              {status === 'queued' && 'في الانتظار'}
              {status === 'sent' && 'أُرسلت'}
              {status === 'recovered' && 'مسترجعة'}
              {status === 'failed' && 'فشلت'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-auto rounded-lg border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-slate-500 border-b border-slate-100">
              <th className="text-right py-3 px-4 font-semibold">العميل</th>
              <th className="text-right py-3 px-4 font-semibold">الحالة</th>
              <th className="text-right py-3 px-4 font-semibold">القيمة</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs && filteredLogs.length > 0 ? (
              filteredLogs.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-700">{row.customerName}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${row.status === 'recovered' ? 'bg-green-100 text-green-800' : ''}
                      ${row.status === 'sent' ? 'bg-blue-100 text-blue-800' : ''}
                      ${row.status === 'queued' ? 'bg-amber-100 text-amber-800' : ''}
                      ${row.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {row.status === 'recovered' && 'مسترجعة'}
                      {row.status === 'sent' && 'أُرسلت'}
                      {row.status === 'queued' && 'في الانتظار'}
                      {row.status === 'failed' && 'فشلت'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{row.cartValue} ر.س</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-8 text-center text-slate-500" colSpan={3}>
                  لا توجد عمليات تطابق هذا الفلتر التصنيف
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
