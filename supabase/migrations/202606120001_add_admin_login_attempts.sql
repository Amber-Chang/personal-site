create table if not exists public.admin_login_attempts (
  identifier text primary key,
  failure_count integer not null default 0,
  first_failed_at timestamptz not null,
  blocked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_blocked_until_idx on public.admin_login_attempts(blocked_until);

drop trigger if exists set_admin_login_attempts_updated_at on public.admin_login_attempts;
create trigger set_admin_login_attempts_updated_at
before update on public.admin_login_attempts
for each row
execute function public.set_updated_at_timestamp();

alter table public.admin_login_attempts enable row level security;

grant all on public.admin_login_attempts to service_role;

-- Login attempt tracking stays in trusted Next.js server code with the service role key.
