import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Footer } from '@/components/layout/footer';
import { BudgetAlertCenter } from '@/features/budgets/components/budget-alert-center';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1">{children}</main>
      <Footer />
      <BudgetAlertCenter />
    </div>
  );
}
