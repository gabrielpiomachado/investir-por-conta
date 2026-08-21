import Link from 'next/link';
import { AuthButton } from '@/features/auth/components/auth-button';

export function PublicHeader() {
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
            href="/"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Home
          </Link>

          <Link
            href="/pricing"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Pricing
          </Link>

          <Link
            href="/faq"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            FAQ
          </Link>

          <Link
            href="/about"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            About
          </Link>

          <Link
            href="/blog"
            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Blog
          </Link>
        </nav>

        <AuthButton />
      </div>
    </header>
  );
}
