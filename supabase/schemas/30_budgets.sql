-- =========================================================
-- Tabela: budgets
-- =========================================================

create table public.budgets (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
      default auth.uid()
      references auth.users (id)
      on delete cascade,

    category_id uuid not null
      references public.categories (id)
      on delete restrict,

    period public.budget_period not null,

    amount numeric(12, 2) not null
      check (amount > 0),

    alert_thresholds integer[] not null
      default array[80, 100],

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint budgets_alert_thresholds_check check (
      cardinality(alert_thresholds) <= 100
      and 1 <= all(alert_thresholds)
      and 100 >= all(alert_thresholds)
      and array_position(alert_thresholds, null) is null
    )
);

-- =========================================================
-- Índices
-- =========================================================

create unique index budgets_category_id_unique_idx
    on public.budgets (category_id);

create index budgets_user_id_idx
    on public.budgets (user_id);

-- =========================================================
-- Políticas de Segurança (Row Level Security)
-- =========================================================

alter table public.budgets
    enable row level security;

create policy budgets_select_policy
    on public.budgets
    for select
    to authenticated
    using (user_id = (select auth.uid()));

create policy budgets_insert_policy
    on public.budgets
    for insert
    to authenticated
    with check (
        user_id = (select auth.uid())
        and exists (
            select 1
            from public.categories
            where categories.id = budgets.category_id
              and categories.user_id = (select auth.uid())
              and categories.category_type = 'expense'
        )
    );

create policy budgets_update_policy
    on public.budgets
    for update
    to authenticated
    using (user_id = (select auth.uid()))
    with check (
        user_id = (select auth.uid())
        and exists (
            select 1
            from public.categories
            where categories.id = budgets.category_id
              and categories.user_id = (select auth.uid())
              and categories.category_type = 'expense'
        )
    );

create policy budgets_delete_policy
    on public.budgets
    for delete
    to authenticated
    using (user_id = (select auth.uid()));
