-- =========================================================
-- Função RPC atômica para atualizar transações recorrentes e sincronizar histórico
-- Trata alteração de frequência e redefinição ao mudar start_date
-- =========================================================

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
