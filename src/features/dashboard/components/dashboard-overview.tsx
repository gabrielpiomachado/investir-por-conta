'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  calculateBudgetSpent,
  type Budget,
} from '@/features/budgets/lib/budget-progress';
import { calculateGoalProgress } from '@/features/goals/lib/goal-progress';
import type { Database } from '@/types/database.types';
import {
  clampPercentage,
  getMonthBounds,
  getMonthlyTotals,
  getMonthlyVariation,
  getSixMonthTrend,
  shiftMonth,
  type DashboardTransaction,
} from '../lib/dashboard-metrics';

type DashboardTransactionRow = DashboardTransaction &
  Pick<
    Database['public']['Tables']['transactions']['Row'],
    'id' | 'category_id' | 'description' | 'created_at'
  >;

type DashboardCategory = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name'
>;

type DashboardGoal = Pick<
  Database['public']['Tables']['goals']['Row'],
  'id' | 'name' | 'current_amount' | 'target_amount'
>;

type DashboardOverviewProps = {
  balance: number;
  budgets: Budget[];
  categories: DashboardCategory[];
  goals: DashboardGoal[];
  selectedMonth: string;
  transactions: DashboardTransactionRow[];
};

type BudgetPeriod = Budget['period'];

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortMonthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: 'UTC',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

