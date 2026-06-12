import { readSupabasePublicEnv } from "./env.ts";

export async function createBrowserSupabaseClient(input?: {
  createBrowserClient?: (url: string, key: string) => unknown;
  env?: {
    anonKey: string;
    url: string;
  };
}) {
  const env = input?.env ?? readSupabasePublicEnv();
  const createBrowserClient =
    input?.createBrowserClient ??
    ((await import("@supabase/ssr")).createBrowserClient as NonNullable<typeof input>["createBrowserClient"]);

  return createBrowserClient(env.url, env.anonKey);
}
