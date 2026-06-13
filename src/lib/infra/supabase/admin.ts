import { createRequire } from "node:module";

import { readSupabaseEnv } from "./env.ts";

type SupabaseAdminCreateClient = (
  url: string,
  key: string,
  options: { auth: { autoRefreshToken: boolean; persistSession: boolean } },
) => unknown;

export function createAdminSupabaseClient(input?: {
  createClient?: SupabaseAdminCreateClient;
  env?: {
    serviceRoleKey: string;
    url: string;
  };
}) {
  const env = input?.env ?? readSupabaseEnv();
  const createClient =
    input?.createClient ??
    (createRequire(import.meta.url)("@supabase/supabase-js").createClient as SupabaseAdminCreateClient);

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
