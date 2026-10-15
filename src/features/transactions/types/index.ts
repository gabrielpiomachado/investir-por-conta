import type { Database } from '@/types/database.types';
import type { CategoryType } from '@/features/categories';

export type TransactionRecord = Pick<
  Database['public']['Tables']['transactions']['Row'],
  | 'id'
  | 'category_id'
  | 'transaction_type'
  | 'amount'
  | 'transaction_date'
  | 'description'
  | 'recurring_transaction_id'
>;

export type Transaction = TransactionRecord;

export type TypeFilter = 'all' | CategoryType;

export type SaveTransactionInput = {
  amount: number;
  category_id: string;
  description?: string | null;
  transaction_date: string;
  transaction_type: CategoryType;
};
