-- =========================================================
-- IDs FIXOS DOS USUÁRIOS DE TESTE
-- =========================================================

do $$
declare
    user_a_id uuid := '00000000-0000-0000-0000-000000000001';
    user_b_id uuid := '00000000-0000-0000-0000-000000000002';
begin

    -- =====================================================
    -- USUÁRIO A
    -- =====================================================

    insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    values (
        '00000000-0000-0000-0000-000000000000',
        user_a_id,
        'authenticated',
        'authenticated',
        'testeA@gmail.com',
        crypt('123456', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        created_at,
        updated_at
    )
    values (
        gen_random_uuid(),
        user_a_id,
        user_a_id,
        jsonb_build_object(
            'sub', user_a_id::text,
            'email', 'testeA@gmail.com'
        ),
        'email',
        now(),
        now()
    );

    -- =====================================================
    -- USUÁRIO B
    -- =====================================================

    insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    values (
        '00000000-0000-0000-0000-000000000000',
        user_b_id,
        'authenticated',
        'authenticated',
        'testeB@gmail.com',
        crypt('123456', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        created_at,
        updated_at
    )
    values (
        gen_random_uuid(),
        user_b_id,
        user_b_id,
        jsonb_build_object(
            'sub', user_b_id::text,
            'email', 'testeB@gmail.com'
        ),
        'email',
        now(),
        now()
    );

    -- =========================================================
    -- CATEGORIA EXTRA DO TESTE B
    -- =========================================================

    insert into public.categories (
        user_id,
        name,
        category_type
    )
    select
        id,
        'Games',
        'expense'
    from auth.users
    where email = 'testeB@gmail.com';

end $$;

-- =========================================================
-- DADOS FINANCEIROS DO USUÁRIO DE TESTE A
-- =========================================================

insert into public.categories (user_id, name, category_type)
select
    '00000000-0000-0000-0000-000000000001',
    seed.name,
    'expense'
from (values
    ('Compras'),
    ('Assinaturas'),
    ('Pets'),
    ('Viagens'),
    ('Contas')
) as seed(name)
where not exists (
    select 1
    from public.categories c
    where c.user_id = '00000000-0000-0000-0000-000000000001'
      and lower(trim(c.name)) = lower(seed.name)
);

insert into public.recurring_transactions (
    id,
    user_id,
    category_id,
    transaction_type,
    amount,
    frequency,
    start_date,
    next_run_date,
    monthly_anchor_day,
    description,
    is_active
)
select
    seed.id,
    '00000000-0000-0000-0000-000000000001',
    c.id,
    seed.transaction_type,
    seed.amount,
    'monthly',
    (
        date_trunc('month', current_date)::date
        - interval '5 months'
        + make_interval(days => seed.anchor_day - 1)
    )::date,
    (
        date_trunc('month', current_date)::date
        + interval '1 month'
        + make_interval(days => seed.anchor_day - 1)
    )::date,
    seed.anchor_day,
    seed.description,
    true
from (values
    (
        '10000000-0000-4000-8000-000000000001'::uuid,
        'Salário',
        'income'::public.category_type,
        6200.00::numeric,
        1,
        'Salário mensal'
    ),
    (
        '10000000-0000-4000-8000-000000000002'::uuid,
        'Moradia',
        'expense'::public.category_type,
        1850.00::numeric,
        5,
        'Aluguel mensal'
    ),
    (
        '10000000-0000-4000-8000-000000000003'::uuid,
        'Contas',
        'expense'::public.category_type,
        119.90::numeric,
        12,
        'Internet mensal'
    ),
    (
        '10000000-0000-4000-8000-000000000004'::uuid,
        'Assinaturas',
        'expense'::public.category_type,
        54.90::numeric,
        20,
        'Streaming mensal'
    )
) as seed(id, category_name, transaction_type, amount, anchor_day, description)
join public.categories c
  on c.user_id = '00000000-0000-0000-0000-000000000001'
 and c.name = seed.category_name
on conflict (id) do update
set category_id = excluded.category_id,
    transaction_type = excluded.transaction_type,
    amount = excluded.amount,
    frequency = excluded.frequency,
    start_date = excluded.start_date,
    next_run_date = excluded.next_run_date,
    monthly_anchor_day = excluded.monthly_anchor_day,
    description = excluded.description,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.transactions (
    id,
    user_id,
    category_id,
    transaction_type,
    amount,
    transaction_date,
    description,
    recurring_transaction_id,
    recurrence_occurrence_date
)
select
    md5('seed-teste-a-recurring-' || r.id::text || '-' || dates.occurrence::date::text)::uuid,
    r.user_id,
    r.category_id,
    r.transaction_type,
    r.amount,
    dates.occurrence::date,
    r.description,
    r.id,
    dates.occurrence::date
from public.recurring_transactions r
cross join lateral generate_series(
    r.start_date::timestamp,
    current_date::timestamp,
    interval '1 month'
) as dates(occurrence)
where r.id in (
    '10000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    '10000000-0000-4000-8000-000000000003'::uuid,
    '10000000-0000-4000-8000-000000000004'::uuid
)
on conflict (recurring_transaction_id, recurrence_occurrence_date) do nothing;

insert into public.transactions (
    id,
    user_id,
    category_id,
    transaction_type,
    amount,
    transaction_date,
    description
)
select
    md5('seed-teste-a-expense-' || seed.sequence::text)::uuid,
    '00000000-0000-0000-0000-000000000001',
    c.id,
    'expense',
    (35 + ((seed.sequence * 137) % 295))::numeric(12, 2),
    current_date - (seed.sequence * 2),
    'Despesa de teste: ' || c.name
from generate_series(1, 84) as seed(sequence)
join public.categories c
  on c.user_id = '00000000-0000-0000-0000-000000000001'
 and c.name = (array[
     'Alimentação',
     'Transporte',
     'Educação',
     'Lazer',
     'Saúde',
     'Outros (Despesas)',
     'Compras',
     'Pets',
     'Viagens',
     'Contas'
  ])[((seed.sequence - 1) % 10) + 1]
on conflict (id) do nothing;

insert into public.transactions (
    id,
    user_id,
    category_id,
    transaction_type,
    amount,
    transaction_date,
    description
)
select
    md5('seed-teste-a-freelance-' || seed.sequence::text)::uuid,
    '00000000-0000-0000-0000-000000000001',
    c.id,
    'income',
    (650 + seed.sequence * 125)::numeric(12, 2),
    (
        date_trunc('month', current_date)::date
        - make_interval(months => 6 - seed.sequence)
        + make_interval(days => least(12, extract(day from current_date)::integer) - 1)
    )::date,
    'Projeto freelance mensal'
from generate_series(1, 6) as seed(sequence)
join public.categories c
  on c.user_id = '00000000-0000-0000-0000-000000000001'
 and c.name = 'Freelance'
on conflict (id) do nothing;

insert into public.budgets (
    user_id,
    category_id,
    period,
    amount,
    alert_thresholds
)
select
    '00000000-0000-0000-0000-000000000001',
    c.id,
    seed.period,
    seed.amount,
    array[75, 90, 100]
from (values
    ('Alimentação', 'monthly'::public.budget_period, 1200.00::numeric),
    ('Transporte', 'monthly'::public.budget_period, 500.00::numeric),
    ('Educação', 'monthly'::public.budget_period, 450.00::numeric),
    ('Moradia', 'monthly'::public.budget_period, 2200.00::numeric),
    ('Lazer', 'monthly'::public.budget_period, 600.00::numeric),
    ('Saúde', 'monthly'::public.budget_period, 500.00::numeric),
    ('Compras', 'monthly'::public.budget_period, 800.00::numeric),
    ('Assinaturas', 'monthly'::public.budget_period, 250.00::numeric),
    ('Pets', 'monthly'::public.budget_period, 350.00::numeric),
    ('Viagens', 'annual'::public.budget_period, 6000.00::numeric)
) as seed(category_name, period, amount)
join public.categories c
  on c.user_id = '00000000-0000-0000-0000-000000000001'
 and c.name = seed.category_name
on conflict (category_id) do nothing;

insert into public.goals (
    id,
    user_id,
    name,
    target_amount,
    target_date
)
values
    (
        '20000000-0000-4000-8000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Reserva de emergência',
        10000.00,
        (current_date + make_interval(months => 12))::date
    ),
    (
        '20000000-0000-4000-8000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'Viagem de férias',
        5000.00,
        (current_date + make_interval(months => 8))::date
    ),
    (
        '20000000-0000-4000-8000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        'Notebook novo',
        4000.00,
        (current_date + make_interval(months => 6))::date
    )
on conflict (id) do nothing;

insert into public.goal_contributions (
    id,
    goal_id,
    user_id,
    amount,
    description,
    created_at
)
select
    md5('seed-teste-a-contribution-' || seed.goal_id::text || '-' || seed.sequence::text)::uuid,
    seed.goal_id,
    '00000000-0000-0000-0000-000000000001',
    seed.amount,
    'Aporte mensal de teste',
    (
        date_trunc('month', current_date)::date
        - make_interval(months => 6 - seed.sequence)
        + interval '2 days 12 hours'
    )::timestamptz
from (values
    ('20000000-0000-4000-8000-000000000001'::uuid, 1, 300.00::numeric),
    ('20000000-0000-4000-8000-000000000001'::uuid, 2, 400.00::numeric),
    ('20000000-0000-4000-8000-000000000001'::uuid, 3, 500.00::numeric),
    ('20000000-0000-4000-8000-000000000001'::uuid, 4, 500.00::numeric),
    ('20000000-0000-4000-8000-000000000001'::uuid, 5, 600.00::numeric),
    ('20000000-0000-4000-8000-000000000001'::uuid, 6, 700.00::numeric),
    ('20000000-0000-4000-8000-000000000002'::uuid, 1, 200.00::numeric),
    ('20000000-0000-4000-8000-000000000002'::uuid, 2, 250.00::numeric),
    ('20000000-0000-4000-8000-000000000002'::uuid, 3, 300.00::numeric),
    ('20000000-0000-4000-8000-000000000002'::uuid, 4, 350.00::numeric),
    ('20000000-0000-4000-8000-000000000002'::uuid, 5, 400.00::numeric),
    ('20000000-0000-4000-8000-000000000002'::uuid, 6, 500.00::numeric),
    ('20000000-0000-4000-8000-000000000003'::uuid, 1, 150.00::numeric),
    ('20000000-0000-4000-8000-000000000003'::uuid, 2, 200.00::numeric),
    ('20000000-0000-4000-8000-000000000003'::uuid, 3, 250.00::numeric),
    ('20000000-0000-4000-8000-000000000003'::uuid, 4, 300.00::numeric),
    ('20000000-0000-4000-8000-000000000003'::uuid, 5, 350.00::numeric),
    ('20000000-0000-4000-8000-000000000003'::uuid, 6, 450.00::numeric)
) as seed(goal_id, sequence, amount)
on conflict (id) do nothing;

update public.goals g
set current_amount = contributions.total,
    updated_at = now()
from (
    select goal_id, sum(amount) as total
    from public.goal_contributions
    where goal_id in (
        '20000000-0000-4000-8000-000000000001'::uuid,
        '20000000-0000-4000-8000-000000000002'::uuid,
        '20000000-0000-4000-8000-000000000003'::uuid
    )
    group by goal_id
) contributions
where g.id = contributions.goal_id
  and g.user_id = '00000000-0000-0000-0000-000000000001';
