import type { Database } from '@/types/database.types';
import type { Budget } from '@/features/budgets/lib/budget-progress';
import type { DashboardTransaction } from '../lib/dashboard-metrics';

export type DashboardTransactionRow = DashboardTransaction &
  Pick<
    Database['public']['Tables']['transactions']['Row'],
    'id' | 'description' | 'created_at'
  >;

export type DashboardCategory = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name'
>;

export type DashboardGoal = Pick<
  Database['public']['Tables']['goals']['Row'],
  'id' | 'name' | 'current_amount' | 'target_amount'
>;

export type BudgetPeriod = Budget['period'];

export type DashboardOverviewProps = {
  balance: number;
  budgets: Budget[];
  categories: DashboardCategory[];
  goals: DashboardGoal[];
  selectedMonth: string;
  transactions: DashboardTransactionRow[];
};
