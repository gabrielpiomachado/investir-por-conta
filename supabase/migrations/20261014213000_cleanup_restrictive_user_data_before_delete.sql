create or replace function public.cleanup_user_data_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
