import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { SaveCategoryInput } from '../types';

export async function countAssociatedTransactions(
  supabase: SupabaseClient<Database>,
  categoryId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function deleteCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) {
    if (error.code === '23503') {
      const detail = `${error.message} ${error.details ?? ''}`.toLowerCase();
      if (detail.includes('budget')) {
        throw new Error(
          'Não é permitido excluir uma categoria que possua orçamento ativo vinculado.',
        );
      }
      if (detail.includes('recurring')) {
        throw new Error(
          'Não é permitido excluir uma categoria que possua transações recorrentes vinculadas.',
        );
      }
      throw new Error(
        'Não é permitido excluir esta categoria pois outros registros dependem dela.',
      );
    }
    throw new Error('Não foi possível excluir a categoria.');
  }
}

export async function saveCategory(
  supabase: SupabaseClient<Database>,
  data: SaveCategoryInput,
  userId: string,
  categoryId?: string,
): Promise<void> {
  if (categoryId) {
    const { error } = await supabase
      .from('categories')
      .update({ name: data.name })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Você já possui uma categoria com este nome.');
      }
      throw new Error('Não foi possível salvar a categoria.');
    }
  } else {
    const { error } = await supabase.from('categories').insert({
      name: data.name,
      category_type: data.category_type,
      user_id: userId,
    });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Você já possui uma categoria com este nome.');
      }
      throw new Error('Não foi possível salvar a categoria.');
    }
  }
}
