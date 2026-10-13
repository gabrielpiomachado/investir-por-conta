import { BudgetsManager } from '@/features/budgets/components/budgets-manager';
import {
  getMonthDates,
  isValidMonth,
} from '@/features/budgets/lib/budget-progress';
import { createClient } from '@/lib/supabase/server';

type BudgetsPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const params = await searchParams;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const selectedMonth = isValidMonth(params.month)
    ? params.month
    : currentMonth;
  const { startDate, endDate } = getMonthDates(selectedMonth);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Orçamentos</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Faça login para visualizar seus orçamentos.
        </p>
      </div>
    );
  }

  const [budgetsResult, categoriesResult, transactionsResult] =
    await Promise.all([
      supabase
        .from('budgets')
        .select(
          'id, user_id, category_id, period, amount, alert_thresholds, created_at, updated_at',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('categories')
        .select('id, name, category_type')
        .eq('user_id', user.id)
        .eq('category_type', 'expense')
        .order('name', { ascending: true }),
      supabase
        .from('transactions')
        .select('category_id, amount, transaction_date')
        .eq('user_id', user.id)
        .eq('transaction_type', 'expense')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate),
    ]);

  if (
    budgetsResult.error ||
    categoriesResult.error ||
    transactionsResult.error
  ) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Orçamentos</h1>
        <p role="alert" className="mt-4 text-sm text-destructive">
          Não foi possível carregar seus orçamentos. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <BudgetsManager
      budgets={budgetsResult.data ?? []}
      categories={categoriesResult.data ?? []}
      transactions={transactionsResult.data ?? []}
      selectedMonth={selectedMonth}
    />
  );
}
