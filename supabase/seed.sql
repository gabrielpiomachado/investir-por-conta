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
