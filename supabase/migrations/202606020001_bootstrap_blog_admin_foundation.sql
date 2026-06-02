create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  content_markdown text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content_markdown text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  related_project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_slug_idx on public.projects(slug);
create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_posts_slug_idx on public.blog_posts(slug);
create index if not exists blog_posts_related_project_id_idx on public.blog_posts(related_project_id);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row
execute function public.set_updated_at_timestamp();

alter table public.projects enable row level security;
alter table public.blog_posts enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.projects to anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant all on public.projects to service_role;
grant all on public.blog_posts to service_role;

-- Admin reads and writes run through the trusted Next.js server with the service role key.
-- This first slice keeps RLS focused on public published reads while admin mutations stay server-side.
create policy "public can read published projects"
on public.projects
for select
using (status = 'published');

create policy "public can read published blog posts"
on public.blog_posts
for select
using (status = 'published');
