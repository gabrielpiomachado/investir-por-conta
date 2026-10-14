import { GoalsManager } from '@/features/goals/components/goals-manager';
import { getFinancialBalance } from '@/lib/financial-balance';
import { createClient } from '@/lib/supabase/server';

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Metas financeiras</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Faça login para visualizar suas metas.
        </p>
      </div>
    );
  }

  let availableBalance: number;
  try {
    availableBalance = await getFinancialBalance();
  } catch {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Metas financeiras</h1>
        <p role="alert" className="mt-4 text-sm text-destructive">
          Não foi possível carregar o saldo consolidado. Tente novamente mais
          tarde.
        </p>
      </div>
    );
  }

  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });

  if (goalsError) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Metas financeiras</h1>
        <p role="alert" className="mt-4 text-sm text-destructive">
          Não foi possível carregar suas metas.
        </p>
      </div>
    );
  }

  return (
    <GoalsManager goals={goals ?? []} availableBalance={availableBalance} />
  );
}
