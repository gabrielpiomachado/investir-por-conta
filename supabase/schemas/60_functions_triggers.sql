-- =========================================================
-- Funções e Triggers da Aplicação
-- =========================================================

-- ---------------------------------------------------------
-- 1. Categorias Padrão no Cadastro
-- ---------------------------------------------------------

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

revoke execute
on function public.create_default_categories()
from public, anon, authenticated;

create trigger create_default_categories_after_user_signup
after insert on auth.users
for each row
execute function public.create_default_categories();

-- ---------------------------------------------------------
-- 2. Registro de Consentimento Legal no Cadastro
-- ---------------------------------------------------------

create or replace function public.record_signup_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.raw_user_meta_data ->> 'legal_consent_accepted' is distinct from 'true' then
        raise exception 'Legal consent is required to create an account';
    end if;

    insert into public.signup_consents (user_id)
    values (new.id);

    return new;
end;
$$;

revoke execute
on function public.record_signup_consent()
from public, anon, authenticated;

create trigger record_signup_consent_after_user_signup
after insert on auth.users
for each row
execute function public.record_signup_consent();

-- ---------------------------------------------------------
-- 3. Transações Recorrentes: Geração Automática
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- 4. Transações Recorrentes: Atualização com Sincronização de Histórico
-- ---------------------------------------------------------

