import { readSupabaseEnv } from "../infra/supabase/env.ts";
import { ADMIN_SESSION_COOKIE_NAME } from "./session.ts";
import type { AdminSessionRecord, AdminSessionRepository } from "./session.ts";
import { createAdminSessionManager } from "./session.ts";
import { hashAdminSessionToken } from "./session.ts";

type AdminSessionQueryClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => {
      select: () => {
        single: () => Promise<{ error: Error | null }>;
      };
    };
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => Promise<{
          data:
            | {
                expires_at: string;
                password_version_hash: string;
                session_token_hash: string;
              }
            | null;
          error: Error | null;
        }>;
      };
    };
    delete: () => {
      eq: (column: string, value: unknown) => Promise<{ error: Error | null }>;
    };
  };
};

export async function createAdminSessionRepository(input?: {
  createAdminClient?: () => AdminSessionQueryClient;
}): Promise<AdminSessionRepository> {
  const client =
    input?.createAdminClient?.() ??
    ((await import("../infra/supabase/admin.ts")).createAdminSupabaseClient() as AdminSessionQueryClient);

  return {
    async createSession(session: AdminSessionRecord) {
      const { error } = await client
        .from("admin_sessions")
        .insert({
          expires_at: session.expiresAt,
          password_version_hash: session.passwordVersionHash,
          session_token_hash: session.sessionTokenHash,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
    },
    async getSessionByTokenHash(sessionTokenHash: string) {
      const { data, error } = await client
        .from("admin_sessions")
        .select("session_token_hash, password_version_hash, expires_at")
        .eq("session_token_hash", sessionTokenHash)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        expiresAt: data.expires_at,
        passwordVersionHash: data.password_version_hash,
        sessionTokenHash: data.session_token_hash,
      };
    },
    async deleteSessionByTokenHash(sessionTokenHash: string) {
      const { error } = await client.from("admin_sessions").delete().eq("session_token_hash", sessionTokenHash);

      if (error) {
        throw error;
      }
    },
  };
}

export async function createAdminServerSession(input: {
  adminPassword: string;
}): Promise<string> {
  const manager = createAdminSessionManager({
    repository: await createAdminSessionRepository(),
  });

  return manager.createSession({
    adminPassword: input.adminPassword,
  });
}

export async function hasActiveAdminSession(input?: {
  adminPassword?: string;
  cookieStore?: {
    get: (name: string) => { value: string } | undefined;
  };
  repository?: AdminSessionRepository;
}): Promise<boolean> {
  const env = readSupabaseEnv();
  let resolvedCookieStore = input?.cookieStore;

  if (!resolvedCookieStore) {
    const { cookies } = await import("next/headers");
    resolvedCookieStore = await cookies();
  }

  const manager = createAdminSessionManager({
    repository: input?.repository ?? (await createAdminSessionRepository()),
  });

  return manager.hasValidSession({
    adminPassword: input?.adminPassword ?? env.adminPassword,
    sessionToken: resolvedCookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value,
  });
}

export async function clearActiveAdminSession(input?: {
  cookieStore?: {
    get: (name: string) => { value: string } | undefined;
  };
  repository?: AdminSessionRepository;
}): Promise<void> {
  let resolvedCookieStore = input?.cookieStore;

  if (!resolvedCookieStore) {
    const { cookies } = await import("next/headers");
    resolvedCookieStore = await cookies();
  }

  const rawSessionToken = resolvedCookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value?.trim();

  if (!rawSessionToken) {
    return;
  }

  await (input?.repository ?? (await createAdminSessionRepository())).deleteSessionByTokenHash(
    hashAdminSessionToken(rawSessionToken),
  );
}
