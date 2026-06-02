import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { readSupabasePublicEnv } from "./env.ts";

export function createPublicSupabaseClient(input?: {
  createClient?: (
    url: string,
    key: string,
    options: { auth: { autoRefreshToken: boolean; persistSession: boolean } },
  ) => unknown;
  env?: {
    anonKey: string;
    url: string;
  };
}) {
  const env = input?.env ?? readSupabasePublicEnv();
  const createClient = input?.createClient ?? createSupabaseClient;

  return createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