create or replace function public.update_recurring_transaction(
    p_recurrence_id uuid,
    p_transaction_type public.category_type,
    p_amount numeric,
    p_category_id uuid,
    p_frequency text,
    p_start_date date,
    p_description text default null,
    p_scope text default 'future'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_today date := (now() at time zone 'UTC')::date;
    v_old public.recurring_transactions%rowtype;
    v_start_date_changed boolean;
    v_frequency_changed boolean;
    v_rebuild_history boolean;
    v_occurrence_date date;
    v_next_month date;
    v_month_last_day date;
    v_next_run_date date;
    v_anchor_day smallint;
    v_dow_target integer;
    v_dow_today integer;
    v_dow_offset integer;
    v_deleted_count integer := 0;
    v_created_count integer := 0;
begin
    if v_user_id is null then
        raise exception 'Authentication is required.' using errcode = '42501';
    end if;

    if p_frequency not in ('daily', 'weekly', 'monthly') then
        raise exception 'Frequência inválida.' using errcode = 'P0001';
    end if;

    if p_amount <= 0 or p_amount > 9999999999.99 then
        raise exception 'Valor inválido.' using errcode = 'P0001';
    end if;

    -- Validar existência da categoria e autorização do usuário
    if not exists (
        select 1
        from public.categories
        where id = p_category_id
          and user_id = v_user_id
          and category_type = p_transaction_type
    ) then
        raise exception 'Categoria inválida ou não pertence ao usuário.' using errcode = 'P0001';
    end if;

    -- Bloquear registro para update concorrente
    select *
    into v_old
    from public.recurring_transactions
    where id = p_recurrence_id
      and user_id = v_user_id
      and is_active
    for update;

    if not found then
        raise exception 'Recorrência não encontrada ou inativa.' using errcode = 'P0002';
    end if;

    v_start_date_changed := (v_old.start_date <> p_start_date);
    v_frequency_changed := (v_old.frequency <> p_frequency);
    v_anchor_day := extract(day from p_start_date)::smallint;

    -- Alterar start_date SEMPRE reconstrói o histórico da série.
    -- Alterar frequência com escopo 'all' também reconstrói o histórico da série.
    v_rebuild_history := v_start_date_changed or (p_scope = 'all' and v_frequency_changed);

    if v_rebuild_history then
        -- 1. Exclui todas as ocorrências vinculadas à série
        delete from public.transactions
        where recurring_transaction_id = p_recurrence_id
          and user_id = v_user_id;

        get diagnostics v_deleted_count = row_count;

        -- 2. Gera as ocorrências desde a nova data de início até hoje
        v_occurrence_date := p_start_date;

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
                v_user_id,
                p_category_id,
                p_transaction_type,
                p_amount,
                v_occurrence_date,
                p_description,
                p_recurrence_id,
                v_occurrence_date
            );

            v_created_count := v_created_count + 1;

            if p_frequency = 'daily' then
                v_occurrence_date := v_occurrence_date + 1;
            elsif p_frequency = 'weekly' then
                v_occurrence_date := v_occurrence_date + 7;
            else
                v_next_month := (date_trunc('month', v_occurrence_date::timestamp) + interval '1 month')::date;
                v_month_last_day := (v_next_month + interval '1 month - 1 day')::date;
                v_occurrence_date := v_next_month + (
                    least(v_anchor_day, extract(day from v_month_last_day)::integer) - 1
                );
            end if;
        end loop;

        v_next_run_date := v_occurrence_date;

        -- Garante a constraint: check (next_run_date >= start_date)
        if v_next_run_date < p_start_date then
            v_next_run_date := p_start_date;
        end if;

        -- 3. Atualiza a tabela recurring_transactions
        update public.recurring_transactions
        set category_id = p_category_id,
            transaction_type = p_transaction_type,
            amount = p_amount,
            frequency = p_frequency,
            start_date = p_start_date,
            next_run_date = v_next_run_date,
            monthly_anchor_day = v_anchor_day,
            description = p_description,
            updated_at = now()
        where id = p_recurrence_id;

    elsif p_scope = 'all' then
        -- Frequência e start_date mantidos: atualiza dados cadastrais das transações passadas
        update public.transactions
        set category_id = p_category_id,
            transaction_type = p_transaction_type,
            amount = p_amount,
            description = p_description
        where recurring_transaction_id = p_recurrence_id
          and user_id = v_user_id;

        update public.recurring_transactions
        set category_id = p_category_id,
            transaction_type = p_transaction_type,
            amount = p_amount,
            monthly_anchor_day = v_anchor_day,
            description = p_description,
            updated_at = now()
        where id = p_recurrence_id;

        v_next_run_date := v_old.next_run_date;

    else
        -- Escopo 'future' e start_date inalterado:
        -- Preserva transações passadas intactas.
        -- Se a frequência mudou, calcula o próximo lançamento a partir de hoje.
        if v_frequency_changed then
            if p_frequency = 'daily' then
                v_next_run_date := v_today + 1;
            elsif p_frequency = 'weekly' then
                v_dow_target := extract(dow from p_start_date)::integer;
                v_dow_today := extract(dow from v_today)::integer;
                v_dow_offset := (v_dow_target - v_dow_today + 7) % 7;
                if v_dow_offset = 0 then
                    v_dow_offset := 7;
                end if;
                v_next_run_date := v_today + v_dow_offset;
            else
                v_next_month := (date_trunc('month', v_today::timestamp) + interval '1 month')::date;
                v_month_last_day := (v_next_month + interval '1 month - 1 day')::date;
                v_next_run_date := v_next_month + (
                    least(v_anchor_day, extract(day from v_month_last_day)::integer) - 1
                );
            end if;

            if v_next_run_date < p_start_date then
                v_next_run_date := p_start_date;
            end if;
        else
            v_next_run_date := v_old.next_run_date;
        end if;

        update public.recurring_transactions
        set category_id = p_category_id,
            transaction_type = p_transaction_type,
            amount = p_amount,
            frequency = p_frequency,
            next_run_date = v_next_run_date,
            monthly_anchor_day = v_anchor_day,
            description = p_description,
            updated_at = now()
        where id = p_recurrence_id;
    end if;

    return jsonb_build_object(
        'success', true,
        'rebuilt_history', v_rebuild_history,
        'deleted_transactions', v_deleted_count,
        'created_transactions', v_created_count,
        'next_run_date', v_next_run_date
    );
end;
$$;

revoke all on function public.update_recurring_transaction(uuid, public.category_type, numeric, uuid, text, date, text, text) from public, anon;
grant execute on function public.update_recurring_transaction(uuid, public.category_type, numeric, uuid, text, date, text, text) to authenticated;

-- ---------------------------------------------------------
-- 5. Metas Financeiras (Goals)
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- 6. Limpeza Pré-Exclusão de Usuário (LGPD / Cascata Restritiva)
-- ---------------------------------------------------------

create or replace function public.cleanup_user_data_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    delete from public.budgets
    where user_id = old.id;

    delete from public.transactions
    where user_id = old.id;

    delete from public.recurring_transactions
    where user_id = old.id;

    return old;
end;
$$;

revoke all
on function public.cleanup_user_data_before_delete()
from public, anon, authenticated;

create trigger cleanup_user_data_before_delete
before delete on auth.users
for each row
execute function public.cleanup_user_data_before_delete();
