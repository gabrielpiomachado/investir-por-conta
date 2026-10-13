import type { Database } from '@/types/database.types';

export type Goal = Database['public']['Tables']['goals']['Row'];
export type GoalContribution = Pick<
  Database['public']['Tables']['goal_contributions']['Row'],
  'id' | 'amount' | 'description' | 'created_at'
>;
