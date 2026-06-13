import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("readSupabaseEnv normalizes required keys and admin allowlist", async () => {
  const envModule = await loadModule<{
    readSupabaseEnv: (input?: Record<string, string | undefined>) => {
      adminAllowedEmails: string[];
      adminPassword: string;
      anonKey: string;
      serviceRoleKey: string;
      siteUrl: string;
      url: string;
    };
  }>("./env.ts", "Supabase env");

  const env = envModule.readSupabaseEnv({
    NEXT_PUBLIC_SITE_URL: "https://amber.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ADMIN_EMAILS: "owner@example.com, OWNER2@example.com  ",
    ADMIN_LOGIN_PASSWORD: "super-secret",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  });

  assert.deepEqual(env, {
    url: "https://project.supabase.co",
    anonKey: "anon-key",
    serviceRoleKey: "service-role-key",
    siteUrl: "https://amber.test",
    adminAllowedEmails: ["owner@example.com", "owner2@example.com"],
    adminPassword: "super-secret",
  });
});

test("readSupabaseEnv falls back to Vercel preview hostname when NEXT_PUBLIC_SITE_URL is missing", async () => {
  const envModule = await loadModule<{
    readSupabaseEnv: (input?: Record<string, string | undefined>) => {
      siteUrl: string;
    };
  }>("./env.ts", "Supabase env");

  const env = envModule.readSupabaseEnv({
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ADMIN_EMAILS: "owner@example.com",
    ADMIN_LOGIN_PASSWORD: "super-secret",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    VERCEL_URL: "personal-site-git-branch-user.vercel.app",
  });

  assert.equal(env.siteUrl, "https://personal-site-git-branch-user.vercel.app");
});

test("readSupabaseEnv prefers explicit NEXT_PUBLIC_SITE_URL over Vercel host fallbacks", async () => {
  const envModule = await loadModule<{
    readSupabaseEnv: (input?: Record<string, string | undefined>) => {
      siteUrl: string;
    };
  }>("./env.ts", "Supabase env");

  const env = envModule.readSupabaseEnv({
    NEXT_PUBLIC_SITE_URL: "https://amber.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ADMIN_EMAILS: "owner@example.com",
    ADMIN_LOGIN_PASSWORD: "super-secret",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    VERCEL_URL: "personal-site-git-branch-user.vercel.app",
  });

  assert.equal(env.siteUrl, "https://amber.test");
});

test("readSupabaseEnv throws when required variables are missing", async () => {
  const envModule = await loadModule<{
    MissingEnvironmentVariableError: new (name: string) => Error & { envName: string };
    readSupabaseEnv: (input?: Record<string, string | undefined>) => unknown;
  }>("./env.ts", "Supabase env");

  assert.throws(
    () =>
      envModule.readSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    (error: unknown) =>
      error instanceof envModule.MissingEnvironmentVariableError &&
      error.envName === "NEXT_PUBLIC_SUPABASE_URL",
  );
});

test("readSupabasePublicEnv only requires public runtime keys", async () => {
  const envModule = await loadModule<{
    readSupabasePublicEnv: (input?: Record<string, string | undefined>) => {
      anonKey: string;
      url: string;
    };
  }>("./env.ts", "Supabase env");

  const env = envModule.readSupabasePublicEnv({
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  });

  assert.deepEqual(env, {
    url: "https://project.supabase.co",
    anonKey: "anon-key",
  });
});

