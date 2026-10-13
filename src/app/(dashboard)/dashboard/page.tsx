import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Faça login para visualizar seu dashboard.
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
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p role="alert" className="mt-4 text-sm text-red-500">
          Não foi possível processar as ocorrências vencidas. Tente novamente
          mais tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
    </div>
  );
}
