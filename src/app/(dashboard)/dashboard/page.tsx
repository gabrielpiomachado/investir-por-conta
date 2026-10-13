import { createClient } from '@/lib/supabase/server';
import { getFinancialBalance } from '@/lib/financial-balance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

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

  let balance: number;
  try {
    balance = await getFinancialBalance();
  } catch (error: unknown) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Visão geral</h1>
        <p role="alert" className="mt-4 text-sm text-red-500">
          {error instanceof Error
            ? error.message
            : 'Não foi possível carregar o saldo consolidado.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-semibold">Visão geral</h1>
      <Card className="max-w-xl gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Saldo consolidado</CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <p className="text-3xl font-semibold tabular-nums">
            {currencyFormatter.format(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
