'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateBudgetSpent } from '@/features/budgets/lib/budget-progress';
import { calculateGoalProgress } from '@/features/goals/lib/goal-progress';
import {
  getMonthlyCategoryTotals,
  getMonthBounds,
  getMonthlyTotals,
  getMonthlyVariation,
  getSixMonthTrend,
  shiftMonth,
} from '../lib/dashboard-metrics';
import { monthLabel } from '../lib/dashboard-formatters';
import type { BudgetPeriod, DashboardOverviewProps } from '../types';
import { DashboardSummaryCards } from './dashboard-summary-cards';
import { DashboardTrendChart } from './dashboard-trend-chart';
import { DashboardBudgetsOverview } from './dashboard-budgets-overview';
import { DashboardCategoryBreakdown } from './dashboard-category-breakdown';
import { DashboardGoalsPreview } from './dashboard-goals-preview';
import { DashboardRecentTransactions } from './dashboard-recent-transactions';

export function DashboardOverview({
  balance,
  budgets,
  categories,
  goals,
  selectedMonth,
  transactions,
}: DashboardOverviewProps) {
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>('monthly');
  const router = useRouter();

  const currentTotals = getMonthlyTotals(transactions, selectedMonth);
  const previousTotals = getMonthlyTotals(
    transactions,
    shiftMonth(selectedMonth, -1),
  );
  const variation = getMonthlyVariation(currentTotals.net, previousTotals.net);
  const trend = getSixMonthTrend(transactions, selectedMonth);

  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  const incomeByCategory = getMonthlyCategoryTotals(
    transactions,
    selectedMonth,
    'income',
  );
  const expensesByCategory = getMonthlyCategoryTotals(
    transactions,
    selectedMonth,
    'expense',
  );

  const budgetTransactions = transactions.filter(
    (transaction) => transaction.transaction_type === 'expense',
  );
  const selectedBudgets = budgets
    .filter((budget) => budget.period === budgetPeriod)
    .map((budget) => ({
      budget,
      spent: calculateBudgetSpent(budget, budgetTransactions, selectedMonth),
    }))
    .sort((a, b) => b.spent / b.budget.amount - a.spent / a.budget.amount)
    .slice(0, 3);

  const prioritizedGoals = goals
    .map((goal) => ({
      goal,
      percentage: calculateGoalProgress(goal.current_amount, goal.target_amount),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4);

  const { startDate, endDate } = getMonthBounds(selectedMonth);
  const recentTransactions = transactions
    .filter(
      (transaction) =>
        transaction.transaction_date >= startDate &&
        transaction.transaction_date <= endDate,
    )
    .slice(0, 5);

  const navigateToMonth = (month: string) => {
    router.push(`/dashboard?month=${month}`);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Visão financeira</p>
          <h1 className="text-3xl font-semibold tracking-tight">Visão geral</h1>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Mês anterior"
            title="Mês anterior"
            onClick={() => navigateToMonth(shiftMonth(selectedMonth, -1))}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-w-40 capitalize"
            aria-label={`${monthLabel(selectedMonth)}. Ir para o mês atual`}
            title="Ir para o mês atual"
            onClick={() => navigateToMonth(new Date().toISOString().slice(0, 7))}
          >
            {monthLabel(selectedMonth)}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Próximo mês"
            title="Próximo mês"
            onClick={() => navigateToMonth(shiftMonth(selectedMonth, 1))}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </header>

      <DashboardSummaryCards
        balance={balance}
        income={currentTotals.income}
        expenses={currentTotals.expenses}
        variation={variation}
        selectedMonth={selectedMonth}
      />

      <section className="grid gap-4 xl:grid-cols-5">
        <DashboardTrendChart trend={trend} selectedMonth={selectedMonth} />
        <DashboardBudgetsOverview
          selectedBudgets={selectedBudgets}
          budgetPeriod={budgetPeriod}
          onBudgetPeriodChange={setBudgetPeriod}
          selectedMonth={selectedMonth}
          categoryNames={categoryNames}
        />
      </section>

      <DashboardCategoryBreakdown
        selectedMonth={selectedMonth}
        incomeByCategory={incomeByCategory}
        expensesByCategory={expensesByCategory}
        categoryNames={categoryNames}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardGoalsPreview
          goals={goals}
          prioritizedGoals={prioritizedGoals}
        />
        <DashboardRecentTransactions
          recentTransactions={recentTransactions}
          selectedMonth={selectedMonth}
          categoryNames={categoryNames}
        />
      </section>
    </div>
  );
}
