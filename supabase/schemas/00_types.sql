-- =========================================================
-- Tipos enumerados (Enums) da aplicação
-- =========================================================

create type public.category_type as enum (
    'income',
    'expense'
);

create type public.budget_period as enum (
    'monthly',
    'annual'
);
