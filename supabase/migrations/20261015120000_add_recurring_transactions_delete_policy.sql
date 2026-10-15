-- =========================================================
-- Adiciona política RLS de exclusão para recurring_transactions
-- Permite que usuários autenticados excluam suas próprias recorrências
-- =========================================================

create policy recurring_transactions_delete_policy
on public.recurring_transactions
for delete
to authenticated
using (
    user_id = (select auth.uid())
);

grant delete on table public.recurring_transactions to authenticated;
