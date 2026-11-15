import { createRequire } from "node:module";

import { readSupabasePublicEnv } from "./env.ts";

export type SupabaseCookieAdapter = {
  getAll: () => Array<{ name: string; value: string }>;
  // @supabase/ssr 會一併傳入不可快取的回應標頭（Cache-Control 等），需要時套用到回應上。
  setAll: (
    cookies: Array<{ name: string; options?: Record<string, unknown>; value: string }>,
    headers?: Record<string, string>,
  ) => void;
};

export function createServerSupabaseClient(input: {
  cookies: SupabaseCookieAdapter;
  createServerClient?: (
    url: string,
    key: string,
    options: {
      cookies: SupabaseCookieAdapter;
    },
  ) => unknown;
  env?: {
    anonKey: string;
    url: string;
  };
}) {
  const env = input.env ?? readSupabasePublicEnv();
  const createServerClient =
    input.createServerClient ??
    (createRequire(import.meta.url)("@supabase/ssr").createServerClient as NonNullable<
      typeof input.createServerClient
    >);

  return createServerClient(env.url, env.anonKey, {
    cookies: input.cookies,
  });
}
