-- =========================================================
-- Enum: category_type
-- =========================================================

create type public.category_type as enum (
    'income',
    'expense'
);

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
-- Ativação do RLS
-- =========================================================

alter table public.categories
enable row level security;

-- =========================================================
-- Policy: SELECT
-- Usuários autenticados leem somente as próprias categorias
-- =========================================================

create policy categories_select_policy
on public.categories
for select
to authenticated
using (
  user_id = (select auth.uid())
);

-- =========================================================
-- Policy: INSERT
-- Usuários autenticados criam somente categorias próprias
-- =========================================================

create policy categories_insert_policy
on public.categories
for insert
to authenticated
with check (
    user_id = (select auth.uid())
);

-- =========================================================
-- Policy: UPDATE
-- Usuários autenticados alteram somente categorias próprias
-- =========================================================

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

-- =========================================================
-- Policy: DELETE
-- Usuários autenticados excluem somente categorias  próprias
-- =========================================================

create policy categories_delete_policy
on public.categories
for delete
to authenticated
using (
  user_id = (select auth.uid())
);

-- =========================================================
-- Função: criar categorias padrão para um novo usuário
-- =========================================================

create or replace function public.create_default_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.categories (
        user_id,
        name,
        category_type
    )
    values
        (new.id, 'Salário', 'income'),
        (new.id, 'Investimentos', 'income'),
        (new.id, 'Freelance', 'income'),
        (new.id, 'Outros (Receitas)', 'income'),
        (new.id, 'Alimentação', 'expense'),
        (new.id, 'Transporte', 'expense'),
        (new.id, 'Educação', 'expense'),
        (new.id, 'Moradia', 'expense'),
        (new.id, 'Lazer', 'expense'),
        (new.id, 'Saúde', 'expense'),
        (new.id, 'Outros (Despesas)', 'expense');

    return new;
end;
$$;

-- Evita que funções privilegiadas sejam executadas diretamente por usuários da API.
revoke execute
on function public.create_default_categories()
from public, anon, authenticated;

-- =========================================================
-- Trigger: executar após a criação do usuário
-- =========================================================

create trigger create_default_categories_after_user_signup
after insert on auth.users
for each row
execute function public.create_default_categories();
