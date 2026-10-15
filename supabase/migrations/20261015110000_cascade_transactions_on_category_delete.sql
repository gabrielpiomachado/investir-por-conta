-- =========================================================
-- Altera a foreign key de transactions para categories de RESTRICT para CASCADE
-- Permite a exclusão de categoria com remoção em cascata de transações vinculadas
-- =========================================================

alter table public.transactions
  drop constraint transactions_category_id_fkey,
  add constraint transactions_category_id_fkey
    foreign key (category_id)
    references public.categories (id)
    on delete cascade;
