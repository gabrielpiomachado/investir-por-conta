import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-9 md:grid-cols-[1fr_auto] md:items-end md:px-8">
        <div>
          <Link href="/" className="font-heading text-lg font-semibold">
            Investir por Conta
          </Link>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Mais clareza sobre o seu dinheiro. Mais espaço para escolher o que
            fazer com ele.
          </p>
        </div>
        <nav
          aria-label="Navegação do rodapé"
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
        >
          <Link className="hover:text-foreground" href="/pricing">
            Planos
          </Link>
          <Link className="hover:text-foreground" href="/faq">
            Dúvidas
          </Link>
          <Link className="hover:text-foreground" href="/about">
            Sobre
          </Link>
          <Link className="hover:text-foreground" href="/blog">
            Blog
          </Link>
        </nav>
        <p className="border-t border-border pt-4 text-xs text-muted-foreground md:col-span-2">
          © {new Date().getFullYear()} Investir por Conta
        </p>
      </div>
    </footer>
  );
}
