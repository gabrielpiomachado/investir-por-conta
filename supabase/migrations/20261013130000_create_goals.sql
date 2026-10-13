create table public.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid()
      references auth.users (id) on delete cascade,
    name text not null,
    target_amount numeric(12, 2) not null check (target_amount > 0),
    current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
    target_date date,
    status text not null default 'active'
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

create table public.goal_contributions (
    id uuid primary key default gen_random_uuid(),
    goal_id uuid not null,
    user_id uuid not null default auth.uid()
      references auth.users (id) on delete cascade,
    amount numeric(12, 2) not null check (amount > 0),
    description text check (description is null or char_length(description) <= 500),
    created_at timestamptz not null default now(),
    constraint goal_contributions_goal_owner_fkey
      foreign key (goal_id, user_id)
      references public.goals (id, user_id)
      on delete cascade
);

create index goal_contributions_user_goal_created_idx
    on public.goal_contributions (user_id, goal_id, created_at desc);

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

create or replace function public.get_consolidated_balance()
returns numeric
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_balance numeric;
begin
    if v_user_id is null then
        raise exception 'Authentication is required.' using errcode = '42501';
    end if;

    select coalesce(
        sum(case when transaction_type = 'income' then amount else -amount end),
        0
    )
    into v_balance
    from public.transactions
    where user_id = v_user_id;

    select v_balance - coalesce(sum(amount), 0)
    into v_balance
    from public.goal_contributions
    where user_id = v_user_id;

    return v_balance;
end;
$$;

create or replace function public.create_goal(
    p_name text,
    p_target_amount numeric,
    p_target_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_goal_id uuid;
begin
    if v_user_id is null then
        raise exception 'Authentication is required.' using errcode = '42501';
    end if;

    insert into public.goals (user_id, name, target_amount, target_date)
    values (v_user_id, trim(p_name), p_target_amount, p_target_date)
    returning id into v_goal_id;

    return v_goal_id;
end;
$$;

create or replace function public.update_goal(
    p_goal_id uuid,
    p_name text,
    p_target_amount numeric,
    p_target_date date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_current_amount numeric;
    v_completed_at timestamptz;
begin
    if v_user_id is null then
        raise exception 'Authentication is required.' using errcode = '42501';
    end if;

    perform 1 from auth.users where id = v_user_id for update;

    select current_amount, completed_at
    into v_current_amount, v_completed_at
    from public.goals
    where id = p_goal_id and user_id = v_user_id
    for update;

    if not found then
        raise exception 'GOAL_NOT_FOUND' using errcode = 'P0002';
    end if;

    update public.goals
    set name = trim(p_name),
        target_amount = p_target_amount,
        target_date = p_target_date,
        status = case
          when v_current_amount >= p_target_amount then 'completed'
          else 'active'
        end,
        completed_at = case
          when v_current_amount >= p_target_amount then coalesce(v_completed_at, now())
          else null
        end,
        updated_at = now()
    where id = p_goal_id and user_id = v_user_id;
end;
$$;

create or replace function public.contribute_to_goal(
    p_goal_id uuid,
    p_amount numeric,
    p_description text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_available_balance numeric;
    v_current_amount numeric;
    v_target_amount numeric;
    v_status text;
    v_new_amount numeric;
begin
    if v_user_id is null then
        raise exception 'Authentication is required.' using errcode = '42501';
    end if;

    perform 1 from auth.users where id = v_user_id for update;

    select current_amount, target_amount, status
    into v_current_amount, v_target_amount, v_status
    from public.goals
    where id = p_goal_id and user_id = v_user_id
    for update;

    if not found then
        raise exception 'GOAL_NOT_FOUND' using errcode = 'P0002';
    end if;

    v_available_balance := public.get_consolidated_balance();
    if p_amount > v_available_balance then
        raise exception using
          errcode = 'P0001',
          message = 'INSUFFICIENT_BALANCE',
          detail = 'available_balance=' || v_available_balance::text;
    end if;

    insert into public.goal_contributions (
        goal_id,
        user_id,
        amount,
        description
    ) values (
        p_goal_id,
        v_user_id,
        p_amount,
        nullif(trim(p_description), '')
    );

    v_new_amount := v_current_amount + p_amount;

    update public.goals
    set current_amount = v_new_amount,
        status = case
          when v_status = 'completed' or v_new_amount >= v_target_amount
            then 'completed'
          else 'active'
        end,
        completed_at = case
          when v_status = 'completed' then completed_at
          when v_new_amount >= v_target_amount then now()
          else null
        end,
        updated_at = now()
    where id = p_goal_id and user_id = v_user_id;
end;
$$;

create or replace function public.cancel_goal(p_goal_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'Authentication is required.' using errcode = '42501';
    end if;

    perform 1 from auth.users where id = v_user_id for update;

    delete from public.goals
    where id = p_goal_id and user_id = v_user_id;

    if not found then
        raise exception 'GOAL_NOT_FOUND' using errcode = 'P0002';
    end if;
end;
$$;

create or replace function public.lock_financial_balance_for_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is not null and new.user_id <> v_user_id then
        raise exception 'A transaction must belong to the authenticated user.'
          using errcode = '42501';
    end if;

    perform 1
    from auth.users
    where id = coalesce(v_user_id, new.user_id)
    for update;
    return new;
end;
$$;

create trigger transactions_lock_financial_balance
before insert on public.transactions
for each row
execute function public.lock_financial_balance_for_transaction();

revoke all on function public.get_consolidated_balance() from public, anon;
revoke all on function public.create_goal(text, numeric, date) from public, anon;
revoke all on function public.update_goal(uuid, text, numeric, date) from public, anon;
revoke all on function public.contribute_to_goal(uuid, numeric, text) from public, anon;
revoke all on function public.cancel_goal(uuid) from public, anon;
revoke all on function public.lock_financial_balance_for_transaction() from public, anon, authenticated;

grant execute on function public.get_consolidated_balance() to authenticated;
grant execute on function public.create_goal(text, numeric, date) to authenticated;
grant execute on function public.update_goal(uuid, text, numeric, date) to authenticated;
grant execute on function public.contribute_to_goal(uuid, numeric, text) to authenticated;
grant execute on function public.cancel_goal(uuid) to authenticated;
