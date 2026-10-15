import Link from 'next/link';
import { AuthButton } from '@/features/auth/components/auth-button';
import { ThemeToggle } from '@/components/theme-toggle';

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 md:flex-nowrap md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-xl"
        >
          <span className="grid size-8 place-items-center rounded-sm bg-lime-300 text-black">
            <span aria-hidden="true" className="text-sm font-bold">
              I
            </span>
          </span>
          Investir por Conta
        </Link>

        <nav
          aria-label="Navegação principal"
          className="order-3 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground md:order-0 md:w-auto md:flex-1 md:gap-7 md:text-sm"
        >
          <Link
            href="/"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Início
          </Link>

          <Link
            href="/pricing"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Planos
          </Link>

          <Link
            href="/faq"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Dúvidas
          </Link>

          <Link
            href="/about"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sobre
          </Link>

          <Link
            href="/blog"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButton showDashboardLink />
        </div>
      </div>
    </header>
  );
}
