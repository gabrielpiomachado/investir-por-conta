import { createClient } from '@/lib/supabase/server';

export async function getFinancialBalance() {
  const supabase = await createClient();
  const { error: recurrenceError } = await supabase.rpc(
    'generate_due_recurring_transactions',
  );

  if (recurrenceError) {
    throw new Error('Não foi possível processar as ocorrências vencidas.');
  }

  const { data, error } = await supabase.rpc('get_consolidated_balance');

  if (error) {
    throw new Error('Não foi possível carregar o saldo consolidado.');
  }

  return data ?? 0;
}
