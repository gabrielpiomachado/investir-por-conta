import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { SaveTransactionInput, TransactionRecord } from '../types';

export async function deleteTransaction(
  supabase: SupabaseClient<Database>,
  transactionId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) {
    throw new Error('Não foi possível excluir a transação.');
  }
}

export async function saveTransaction(
  supabase: SupabaseClient<Database>,
  payload: SaveTransactionInput,
  userId: string,
  existingTransaction?: TransactionRecord,
): Promise<void> {
  const transactionValues = {
    transaction_type: payload.transaction_type,
    amount: payload.amount,
    category_id: payload.category_id,
    transaction_date: payload.transaction_date,
    description: payload.description,
  };

  if (existingTransaction) {
    const { error } = await supabase
      .from('transactions')
      .update({
        ...transactionValues,
        ...(existingTransaction.recurring_transaction_id
          ? { recurrence_occurrence_date: payload.transaction_date }
          : {}),
      })
      .eq('id', existingTransaction.id)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (error) {
      throw new Error('Não foi possível atualizar a transação.');
    }
  } else {
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      ...transactionValues,
    });

    if (error) {
      throw new Error('Não foi possível registrar a transação.');
    }
  }
}