function monthLabel(month: string) {
  const label = monthFormatter.format(new Date(`${month}-01T12:00:00Z`));
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1);
}

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00Z`));
}

function formatMonthTick(month: string) {
  return shortMonthFormatter
    .format(new Date(`${month}-01T12:00:00Z`))
    .replace('.', '');
}

function SummaryCard({
  title,
  value,
  detail,
  tone = 'default',
}: {
  title: string;
  value: string;
  detail?: string;
  tone?: 'default' | 'positive' | 'negative';
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="pb-0">
        <CardDescription>{title}</CardDescription>
        <CardTitle
          className={`text-2xl tabular-nums ${
            tone === 'positive'
              ? 'text-emerald-700 dark:text-emerald-400'
              : tone === 'negative'
                ? 'text-destructive'
                : ''
          }`}
        >
          {value}
        </CardTitle>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </CardHeader>
    </Card>
  );
}

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
  const maxTrendValue = Math.max(
    0,
    ...trend.flatMap(({ income, expenses }) => [income, expenses]),
  );
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const budgetTransactions = transactions.filter(
    (transaction) => transaction.transaction_type === 'expense',
  );
  const selectedBudgets = budgets.filter(
    (budget) => budget.period === budgetPeriod,
  );
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
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
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
            onClick={() =>
              navigateToMonth(new Date().toISOString().slice(0, 7))
            }
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

      <section
        aria-label="Resumo financeiro"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          title="Saldo consolidado"
          value={currencyFormatter.format(balance)}
        />
        <SummaryCard
          title="Receitas"
          value={currencyFormatter.format(currentTotals.income)}
          detail={monthLabel(selectedMonth)}
          tone="positive"
        />
        <SummaryCard
          title="Despesas"
          value={currencyFormatter.format(currentTotals.expenses)}
          detail={monthLabel(selectedMonth)}
          tone="negative"
        />
        <SummaryCard
          title="Variação mensal"
          value={
            variation === null
              ? '—'
              : `${variation > 0 ? '+' : ''}${variation.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
          }
          detail={
            variation === null
              ? 'Sem base de comparação'
              : 'Resultado líquido vs. mês anterior'
          }
          tone={
            variation === null
              ? 'default'
              : variation >= 0
                ? 'positive'
                : 'negative'
          }
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <Card className="gap-0 py-0 xl:col-span-3">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base">Receitas vs. despesas</CardTitle>
            <CardDescription>
              Últimos seis meses até {monthLabel(selectedMonth)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-emerald-600" /> Receitas
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-rose-600" /> Despesas
              </span>
            </div>
            <div
              role="img"
              aria-label={`Gráfico de receitas e despesas dos últimos seis meses até ${monthLabel(selectedMonth)}`}
              className="grid grid-cols-6 gap-2"
            >
              {trend.map((item) => {
                const incomeHeight = maxTrendValue
                  ? (item.income / maxTrendValue) * 100
                  : 0;
                const expensesHeight = maxTrendValue
                  ? (item.expenses / maxTrendValue) * 100
                  : 0;

                return (
                  <div key={item.month} className="min-w-0 text-center">
                    <div className="flex h-36 items-end justify-center gap-1 border-b border-border px-1">
                      <span
                        aria-hidden="true"
                        title={`Receitas ${currencyFormatter.format(item.income)}`}
                        className="w-3 rounded-t-sm bg-emerald-600 sm:w-5"
                        style={{ height: `${incomeHeight}%` }}
                      />
                      <span
                        aria-hidden="true"
                        title={`Despesas ${currencyFormatter.format(item.expenses)}`}
                        className="w-3 rounded-t-sm bg-rose-600 sm:w-5"
                        style={{ height: `${expensesHeight}%` }}
                      />
                    </div>
                    <span className="mt-2 block truncate text-xs capitalize text-muted-foreground">
                      {formatMonthTick(item.month)}
                    </span>
                  </div>
                );
              })}
            </div>
            {maxTrendValue === 0 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Sem movimentações no período.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 xl:col-span-2">
          <CardHeader className="border-b py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  Orçamento do período
                </CardTitle>
                <CardDescription>{monthLabel(selectedMonth)}</CardDescription>
              </div>
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
                    onClick={() => setBudgetPeriod(period)}
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
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {selectedBudgets.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum orçamento{' '}
                {budgetPeriod === 'monthly' ? 'mensal' : 'anual'} cadastrado.
              </p>
            ) : (
              <ul className="divide-y">
                {selectedBudgets.map((budget) => {
                  const spent = calculateBudgetSpent(
                    budget,
                    budgetTransactions,
                    selectedMonth,
                  );
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
                          className={`shrink-0 text-xs font-semibold tabular-nums ${exceeded ? 'text-destructive' : 'text-muted-foreground'}`}
                        >
                          {exceeded ? 'Excedido' : `${Math.round(percentage)}%`}
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
                          className={`h-full rounded-full ${exceeded ? 'bg-destructive' : 'bg-primary'}`}
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
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base">Metas ativas</CardTitle>
            <CardDescription>
              {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {goals.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma meta ativa cadastrada.
              </p>
            ) : (
              <ul className="divide-y">
                {goals.map((goal) => {
                  const percentage = calculateGoalProgress(
                    goal.current_amount,
                    goal.target_amount,
                  );
                  const progress = clampPercentage(percentage);

                  return (
                    <li
                      key={goal.id}
                      className="space-y-2 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-medium">
                          {goal.name}
                        </p>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {progress.toLocaleString('pt-BR', {
                            maximumFractionDigits: 1,
                          })}
                          %
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>
                          {currencyFormatter.format(goal.current_amount)}
                        </span>
                        <span>
                          Meta: {currencyFormatter.format(goal.target_amount)}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`Progresso da meta ${goal.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        className="h-2 overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className="h-full rounded-full bg-emerald-600"
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

        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base">Transações do mês</CardTitle>
            <CardDescription>{monthLabel(selectedMonth)}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma transação neste mês.
              </p>
            ) : (
              <ul className="divide-y">
                {recentTransactions.map((transaction) => {
                  const isIncome = transaction.transaction_type === 'income';
                  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

                  return (
                    <li
                      key={transaction.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isIncome ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}
                      >
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {transaction.description ||
                            categoryNames.get(transaction.category_id) ||
                            'Transação'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {categoryNames.get(transaction.category_id) ??
                            'Categoria indisponível'}{' '}
                          · {formatDate(transaction.transaction_date)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-medium tabular-nums ${isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}
                      >
                        {isIncome ? '+' : '−'}
                        {currencyFormatter.format(transaction.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
