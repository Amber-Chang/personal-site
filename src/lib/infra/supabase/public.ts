import { createRequire } from "node:module";

import { readSupabasePublicEnv } from "./env.ts";

type SupabasePublicCreateClient = (
  url: string,
  key: string,
  options: { auth: { autoRefreshToken: boolean; persistSession: boolean } },
) => unknown;

export function createPublicSupabaseClient(input?: {
  createClient?: SupabasePublicCreateClient;
  env?: {
    anonKey: string;
    url: string;
  };
}) {
  const env = input?.env ?? readSupabasePublicEnv();
  const createClient =
    input?.createClient ??
    (createRequire(import.meta.url)("@supabase/supabase-js").createClient as SupabasePublicCreateClient);

  return createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
