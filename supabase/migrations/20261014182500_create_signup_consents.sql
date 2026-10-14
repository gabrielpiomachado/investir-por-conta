create table public.signup_consents (
    user_id uuid primary key
      references auth.users (id)
      on delete cascade,
    accepted_at timestamptz not null default now()
);

alter table public.signup_consents enable row level security;

revoke all on table public.signup_consents
from public, anon, authenticated;

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
