import type { Database } from '@/types/database.types';

export type Category = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name' | 'category_type'
>;

export type CategoryType = Category['category_type'];

export type SaveCategoryInput = {
  name: string;
  category_type: CategoryType;
};
