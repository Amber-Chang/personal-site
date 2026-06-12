import {
  ADMIN_LOGIN_RATE_LIMIT_COOLDOWN_MS,
  ADMIN_LOGIN_RATE_LIMIT_MAX_FAILURES,
  type LoginRateLimitState,
} from "./login-rate-limit.ts";

type AdminLoginAttemptRecord = {
  blockedUntil: string | null;
  failureCount: number;
  firstFailureAt: string;
};

type AdminLoginAttemptRepository = {
  deleteAttempt: (identifier: string) => Promise<void>;
  getAttempt: (identifier: string) => Promise<AdminLoginAttemptRecord | null>;
  saveAttempt: (input: { identifier: string } & AdminLoginAttemptRecord) => Promise<void>;
};

type AdminLoginAttemptRow = {
  blocked_until: string | null;
  failure_count: number;
  first_failed_at: string;
  identifier: string;
};

type AdminLoginAttemptQueryClient = {
  from: (table: string) => {
    delete: () => {
      eq: (column: string, value: unknown) => Promise<{ error: Error | null }>;
    };
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => Promise<{
          data: AdminLoginAttemptRow | null;
          error: Error | null;
        }>;
      };
    };
    upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ error: Error | null }>;
  };
};

function createEmptyState(): LoginRateLimitState {
  return {
    blockedUntil: null,
    remainingAttempts: ADMIN_LOGIN_RATE_LIMIT_MAX_FAILURES,
  };
}

function parseTimestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }

  return new Date(value).getTime();
}

function hasActiveBlock(record: AdminLoginAttemptRecord, now: number): boolean {
  const blockedUntil = parseTimestamp(record.blockedUntil);

  return blockedUntil !== null && blockedUntil > now;
}

function hasCooldownExpired(record: AdminLoginAttemptRecord, now: number): boolean {
  return now - new Date(record.firstFailureAt).getTime() >= ADMIN_LOGIN_RATE_LIMIT_COOLDOWN_MS;
}

function mapAttemptRow(row: AdminLoginAttemptRow): AdminLoginAttemptRecord {
  return {
    blockedUntil: row.blocked_until,
    failureCount: row.failure_count,
    firstFailureAt: row.first_failed_at,
  };
}

export async function createAdminLoginAttemptRepository(input?: {
  createAdminClient?: () => AdminLoginAttemptQueryClient;
}): AdminLoginAttemptRepository {
  const client =
    input?.createAdminClient?.() ??
    ((await import("../infra/supabase/admin.ts")).createAdminSupabaseClient() as AdminLoginAttemptQueryClient);

  return {
    async deleteAttempt(identifier: string) {
      const { error } = await client.from("admin_login_attempts").delete().eq("identifier", identifier);

      if (error) {
        throw error;
      }
    },
    async getAttempt(identifier: string) {
      const { data, error } = await client
        .from("admin_login_attempts")
        .select("identifier, failure_count, first_failed_at, blocked_until")
        .eq("identifier", identifier)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapAttemptRow(data) : null;
    },
    async saveAttempt(inputValue) {
      const { error } = await client.from("admin_login_attempts").upsert(
        {
          blocked_until: inputValue.blockedUntil,
          failure_count: inputValue.failureCount,
          first_failed_at: inputValue.firstFailureAt,
          identifier: inputValue.identifier,
        },
        {
          onConflict: "identifier",
        },
      );

      if (error) {
        throw error;
      }
    },
  };
}

export function createServerAdminLoginRateLimit(input?: {
  now?: () => number;
  repository?: AdminLoginAttemptRepository;
}) {
  const now = input?.now ?? Date.now;
  const repositoryPromise = input?.repository
    ? Promise.resolve(input.repository)
    : createAdminLoginAttemptRepository();

  return {
    async getRateLimitState(identifier: string): Promise<LoginRateLimitState> {
      const repository = await repositoryPromise;
      const record = await repository.getAttempt(identifier);

      if (!record) {
        return createEmptyState();
      }

      const currentTime = now();

      if (hasActiveBlock(record, currentTime)) {
        return {
          blockedUntil: parseTimestamp(record.blockedUntil),
          remainingAttempts: Math.max(0, ADMIN_LOGIN_RATE_LIMIT_MAX_FAILURES - record.failureCount),
        };
      }

      if (hasCooldownExpired(record, currentTime)) {
        await repository.deleteAttempt(identifier);
        return createEmptyState();
      }

      return {
        blockedUntil: null,
        remainingAttempts: Math.max(0, ADMIN_LOGIN_RATE_LIMIT_MAX_FAILURES - record.failureCount),
      };
    },
    async recordFailedAttempt(identifier: string): Promise<void> {
      const repository = await repositoryPromise;
      const existing = await repository.getAttempt(identifier);
      const currentTime = now();

      if (!existing || hasCooldownExpired(existing, currentTime)) {
        await repository.saveAttempt({
          blockedUntil: null,
          failureCount: 1,
          firstFailureAt: new Date(currentTime).toISOString(),
          identifier,
        });
        return;
      }

      if (hasActiveBlock(existing, currentTime)) {
        return;
      }

      const failureCount = existing.failureCount + 1;
      const blockedUntil =
        failureCount >= ADMIN_LOGIN_RATE_LIMIT_MAX_FAILURES
          ? new Date(currentTime + ADMIN_LOGIN_RATE_LIMIT_COOLDOWN_MS).toISOString()
          : null;

      await repository.saveAttempt({
        blockedUntil,
        failureCount,
        firstFailureAt: existing.firstFailureAt,
        identifier,
      });
    },
    async resetAttempts(identifier: string): Promise<void> {
      const repository = await repositoryPromise;
      await repository.deleteAttempt(identifier);
    },
  };
}
