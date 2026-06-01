import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";

import { readSupabaseEnv } from "./env.ts";

export type SupabaseCookieAdapter = {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookies: Array<{ name: string; options?: Record<string, unknown>; value: string }>) => void;
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
  const env = input.env ?? readSupabaseEnv();
  const createServerClient = input.createServerClient ?? createSupabaseServerClient;

  return createServerClient(env.url, env.anonKey, {
    cookies: input.cookies,
  });
}
