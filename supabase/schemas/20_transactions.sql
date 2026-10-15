-- =========================================================
-- Tabela: recurring_transactions
-- =========================================================

create table public.recurring_transactions (
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

    frequency text not null
      check (frequency in ('daily', 'weekly', 'monthly')),

    start_date date not null,

    next_run_date date not null,

    monthly_anchor_day smallint not null
      check (monthly_anchor_day between 1 and 31),

    description text
      check (description is null or char_length(description) <= 500),

    is_active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    unique (id, user_id),
    check (next_run_date >= start_date),
    check (monthly_anchor_day = extract(day from start_date)::integer)
);

create index recurring_transactions_user_active_idx
    on public.recurring_transactions (user_id, next_run_date)
    where is_active;

alter table public.recurring_transactions
    enable row level security;

create policy recurring_transactions_select_policy
    on public.recurring_transactions
    for select
    to authenticated
    using (user_id = (select auth.uid()));

create policy recurring_transactions_insert_policy
    on public.recurring_transactions
    for insert
    to authenticated
    with check (
        user_id = (select auth.uid())
        and exists (
            select 1
            from public.categories
            where categories.id = recurring_transactions.category_id
              and categories.user_id = (select auth.uid())
              and categories.category_type = recurring_transactions.transaction_type
        )
    );

create policy recurring_transactions_update_policy
    on public.recurring_transactions
    for update
    to authenticated
    using (user_id = (select auth.uid()))
    with check (
        user_id = (select auth.uid())
        and exists (
            select 1
            from public.categories
            where categories.id = recurring_transactions.category_id
              and categories.user_id = (select auth.uid())
              and categories.category_type = recurring_transactions.transaction_type
        )
    );

create policy recurring_transactions_delete_policy
    on public.recurring_transactions
    for delete
    to authenticated
    using (
        user_id = (select auth.uid())
    );

grant delete on table public.recurring_transactions to authenticated;

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
      on delete cascade,

    transaction_type public.category_type not null,

    amount numeric(12, 2) not null
      check (amount > 0),

    transaction_date date not null,

    description text
      check (description is null or char_length(description) <= 500),

    created_at timestamptz not null default now(),

    recurring_transaction_id uuid,

    recurrence_occurrence_date date,

    constraint transactions_recurrence_link_check
      check (
          (recurring_transaction_id is null and recurrence_occurrence_date is null)
          or (
              recurring_transaction_id is not null
              and recurrence_occurrence_date is not null
              and recurrence_occurrence_date = transaction_date
          )
      ),

    constraint transactions_recurrence_owner_fkey
      foreign key (recurring_transaction_id, user_id)
      references public.recurring_transactions (id, user_id)
      on delete restrict,

    constraint transactions_recurrence_occurrence_unique
      unique (recurring_transaction_id, recurrence_occurrence_date)
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
        and recurring_transaction_id is null
        and recurrence_occurrence_date is null
        and exists (
            select 1
            from public.categories
            where categories.id = transactions.category_id
              and categories.user_id = (select auth.uid())
              and categories.category_type = transactions.transaction_type
        )
    );

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