test("createPublicSupabaseClient uses the anon key without session persistence", async () => {
  const publicModule = await loadModule<{
    createPublicSupabaseClient: (input?: {
      createClient?: (url: string, key: string, options: { auth: { autoRefreshToken: boolean; persistSession: boolean } }) => unknown;
      env?: {
        anonKey: string;
        url: string;
      };
    }) => unknown;
  }>("./public.ts", "Supabase public client");

  let received:
    | {
        key: string;
        options: { auth: { autoRefreshToken: boolean; persistSession: boolean } };
        url: string;
      }
    | null = null;

  publicModule.createPublicSupabaseClient({
    env: {
      url: "https://project.supabase.co",
      anonKey: "anon-key",
    },
    createClient: (url, key, options) => {
      received = { url, key, options };
      return {};
    },
  });

  assert.deepEqual(received, {
    url: "https://project.supabase.co",
    key: "anon-key",
    options: {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  });
});

test("createBrowserSupabaseClient uses public runtime keys", async () => {
  const clientModule = await loadModule<{
    createBrowserSupabaseClient: (input?: {
      createBrowserClient?: (url: string, key: string) => unknown;
      env?: {
        anonKey: string;
        url: string;
      };
    }) => Promise<unknown>;
  }>("./client.ts", "Supabase browser client");

  let receivedArgs: [string, string] | null = null;

  await clientModule.createBrowserSupabaseClient({
    env: {
      url: "https://project.supabase.co",
      anonKey: "anon-key",
    },
    createBrowserClient: (url, key) => {
      receivedArgs = [url, key];
      return {};
    },
  });

  assert.deepEqual(receivedArgs, ["https://project.supabase.co", "anon-key"]);
});

test("createServerSupabaseClient forwards cookies adapter and public runtime keys", async () => {
  const serverModule = await loadModule<{
    createServerSupabaseClient: (input: {
      cookies: {
        getAll: () => Array<{ name: string; value: string }>;
        setAll: (cookies: Array<{ name: string; options?: Record<string, unknown>; value: string }>) => void;
      };
      createServerClient?: (
        url: string,
        key: string,
        options: {
          cookies: {
            getAll: () => Array<{ name: string; value: string }>;
            setAll: (cookies: Array<{ name: string; options?: Record<string, unknown>; value: string }>) => void;
          };
        },
      ) => unknown;
      env?: {
        anonKey: string;
        url: string;
      };
    }) => unknown;
  }>("./server.ts", "Supabase server client");

  const cookieAdapter = {
    getAll: () => [{ name: "sb", value: "token" }],
    setAll: () => undefined,
  };

  let received:
    | {
        key: string;
        optionsCookies: unknown;
        url: string;
      }
    | null = null;

  serverModule.createServerSupabaseClient({
    cookies: cookieAdapter,
    env: {
      url: "https://project.supabase.co",
      anonKey: "anon-key",
    },
    createServerClient: (url, key, options) => {
      received = {
        url,
        key,
        optionsCookies: options.cookies,
      };
      return {};
    },
  });

  assert.deepEqual(received, {
    url: "https://project.supabase.co",
    key: "anon-key",
    optionsCookies: cookieAdapter,
  });
});

test("createAdminSupabaseClient uses the service role key", async () => {
  const adminModule = await loadModule<{
    createAdminSupabaseClient: (input?: {
      createClient?: (url: string, key: string, options: { auth: { autoRefreshToken: boolean; persistSession: boolean } }) => unknown;
      env?: {
        serviceRoleKey: string;
        url: string;
      };
    }) => unknown;
  }>("./admin.ts", "Supabase admin client");

  let received:
    | {
        key: string;
        options: { auth: { autoRefreshToken: boolean; persistSession: boolean } };
        url: string;
      }
    | null = null;

  adminModule.createAdminSupabaseClient({
    env: {
      url: "https://project.supabase.co",
      serviceRoleKey: "service-role-key",
    },
    createClient: (url, key, options) => {
      received = { url, key, options };
      return {};
    },
  });

  assert.deepEqual(received, {
    url: "https://project.supabase.co",
    key: "service-role-key",
    options: {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  });
});

test("blog admin migration defines schema, RLS, and updated_at triggers", () => {
  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/202606020001_bootstrap_blog_admin_foundation.sql",
  );

  assert.equal(fs.existsSync(migrationPath), true);

  const content = fs.readFileSync(migrationPath, "utf8");

  assert.match(content, /create table if not exists public\.projects/i);
  assert.match(content, /create table if not exists public\.blog_posts/i);
  assert.match(content, /alter table public\.projects enable row level security/i);
  assert.match(content, /alter table public\.blog_posts enable row level security/i);
  assert.match(content, /create policy "public can read published blog posts"/i);
  assert.match(content, /admin reads and writes run through the trusted next\.js server with the service role key/i);
  assert.match(content, /create or replace function public\.set_updated_at_timestamp/i);
});

test("admin session hardening migration defines server-side admin session storage", () => {
  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/202606070002_add_admin_sessions.sql",
  );

  assert.equal(fs.existsSync(migrationPath), true);

  const content = fs.readFileSync(migrationPath, "utf8");

  assert.match(content, /create table if not exists public\.admin_sessions/i);
  assert.match(content, /session_token_hash text not null unique/i);
  assert.match(content, /password_version_hash text not null/i);
  assert.match(content, /expires_at timestamptz not null/i);
  assert.match(content, /grant all on public\.admin_sessions to service_role/i);
});

test("admin login attempts hardening migration defines server-side rate limit storage", () => {
  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/202606120001_add_admin_login_attempts.sql",
  );

  assert.equal(fs.existsSync(migrationPath), true);

  const content = fs.readFileSync(migrationPath, "utf8");

  assert.match(content, /create table if not exists public\.admin_login_attempts/i);
  assert.match(content, /identifier text primary key/i);
  assert.match(content, /failure_count integer not null default 0/i);
  assert.match(content, /first_failed_at timestamptz not null/i);
  assert.match(content, /grant all on public\.admin_login_attempts to service_role/i);
  assert.match(content, /set_admin_login_attempts_updated_at/i);
});

test("content sort order migration defines ordering columns and backfill rules", () => {
  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/202606140001_add_content_sort_order.sql",
  );

  assert.equal(fs.existsSync(migrationPath), true);

  const content = fs.readFileSync(migrationPath, "utf8");

  assert.match(content, /alter table public\.blog_posts\s+add column if not exists sort_order integer/i);
  assert.match(content, /alter table public\.projects\s+add column if not exists sort_order integer/i);
  assert.match(content, /alter table public\.blog_posts\s+alter column sort_order set default/i);
  assert.match(content, /alter table public\.projects\s+alter column sort_order set default/i);
  assert.match(content, /order by published_at desc nulls last, updated_at desc/i);
  assert.match(content, /order by title asc, updated_at desc/i);
  assert.match(content, /alter table public\.blog_posts\s+alter column sort_order set not null/i);
  assert.match(content, /alter table public\.projects\s+alter column sort_order set not null/i);
  assert.match(content, /create or replace function public\.reorder_blog_posts/i);
  assert.match(content, /create or replace function public\.reorder_projects/i);
});
