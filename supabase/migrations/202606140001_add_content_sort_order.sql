alter table public.blog_posts
add column if not exists sort_order integer;

with ranked_blog_posts as (
  select
    id,
    row_number() over (
      order by published_at desc nulls last, updated_at desc
    ) as sort_order
  from public.blog_posts
)
update public.blog_posts as blog_posts
set sort_order = ranked_blog_posts.sort_order
from ranked_blog_posts
where blog_posts.id = ranked_blog_posts.id
  and blog_posts.sort_order is null;

alter table public.blog_posts
alter column sort_order set not null;

alter table public.blog_posts
alter column sort_order set default 2147483647;

create index if not exists blog_posts_sort_order_idx
on public.blog_posts (sort_order);

alter table public.projects
add column if not exists sort_order integer;

with ranked_projects as (
  select
    id,
    row_number() over (
      order by title asc, updated_at desc
    ) as sort_order
  from public.projects
)
update public.projects as projects
set sort_order = ranked_projects.sort_order
from ranked_projects
where projects.id = ranked_projects.id
  and projects.sort_order is null;

alter table public.projects
alter column sort_order set not null;

alter table public.projects
alter column sort_order set default 2147483647;

create index if not exists projects_sort_order_idx
on public.projects (sort_order);

create or replace function public.reorder_blog_posts(ids_in_order uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.blog_posts as blog_posts
  set sort_order = ordered.sort_order
  from unnest(ids_in_order) with ordinality as ordered(id, sort_order)
  where blog_posts.id = ordered.id;
$$;

grant execute on function public.reorder_blog_posts(uuid[]) to service_role;

create or replace function public.reorder_projects(ids_in_order uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.projects as projects
  set sort_order = ordered.sort_order
  from unnest(ids_in_order) with ordinality as ordered(id, sort_order)
  where projects.id = ordered.id;
$$;

grant execute on function public.reorder_projects(uuid[]) to service_role;
