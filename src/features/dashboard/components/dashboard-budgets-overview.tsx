'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { clampPercentage } from '../lib/dashboard-metrics';
import { currencyFormatter, monthLabel } from '../lib/dashboard-formatters';
import type { Budget } from '@/features/budgets/lib/budget-progress';
import type { BudgetPeriod } from '../types';

type SelectedBudgetItem = {
  budget: Budget;
  spent: number;
};

type DashboardBudgetsOverviewProps = {
  selectedBudgets: SelectedBudgetItem[];
  budgetPeriod: BudgetPeriod;
  onBudgetPeriodChange: (period: BudgetPeriod) => void;
  selectedMonth: string;
  categoryNames: Map<string, string>;
};

export function DashboardBudgetsOverview({
  selectedBudgets,
  budgetPeriod,
  onBudgetPeriodChange,
  selectedMonth,
  categoryNames,
}: DashboardBudgetsOverviewProps) {
  return (
    <Card className="gap-0 py-0 xl:col-span-2">
      <CardHeader className="border-b py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Orçamento do período</CardTitle>
            <CardDescription>{monthLabel(selectedMonth)}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              role="group"
              aria-label="Período dos orçamentos"
              className="inline-flex rounded-md border p-0.5"
            >
              {(['monthly', 'annual'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  aria-pressed={budgetPeriod === period}
                  onClick={() => onBudgetPeriodChange(period)}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    budgetPeriod === period
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {period === 'monthly' ? 'Mensal' : 'Anual'}
                </button>
              ))}
            </div>
            <Link
              href="/budgets"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Ver todas
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {selectedBudgets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum orçamento {budgetPeriod === 'monthly' ? 'mensal' : 'anual'}{' '}
            cadastrado.
          </p>
        ) : (
          <ul className="divide-y">
            {selectedBudgets.map(({ budget, spent }) => {
              const percentage = (spent / budget.amount) * 100;
              const exceeded = percentage >= 100;
              const progress = clampPercentage(percentage);
              const categoryName =
                categoryNames.get(budget.category_id) ??
                'Categoria indisponível';

              return (
                <li
                  key={budget.id}
                  className="space-y-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {categoryName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currencyFormatter.format(spent)} /{' '}
                        {currencyFormatter.format(budget.amount)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold tabular-nums ${
                        exceeded ? 'text-destructive' : 'text-muted-foreground'
                      }`}
                    >
                      {exceeded
                        ? `${Math.round(percentage)}% (Excedido)`
                        : `${Math.round(percentage)}%`}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Consumo do orçamento de ${categoryName}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={`h-full rounded-full ${
                        exceeded ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
