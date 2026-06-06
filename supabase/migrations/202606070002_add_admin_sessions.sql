create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  password_version_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_expires_at_idx on public.admin_sessions(expires_at);

alter table public.admin_sessions enable row level security;

grant all on public.admin_sessions to service_role;

-- Admin session validation stays in trusted Next.js server code with the service role key.
