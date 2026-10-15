-- =========================================================
-- Tabela: signup_consents
-- =========================================================

create table public.signup_consents (
    user_id uuid primary key
      references auth.users (id)
      on delete cascade,

    accepted_at timestamptz not null default now()
);

-- =========================================================
-- Políticas de Segurança (Row Level Security) e Permissões
-- =========================================================

alter table public.signup_consents
    enable row level security;

revoke all on table public.signup_consents
    from public, anon, authenticated;
