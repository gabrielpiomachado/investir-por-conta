import type { Database } from '@/types/database.types';

export type Budget = Database['public']['Tables']['budgets']['Row'];
export type BudgetCategory = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name' | 'category_type'
>;
export type BudgetTransaction = Pick<
  Database['public']['Tables']['transactions']['Row'],
  'amount' | 'category_id' | 'transaction_date'
>;

export function getPeriodBounds(period: Budget['period'], month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const endDate = new Date(Date.UTC(year, monthNumber, 0))
    .toISOString()
    .slice(0, 10);

  return {
    startDate: period === 'annual' ? `${year}-01-01` : `${month}-01`,
    endDate,
  };
}

export function calculateBudgetSpent(
  budget: Budget,
  transactions: BudgetTransaction[],
  month: string,
) {
  const { startDate, endDate } = getPeriodBounds(budget.period, month);

  return transactions.reduce((total, transaction) => {
    if (
      transaction.category_id === budget.category_id &&
      transaction.transaction_date >= startDate &&
      transaction.transaction_date <= endDate
    ) {
      return total + transaction.amount;
    }
    return total;
  }, 0);
}

export function getCrossedThresholds(
  previousSpent: number,
  currentSpent: number,
  limit: number,
  thresholds: number[],
) {
  return thresholds.filter(
    (threshold) =>
      (previousSpent / limit) * 100 < threshold &&
      (currentSpent / limit) * 100 >= threshold,
  );
}

export function getMonthDates(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const endDate = new Date(Date.UTC(year, monthNumber, 0))
    .toISOString()
    .slice(0, 10);

  return { startDate: `${year}-01-01`, endDate };
}

export function isValidMonth(value: string | undefined): value is string {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const [year, month] = value.split('-').map(Number);
  return year >= 1900 && year <= 9999 && month >= 1 && month <= 12;
}
