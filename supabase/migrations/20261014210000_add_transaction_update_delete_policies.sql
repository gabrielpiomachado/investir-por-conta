create policy transactions_update_policy
on public.transactions
for update
to authenticated
using (
    user_id = (select auth.uid())
)
with check (
    user_id = (select auth.uid())
    and exists (
        select 1
        from public.categories
        where categories.id = transactions.category_id
          and categories.user_id = (select auth.uid())
          and categories.category_type = transactions.transaction_type
    )
);

create policy transactions_delete_policy
on public.transactions
for delete
to authenticated
using (
    user_id = (select auth.uid())
);

grant update, delete on table public.transactions to authenticated;
