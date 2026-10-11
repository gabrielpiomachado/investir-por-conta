-- =========================================================
-- Tabela: transactions
-- =========================================================

create table public.transactions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
      default auth.uid()
      references auth.users (id)
      on delete cascade,

    category_id uuid not null
      references public.categories (id)
      on delete restrict,

    transaction_type public.category_type not null,

    amount numeric(12, 2) not null
      check (amount > 0),

    transaction_date date not null,

    description text
      check (description is null or char_length(description) <= 500),

    created_at timestamptz not null default now()
);

create index transactions_user_id_date_idx
    on public.transactions (user_id, transaction_date desc, created_at desc);

create index transactions_user_id_category_idx
    on public.transactions (user_id, category_id);

create index transactions_user_id_type_date_idx
    on public.transactions (user_id, transaction_type, transaction_date desc);

alter table public.transactions
enable row level security;

create policy transactions_select_policy
on public.transactions
for select
to authenticated
using (
    user_id = (select auth.uid())
);

create policy transactions_insert_policy
on public.transactions
for insert
to authenticated
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
