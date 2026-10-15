-- =========================================================
-- Tabela: categories
-- =========================================================

create table public.categories (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
      default auth.uid()
      references auth.users (id)
      on delete cascade,

    name text not null,

    category_type public.category_type not null,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint categories_name_length_check
      check (
        char_length(trim(name)) between 3 and 40
      )
);

-- =========================================================
-- Índices
-- =========================================================

create unique index categories_user_id_name_unique_idx
    on public.categories (user_id, lower(trim(name)));

create index categories_user_id_idx
    on public.categories (user_id);

create index categories_user_id_category_type_idx
    on public.categories (
        user_id,
        category_type
    );

-- =========================================================
-- Políticas de Segurança (Row Level Security)
-- =========================================================

alter table public.categories
    enable row level security;

create policy categories_select_policy
    on public.categories
    for select
    to authenticated
    using (
        user_id = (select auth.uid())
    );

create policy categories_insert_policy
    on public.categories
    for insert
    to authenticated
    with check (
        user_id = (select auth.uid())
    );

create policy categories_update_policy
    on public.categories
    for update
    to authenticated
    using (
        user_id = (select auth.uid())
    )
    with check (
        user_id = (select auth.uid())
    );

create policy categories_delete_policy
    on public.categories
    for delete
    to authenticated
    using (
        user_id = (select auth.uid())
    );
