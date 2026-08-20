import { AuthButton } from '@/features/auth/components/auth-button';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <DashboardHeader />
      <div>
        <AuthButton />
      </div>
      <div>{children}</div>
    </div>
  );
}
