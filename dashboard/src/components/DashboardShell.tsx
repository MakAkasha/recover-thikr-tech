'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم' },
  { href: '/dashboard/connect', label: 'الربط والإعداد' },
  { href: '/dashboard/messages', label: 'الرسائل' },
  { href: '/dashboard/billing', label: 'الفوترة' },
];

export default function DashboardShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl" lang="ar">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{title}</h1>
            {subtitle ? <p className="text-slate-500 mt-1 text-sm">{subtitle}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active ? 'bg-brand text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:border-brand/40'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</section>
    </main>
  );
}
