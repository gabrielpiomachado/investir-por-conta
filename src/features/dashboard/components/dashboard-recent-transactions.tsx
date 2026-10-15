import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  currencyFormatter,
  formatDate,
  monthLabel,
} from '../lib/dashboard-formatters';
import type { DashboardTransactionRow } from '../types';

type DashboardRecentTransactionsProps = {
  recentTransactions: DashboardTransactionRow[];
  selectedMonth: string;
  categoryNames: Map<string, string>;
};

export function DashboardRecentTransactions({
  recentTransactions,
  selectedMonth,
  categoryNames,
}: DashboardRecentTransactionsProps) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Transações do mês</CardTitle>
        <CardDescription>{monthLabel(selectedMonth)}</CardDescription>
        <Link
          href="/transactions"
          className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Ver todas
        </Link>
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
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    }`}
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
                    className={`shrink-0 text-sm font-medium tabular-nums ${
                      isIncome
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-foreground'
                    }`}
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
  );
}
