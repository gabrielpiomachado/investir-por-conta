'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import {
  ArrowLeftRight,
  CalendarClock,
  LayoutDashboard,
  Menu,
  Tag,
  Target,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';

type DashboardSidebarProps = {
  account: ReactNode;
};

const navigationItems = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/recurrence', label: 'Recorrências', icon: CalendarClock },
  { href: '/categories', label: 'Categorias', icon: Tag },
  { href: '/budgets', label: 'Orçamentos', icon: Wallet },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/profile', label: 'Perfil', icon: UserRound },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="space-y-1">
      {navigationItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
            className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContents({
  account,
  onNavigate,
}: DashboardSidebarProps & { onNavigate?: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-8 font-heading text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Investir por Conta
      </Link>
      <NavigationLinks onNavigate={onNavigate} />
      <div className="mt-auto border-t border-border pt-4">{account}</div>
    </div>
  );
}

export function DashboardSidebar({ account }: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background p-5 lg:flex">
        <SidebarContents account={account} />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link
          href="/"
          className="font-heading text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Investir por Conta
        </Link>
        <Dialog.Trigger
          aria-label="Abrir navegação"
          className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu aria-hidden="true" className="size-5" />
        </Dialog.Trigger>
      </header>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-80 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 lg:hidden" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-81 flex h-dvh w-[min(20rem,calc(100vw-3rem))] flex-col overflow-y-auto border-r border-border bg-background p-5 shadow-xl outline-none lg:hidden">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Dialog.Title className="text-sm font-semibold text-muted-foreground">
              Navegação principal
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fechar navegação"
              className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          <SidebarContents
            account={account}
            onNavigate={() => setIsOpen(false)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
