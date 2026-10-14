'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  calculateBudgetSpent,
  getCrossedThresholds,
  getMonthDates,
  type Budget,
  type BudgetTransaction,
} from '../lib/budget-progress';
import type { BudgetAlertRefreshMode } from '../lib/budget-alerts';

type BudgetAlert = {
  id: string;
  title: string;
  description: string;
  expiresAt: number;
};

export function BudgetAlertCenter() {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const previousSpent = useRef<Map<string, number> | null>(null);
  const lastPath = useRef<string | null>(null);
  const requestNumber = useRef(0);

  useEffect(() => {
    const checkActivity = async (mode: BudgetAlertRefreshMode) => {
      const currentRequest = ++requestNumber.current;
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) return;

      const today = new Date().toISOString().slice(0, 10);
      const month = today.slice(0, 7);
      const { startDate } = getMonthDates(month);
      const [budgetsResult, categoriesResult, transactionsResult] =
        await Promise.all([
          supabase
            .from('budgets')
            .select(
              'id, user_id, category_id, period, amount, alert_thresholds, created_at, updated_at',
            )
            .eq('user_id', userData.user.id),
          supabase
            .from('categories')
            .select('id, name')
            .eq('user_id', userData.user.id),
          supabase
            .from('transactions')
            .select('category_id, amount, transaction_date')
            .eq('user_id', userData.user.id)
            .eq('transaction_type', 'expense')
            .gte('transaction_date', startDate)
            .lte('transaction_date', today),
        ]);

      if (
        currentRequest !== requestNumber.current ||
        budgetsResult.error ||
        categoriesResult.error ||
        transactionsResult.error
      ) {
        return;
      }

      const budgets = budgetsResult.data ?? [];
      const transactions = (transactionsResult.data ??
        []) as BudgetTransaction[];
      const nextSpent = new Map<string, number>();
      for (const budget of budgets) {
        nextSpent.set(
          budget.id,
          calculateBudgetSpent(budget as Budget, transactions, month),
        );
      }

      const previous = previousSpent.current;
      if (mode === 'check' && previous) {
        const categoryNames = new Map(
          (categoriesResult.data ?? []).map((category) => [
            category.id,
            category.name,
          ]),
        );
        const newAlerts: BudgetAlert[] = [];

        for (const budget of budgets) {
          const before = previous.get(budget.id);
          const after = nextSpent.get(budget.id) ?? 0;
          if (before === undefined || after <= before) continue;

          const thresholds = getCrossedThresholds(
            before,
            after,
            budget.amount,
            budget.alert_thresholds,
          );
          for (const threshold of thresholds) {
            newAlerts.push({
              id: `${budget.id}-${threshold}-${today}-${Date.now()}`,
              title: `Limite de ${threshold}% atingido`,
              description: `${categoryNames.get(budget.category_id) ?? 'Categoria'} chegou a ${threshold}% do orçamento ${budget.period === 'monthly' ? 'mensal' : 'anual'}.`,
              expiresAt: Date.now() + 6000,
            });
          }
        }

        if (newAlerts.length > 0) {
          setAlerts((current) => [...current, ...newAlerts].slice(-3));
        }
      }

      previousSpent.current = nextSpent;
    };

    const wasNavigated =
      lastPath.current !== null && lastPath.current !== pathname;
    lastPath.current = pathname;
    void checkActivity(wasNavigated ? 'check' : 'reset');

    const handleRefresh = (event: Event) => {
      const mode = (event as CustomEvent<BudgetAlertRefreshMode>).detail;
      void checkActivity(mode ?? 'check');
    };
    window.addEventListener('budget-alert-refresh', handleRefresh);

    return () => {
      window.removeEventListener('budget-alert-refresh', handleRefresh);
    };
  }, [pathname]);

  useEffect(() => {
    if (alerts.length === 0) return;
    const timeUntilExpiry = Math.max(0, alerts[0].expiresAt - Date.now());
    const timeout = window.setTimeout(() => {
      setAlerts((current) =>
        current.filter((alert) => alert.expiresAt > Date.now()),
      );
    }, timeUntilExpiry);
    return () => window.clearTimeout(timeout);
  }, [alerts]);

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed bottom-4 right-4 z-70 grid w-[calc(100%-2rem)] max-w-sm gap-3"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-lg border border-amber-500/40 bg-background p-4 shadow-lg"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-amber-500"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{alert.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {alert.description}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Dispensar alerta"
            onClick={() =>
              setAlerts((current) =>
                current.filter((item) => item.id !== alert.id),
              )
            }
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}
