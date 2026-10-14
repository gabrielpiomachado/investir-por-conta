import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { AuthButton } from '@/features/auth/components/auth-button';
import { Footer } from '@/components/layout/footer';
import { BudgetAlertCenter } from '@/features/budgets/components/budget-alert-center';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <DashboardSidebar account={<AuthButton />} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1">{children}</main>
        <Footer />
      </div>
      <BudgetAlertCenter />
    </div>
  );
}
