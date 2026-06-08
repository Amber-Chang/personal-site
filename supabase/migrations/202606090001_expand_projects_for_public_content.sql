alter table public.projects
  add column if not exists role text,
  add column if not exists period text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists outcomes text[] not null default '{}',
  add column if not exists featured boolean not null default false;
