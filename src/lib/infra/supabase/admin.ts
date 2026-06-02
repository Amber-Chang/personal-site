import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { readSupabaseEnv } from "./env.ts";

export function createAdminSupabaseClient(input?: {
  createClient?: (
    url: string,
    key: string,
    options: { auth: { autoRefreshToken: boolean; persistSession: boolean } },
  ) => unknown;
  env?: {
    serviceRoleKey: string;
    url: string;
  };
}) {
  const env = input?.env ?? readSupabaseEnv();
  const createClient = input?.createClient ?? createSupabaseClient;

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
