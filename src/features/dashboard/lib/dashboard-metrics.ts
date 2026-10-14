import type { Database } from '@/types/database.types';

export type DashboardTransaction = Pick<
  Database['public']['Tables']['transactions']['Row'],
  'amount' | 'category_id' | 'transaction_date' | 'transaction_type'
>;

export type CategoryTotal = {
  categoryId: string;
  amount: number;
};

export type MonthlyTotals = {
  income: number;
  expenses: number;
  net: number;
};

export type MonthlyTrend = MonthlyTotals & {
  month: string;
};

export function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getMonthBounds(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const endDate = new Date(Date.UTC(year, monthNumber, 0))
    .toISOString()
    .slice(0, 10);

  return { startDate: `${month}-01`, endDate };
}

export function getDashboardDateRange(month: string) {
  const previousMonth = shiftMonth(month, -1);
  const chartStartMonth = shiftMonth(month, -5);
  const yearStart = `${month.slice(0, 4)}-01-01`;
  const startDate = [
    yearStart,
    `${previousMonth}-01`,
    `${chartStartMonth}-01`,
  ].sort()[0];

  return {
    startDate,
    endDate: getMonthBounds(month).endDate,
  };
}

export function getMonthlyTotals(
  transactions: DashboardTransaction[],
  month: string,
): MonthlyTotals {
  const totals = transactions.reduce(
    (current, transaction) => {
      if (!transaction.transaction_date.startsWith(`${month}-`)) {
        return current;
      }

      if (transaction.transaction_type === 'income') {
        current.income += transaction.amount;
      } else {
        current.expenses += transaction.amount;
      }

      return current;
    },
    { income: 0, expenses: 0 },
  );

  return { ...totals, net: totals.income - totals.expenses };
}

export function getMonthlyCategoryTotals(
  transactions: DashboardTransaction[],
  month: string,
  transactionType: DashboardTransaction['transaction_type'],
): CategoryTotal[] {
  const totals = new Map<string, number>();

  transactions.forEach((transaction) => {
    if (
      transaction.transaction_type !== transactionType ||
      !transaction.transaction_date.startsWith(`${month}-`)
    ) {
      return;
    }

    totals.set(
      transaction.category_id,
      (totals.get(transaction.category_id) ?? 0) + transaction.amount,
    );
  });

  return Array.from(totals, ([categoryId, amount]) => ({
    categoryId,
    amount,
  })).sort((a, b) => b.amount - a.amount);
}

export function getMonthlyVariation(currentNet: number, previousNet: number) {
  if (previousNet === 0) return null;
  return ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
}

export function getSixMonthTrend(
  transactions: DashboardTransaction[],
  month: string,
): MonthlyTrend[] {
  return Array.from({ length: 6 }, (_, index) => {
    const trendMonth = shiftMonth(month, index - 5);
    return { month: trendMonth, ...getMonthlyTotals(transactions, trendMonth) };
  });
}

export function clampPercentage(value: number) {
  return Math.min(Math.max(value, 0), 100);
}
