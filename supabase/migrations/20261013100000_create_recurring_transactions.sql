create table public.recurring_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid()
      references auth.users (id) on delete cascade,
    category_id uuid not null
      references public.categories (id) on delete restrict,
    transaction_type public.category_type not null,
    amount numeric(12, 2) not null check (amount > 0),
    frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
    start_date date not null,
    next_run_date date not null,
    monthly_anchor_day smallint not null check (monthly_anchor_day between 1 and 31),
    description text check (description is null or char_length(description) <= 500),
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

alter table public.recurring_transactions enable row level security;

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

alter table public.transactions
    add column recurring_transaction_id uuid,
    add column recurrence_occurrence_date date,
    add constraint transactions_recurrence_link_check
      check (
          (recurring_transaction_id is null and recurrence_occurrence_date is null)
          or (
              recurring_transaction_id is not null
              and recurrence_occurrence_date is not null
              and recurrence_occurrence_date = transaction_date
          )
      ),
    add constraint transactions_recurrence_owner_fkey
      foreign key (recurring_transaction_id, user_id)
      references public.recurring_transactions (id, user_id)
    on delete restrict,
    add constraint transactions_recurrence_occurrence_unique
      unique (recurring_transaction_id, recurrence_occurrence_date);

drop policy transactions_insert_policy on public.transactions;

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

create or replace function public.generate_due_recurring_transactions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_today date := (now() at time zone 'UTC')::date;
    v_series record;
    v_occurrence_date date;
    v_next_month date;
    v_month_last_day date;
    v_inserted_count integer;
    v_created_count integer := 0;
begin
    if v_user_id is null then
        raise exception 'Authentication is required.' using errcode = '42501';
    end if;

    for v_series in
        select *
        from public.recurring_transactions
        where user_id = v_user_id
          and is_active
          and next_run_date <= v_today
        order by id
        for update
    loop
        v_occurrence_date := v_series.next_run_date;

        while v_occurrence_date <= v_today loop
            insert into public.transactions (
                user_id,
                category_id,
                transaction_type,
                amount,
                transaction_date,
                description,
                recurring_transaction_id,
                recurrence_occurrence_date
            ) values (
                v_series.user_id,
                v_series.category_id,
                v_series.transaction_type,
                v_series.amount,
                v_occurrence_date,
                v_series.description,
                v_series.id,
                v_occurrence_date
            )
            on conflict (recurring_transaction_id, recurrence_occurrence_date)
            do nothing;

            get diagnostics v_inserted_count = row_count;
            v_created_count := v_created_count + v_inserted_count;

            if v_series.frequency = 'daily' then
                v_occurrence_date := v_occurrence_date + 1;
            elsif v_series.frequency = 'weekly' then
                v_occurrence_date := v_occurrence_date + 7;
            else
                v_next_month := (date_trunc('month', v_occurrence_date::timestamp) + interval '1 month')::date;
                v_month_last_day := (v_next_month + interval '1 month - 1 day')::date;
                v_occurrence_date := v_next_month + (
                    least(v_series.monthly_anchor_day, extract(day from v_month_last_day)::integer) - 1
                );
            end if;

        end loop;

        update public.recurring_transactions
        set next_run_date = v_occurrence_date,
            updated_at = now()
        where id = v_series.id;
    end loop;

    return v_created_count;
end;
$$;

revoke all on function public.generate_due_recurring_transactions() from public;
grant execute on function public.generate_due_recurring_transactions() to authenticated;
