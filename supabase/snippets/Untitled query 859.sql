select
    u.email,
    count(c.id) as total_categories
from auth.users u
left join public.categories c
    on c.user_id = u.id
where u.email in ('testeA@gmail.com', 'testeB@gmail.com')
group by u.email
order by u.email;