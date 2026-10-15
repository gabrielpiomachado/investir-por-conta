'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Laptop, Moon, Sun } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  align?: 'start' | 'end' | 'center';
  className?: string;
};

const emptySubscribe = () => () => {};

export function ThemeToggle({ align = 'end', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Alternar tema"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'icon-sm' }),
          'relative cursor-pointer',
          className
        )}
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Alternar tema</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={8}>
        <DropdownMenuRadioGroup
          value={mounted ? theme : 'system'}
          onValueChange={(val) => setTheme(val)}
        >
          <DropdownMenuRadioItem value="light" closeOnClick>
            <Sun className="size-4" />
            <span>Claro</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick>
            <Moon className="size-4" />
            <span>Escuro</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" closeOnClick>
            <Laptop className="size-4" />
            <span>Sistema</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
