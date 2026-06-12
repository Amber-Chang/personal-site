import { createRequire } from "node:module";

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
  const createClient =
    input?.createClient ??
    (createRequire(import.meta.url)("@supabase/supabase-js").createClient as NonNullable<typeof input>["createClient"]);

  return createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
