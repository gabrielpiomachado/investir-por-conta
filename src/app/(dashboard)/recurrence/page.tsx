import { RecurrenceManager } from '@/features/recurrence/components/recurrence-manager';
import { createClient } from '@/lib/supabase/server';

export default async function RecurrencePage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Transações recorrentes</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Faça login para visualizar suas recorrências.
        </p>
      </div>
    );
  }

  const { error: generationError } = await supabase.rpc(
    'generate_due_recurring_transactions',
  );

  if (generationError) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Transações recorrentes</h1>
        <p role="alert" className="mt-4 text-sm text-red-500">
          Não foi possível processar as ocorrências vencidas. Tente novamente
          mais tarde.
        </p>
      </div>
    );
  }

  const [categoriesResult, recurrencesResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, category_type')
      .eq('user_id', user.id)
      .order('category_type', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('next_run_date', { ascending: true }),
  ]);

  if (categoriesResult.error || recurrencesResult.error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Transações recorrentes</h1>
        <p role="alert" className="mt-4 text-sm text-red-500">
          Não foi possível carregar suas recorrências. Tente novamente mais
          tarde.
        </p>
      </div>
    );
  }

  return (
    <RecurrenceManager
      categories={categoriesResult.data ?? []}
      recurrences={recurrencesResult.data ?? []}
      defaultStartDate={new Date().toISOString().slice(0, 10)}
    />
  );
}
