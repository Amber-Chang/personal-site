import { cookies } from "next/headers";
import { createAdminAuthCallbackHandler } from "@/lib/auth/admin-auth-callback-route.ts";
import { readSupabaseEnv } from "@/lib/infra/supabase/env.ts";
import { createServerSupabaseClient } from "@/lib/infra/supabase/server.ts";

export const GET = createAdminAuthCallbackHandler({
  cookies,
  createServerSupabaseClient: (input) =>
    createServerSupabaseClient(input) as Parameters<typeof createAdminAuthCallbackHandler>[0]["createServerSupabaseClient"] extends (
      ...args: never[]
    ) => infer TResult
      ? TResult
      : never,
  readSupabaseEnv,
});
