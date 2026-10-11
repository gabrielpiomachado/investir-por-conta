import { TransactionsManager } from '@/features/transactions/components/transactions-manager';
import { createClient } from '@/lib/supabase/server';

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Transações</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Faça login para visualizar suas transações.
        </p>
      </div>
    );
  }

  const [categoriesResult, transactionsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, category_type')
      .eq('user_id', user.id)
      .order('category_type', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('transactions')
      .select(
        'id, category_id, transaction_type, amount, transaction_date, description',
      )
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ]);

  if (categoriesResult.error || transactionsResult.error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Transações</h1>
        <p className="mt-4 text-sm text-red-500">
          Não foi possível carregar suas transações. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <TransactionsManager
      categories={categoriesResult.data ?? []}
      transactions={transactionsResult.data ?? []}
    />
  );
}
