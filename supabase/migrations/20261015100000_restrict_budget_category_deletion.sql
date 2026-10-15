-- =========================================================
-- Altera a foreign key de budgets para categories de CASCADE para RESTRICT
-- Cumpre a regra BR-305 (Restrição de Exclusão de Categoria com Orçamento Ativo)
-- =========================================================

alter table public.budgets
  drop constraint budgets_category_id_fkey,
  add constraint budgets_category_id_fkey
    foreign key (category_id)
    references public.categories (id)
    on delete restrict;

-- =========================================================
-- Atualiza a função de limpeza antes da exclusão de usuário (BR-502 / LGPD)
-- Remove budgets antes da remoção em cascata de categories
-- =========================================================

create or replace function public.cleanup_user_data_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    delete from public.budgets
    where user_id = old.id;

    delete from public.transactions
    where user_id = old.id;

    delete from public.recurring_transactions
    where user_id = old.id;

    return old;
end;
$$;
