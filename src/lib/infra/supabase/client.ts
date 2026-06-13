import { readSupabasePublicEnv } from "./env.ts";

type SupabaseBrowserCreateClient = (url: string, key: string) => unknown;

export async function createBrowserSupabaseClient(input?: {
  createBrowserClient?: SupabaseBrowserCreateClient;
  env?: {
    anonKey: string;
    url: string;
  };
}): Promise<unknown> {
  const env = input?.env ?? readSupabasePublicEnv();
  const createBrowserClient =
    input?.createBrowserClient ??
    ((await import("@supabase/ssr")).createBrowserClient as SupabaseBrowserCreateClient);

  return createBrowserClient(env.url, env.anonKey);
}
