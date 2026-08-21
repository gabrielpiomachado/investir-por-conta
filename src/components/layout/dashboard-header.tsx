import Link from 'next/link';
import { AuthButton } from '@/features/auth/components/auth-button';

export function DashboardHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-tight"
        >
          Investir por Conta
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
        >
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Dashboard
          </Link>

          <Link
            href="/transactions"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Transactions
          </Link>

          <Link
            href="/recurrence"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Recurrence
          </Link>

          <Link
            href="/categories"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Categories
          </Link>

          <Link
            href="/budgets"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Budgets
          </Link>

          <Link
            href="/goals"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Goals
          </Link>

          <Link
            href="/profile"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Profile
          </Link>
        </nav>

        <AuthButton />
      </div>
    </header>
  );
}
