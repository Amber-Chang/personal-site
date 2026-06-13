import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("server admin login rate limit blocks after repeated failures and resets after cooldown", async () => {
  const rateLimitModule = await loadModule<{
    createServerAdminLoginRateLimit: (input?: {
      now?: () => number;
      repository?: {
        deleteAttempt: (identifier: string) => Promise<void>;
        getAttempt: (identifier: string) => Promise<{
          blockedUntil: string | null;
          failureCount: number;
          firstFailureAt: string;
        } | null>;
        saveAttempt: (input: {
          blockedUntil: string | null;
          failureCount: number;
          firstFailureAt: string;
          identifier: string;
        }) => Promise<void>;
      };
    }) => {
      getRateLimitState: (identifier: string) => Promise<{ blockedUntil: number | null; remainingAttempts: number }>;
      recordFailedAttempt: (identifier: string) => Promise<void>;
      resetAttempts: (identifier: string) => Promise<void>;
    };
  }>("./login-rate-limit-server.ts", "server login rate limit");

  const storedAttempts = new Map<
    string,
    {
      blockedUntil: string | null;
      failureCount: number;
      firstFailureAt: string;
    }
  >();
  let currentTime = Date.parse("2026-06-12T12:00:00.000Z");

  const rateLimit = rateLimitModule.createServerAdminLoginRateLimit({
    now: () => currentTime,
    repository: {
      deleteAttempt: async (identifier) => {
        storedAttempts.delete(identifier);
      },
      getAttempt: async (identifier) => storedAttempts.get(identifier) ?? null,
      saveAttempt: async (input) => {
        storedAttempts.set(input.identifier, {
          blockedUntil: input.blockedUntil,
          failureCount: input.failureCount,
          firstFailureAt: input.firstFailureAt,
        });
      },
    },
  });

  for (let index = 0; index < 5; index += 1) {
    await rateLimit.recordFailedAttempt("127.0.0.1");
  }

  const blockedState = await rateLimit.getRateLimitState("127.0.0.1");

  assert.equal(blockedState.remainingAttempts, 0);
  assert.ok(blockedState.blockedUntil !== null);

  currentTime += 15 * 60 * 1000 + 1;

  const resetState = await rateLimit.getRateLimitState("127.0.0.1");

  assert.deepEqual(resetState, {
    blockedUntil: null,
    remainingAttempts: 5,
  });
  assert.equal(storedAttempts.has("127.0.0.1"), false);
});

test("createAdminLoginAttemptRepository persists attempt rows through the admin client", async () => {
  const rateLimitModule = await loadModule<{
    createAdminLoginAttemptRepository: (input?: {
      createAdminClient?: () => {
        from: (table: string) => {
          delete: () => {
            eq: (column: string, value: unknown) => Promise<{ error: null }>;
          };
          select: (columns: string) => {
            eq: (column: string, value: unknown) => {
              maybeSingle: () => Promise<{
                data: {
                  blocked_until: string | null;
                  failure_count: number;
                  first_failed_at: string;
                  identifier: string;
                } | null;
                error: null;
              }>;
            };
          };
          upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ error: null }>;
        };
      };
    }) => Promise<{
      deleteAttempt: (identifier: string) => Promise<void>;
      getAttempt: (identifier: string) => Promise<{
        blockedUntil: string | null;
        failureCount: number;
        firstFailureAt: string;
      } | null>;
      saveAttempt: (input: {
        blockedUntil: string | null;
        failureCount: number;
        firstFailureAt: string;
        identifier: string;
      }) => Promise<void>;
    }>;
  }>("./login-rate-limit-server.ts", "server login rate limit");

  const calls: Array<{ kind: "delete" | "select" | "upsert"; payload: Record<string, unknown>; table: string }> = [];

  const repository = await rateLimitModule.createAdminLoginAttemptRepository({
    createAdminClient: () => ({
      from: (table) => ({
        delete: () => ({
          eq: async (column, value) => {
            calls.push({
              kind: "delete",
              payload: { column, value },
              table,
            });

            return { error: null };
          },
        }),
        select: (columns) => ({
          eq: (column, value) => ({
            maybeSingle: async () => {
              calls.push({
                kind: "select",
                payload: { column, columns, value },
                table,
              });

              return {
                data: {
                  blocked_until: "2026-06-12T12:15:00.000Z",
                  failure_count: 5,
                  first_failed_at: "2026-06-12T12:00:00.000Z",
                  identifier: "127.0.0.1",
                },
                error: null,
              };
            },
          }),
        }),
        upsert: async (values, options) => {
          calls.push({
            kind: "upsert",
            payload: {
              ...values,
              onConflict: options?.onConflict ?? null,
            },
            table,
          });

          return { error: null };
        },
      }),
    }),
  });

  await repository.saveAttempt({
    blockedUntil: "2026-06-12T12:15:00.000Z",
    failureCount: 5,
    firstFailureAt: "2026-06-12T12:00:00.000Z",
    identifier: "127.0.0.1",
  });

  const record = await repository.getAttempt("127.0.0.1");
  await repository.deleteAttempt("127.0.0.1");

  assert.deepEqual(calls, [
    {
      kind: "upsert",
      payload: {
        blocked_until: "2026-06-12T12:15:00.000Z",
        failure_count: 5,
        first_failed_at: "2026-06-12T12:00:00.000Z",
        identifier: "127.0.0.1",
        onConflict: "identifier",
      },
      table: "admin_login_attempts",
    },
    {
      kind: "select",
      payload: {
        column: "identifier",
        columns: "identifier, failure_count, first_failed_at, blocked_until",
        value: "127.0.0.1",
      },
      table: "admin_login_attempts",
    },
    {
      kind: "delete",
      payload: {
        column: "identifier",
        value: "127.0.0.1",
      },
      table: "admin_login_attempts",
    },
  ]);

  assert.deepEqual(record, {
    blockedUntil: "2026-06-12T12:15:00.000Z",
    failureCount: 5,
    firstFailureAt: "2026-06-12T12:00:00.000Z",
  });
});
