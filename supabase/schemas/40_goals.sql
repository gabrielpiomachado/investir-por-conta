-- =========================================================
-- Tabela: goals
-- =========================================================

create table public.goals (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
      default auth.uid()
      references auth.users (id)
      on delete cascade,

    name text not null,

    target_amount numeric(12, 2) not null
      check (target_amount > 0),

    current_amount numeric(12, 2) not null
      default 0
      check (current_amount >= 0),

    target_date date,

    status text not null
      default 'active'
      check (status in ('active', 'completed')),

    completed_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    unique (id, user_id),

    check (char_length(trim(name)) between 3 and 40),

    check (
      (status = 'active' and completed_at is null)
      or (status = 'completed' and completed_at is not null)
    )
);

create index goals_user_status_created_idx
    on public.goals (user_id, status, created_at desc);

-- =========================================================
-- Tabela: goal_contributions
-- =========================================================

create table public.goal_contributions (
    id uuid primary key default gen_random_uuid(),

    goal_id uuid not null,

    user_id uuid not null
      default auth.uid()
      references auth.users (id)
      on delete cascade,

    amount numeric(12, 2) not null
      check (amount > 0),

    description text
      check (description is null or char_length(description) <= 500),

    created_at timestamptz not null default now(),

    constraint goal_contributions_goal_owner_fkey
      foreign key (goal_id, user_id)
      references public.goals (id, user_id)
      on delete cascade
);

create index goal_contributions_user_goal_created_idx
    on public.goal_contributions (user_id, goal_id, created_at desc);

-- =========================================================
-- Políticas de Segurança (Row Level Security) e Permissões
-- =========================================================

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;

create policy goals_select_policy
    on public.goals
    for select
    to authenticated
    using (user_id = (select auth.uid()));

create policy goal_contributions_select_policy
    on public.goal_contributions
    for select
    to authenticated
    using (user_id = (select auth.uid()));

revoke all on table public.goals, public.goal_contributions from anon, authenticated;
grant select on table public.goals, public.goal_contributions to authenticated;
