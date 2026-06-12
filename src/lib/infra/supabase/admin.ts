import { createRequire } from "node:module";

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
  const createClient =
    input?.createClient ??
    (createRequire(import.meta.url)("@supabase/supabase-js").createClient as NonNullable<typeof input>["createClient"]);

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
