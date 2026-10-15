import { createClient } from '@/lib/supabase/server';
import { getFinancialBalance } from '@/lib/financial-balance';
import {
  DashboardOverview,
  getDashboardDateRange,
} from '@/features/dashboard';
import { isValidMonth } from '@/features/budgets/lib/budget-progress';

type DashboardPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const selectedMonth = isValidMonth(params.month)
    ? params.month
    : currentMonth;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Visão geral</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Faça login para visualizar sua visão geral financeira.
        </p>
      </div>
    );
  }

  let balance: number;
  try {
    balance = await getFinancialBalance();
  } catch {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Visão geral</h1>
        <p role="alert" className="mt-4 text-sm text-destructive">
          Não foi possível carregar o saldo consolidado. Tente novamente mais
          tarde.
        </p>
      </div>
    );
  }

  const { startDate, endDate } = getDashboardDateRange(selectedMonth);
  const [transactionsResult, budgetsResult, categoriesResult, goalsResult] =
    await Promise.all([
      supabase
        .from('transactions')
        .select(
          'id, category_id, transaction_type, amount, transaction_date, description, created_at',
        )
        .eq('user_id', user.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('budgets')
        .select(
          'id, user_id, category_id, period, amount, alert_thresholds, created_at, updated_at',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase.from('categories').select('id, name').eq('user_id', user.id),
      supabase
        .from('goals')
        .select('id, name, current_amount, target_amount')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true }),
    ]);

  if (
    transactionsResult.error ||
    budgetsResult.error ||
    categoriesResult.error ||
    goalsResult.error
  ) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Visão geral</h1>
        <p role="alert" className="mt-4 text-sm text-destructive">
          Não foi possível carregar seu resumo financeiro. Tente novamente mais
          tarde.
        </p>
      </div>
    );
  }

  return (
    <DashboardOverview
      balance={balance}
      budgets={budgetsResult.data ?? []}
      categories={categoriesResult.data ?? []}
      goals={goalsResult.data ?? []}
      selectedMonth={selectedMonth}
      transactions={transactionsResult.data ?? []}
    />
  );
}
