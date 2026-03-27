import StatsCards from '@/components/StatsCards';
import DashboardShell from '@/components/DashboardShell';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import RecentActivityTable from '@/components/RecentActivityTable';
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
      <OnboardingChecklist />
      <StatsCards stats={stats} />
      <RecentActivityTable logs={stats.recent || []} />
    </DashboardShell>
  );
}
