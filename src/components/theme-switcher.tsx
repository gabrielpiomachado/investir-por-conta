'use client';

import { useSyncExternalStore } from 'react';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ICON_SIZE = 16;

const subscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ThemeSwitcher() {
  const isClient = useIsClient();
  const { theme, setTheme } = useTheme();

  if (!isClient) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" aria-label="Alterar tema" />}
      >
        {theme === 'light' ? (
          <Sun size={ICON_SIZE} className="text-muted-foreground" />
        ) : theme === 'dark' ? (
          <Moon size={ICON_SIZE} className="text-muted-foreground" />
        ) : (
          <Laptop size={ICON_SIZE} className="text-muted-foreground" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-fit" align="start">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun size={ICON_SIZE} />
            <span>Claro</span>
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value="dark">
            <Moon size={ICON_SIZE} />
            <span>Escuro</span>
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value="system">
            <Laptop size={ICON_SIZE} />
            <span>Sistema</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
