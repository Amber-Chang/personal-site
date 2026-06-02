import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

import { readSupabasePublicEnv } from "./env.ts";

export function createBrowserSupabaseClient(input?: {
  createBrowserClient?: (url: string, key: string) => unknown;
  env?: {
    anonKey: string;
    url: string;
  };
}) {
  const env = input?.env ?? readSupabasePublicEnv();
  const createBrowserClient = input?.createBrowserClient ?? createSupabaseBrowserClient;

  return createBrowserClient(env.url, env.anonKey);
}
