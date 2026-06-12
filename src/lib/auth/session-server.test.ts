import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("createAdminSessionRepository writes hashed sessions through the admin client", async () => {
  const sessionServerModule = await loadModule<{
    createAdminSessionRepository: (input?: {
      createAdminClient?: () => {
        from: (table: string) => {
          insert: (values: Record<string, unknown>) => {
            select: () => {
              single: () => Promise<{ error: null }>;
            };
          };
          select: (columns: string) => {
            eq: (column: string, value: unknown) => {
              maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: null }>;
            };
          };
          delete: () => {
            eq: (column: string, value: unknown) => Promise<{ error: null }>;
          };
        };
      };
    }) => Promise<{
      createSession: (input: {
        expiresAt: string;
        passwordVersionHash: string;
        sessionTokenHash: string;
      }) => Promise<void>;
      getSessionByTokenHash: (sessionTokenHash: string) => Promise<{
        expiresAt: string;
        passwordVersionHash: string;
        sessionTokenHash: string;
      } | null>;
      deleteSessionByTokenHash: (sessionTokenHash: string) => Promise<void>;
    }>;
  }>("./session-server.ts", "server-side admin sessions");

  const calls: Array<{ kind: "delete" | "insert" | "select"; payload: Record<string, unknown>; table: string }> = [];

  const repository = await sessionServerModule.createAdminSessionRepository({
    createAdminClient: () => ({
      from: (table) => ({
        insert: (values) => {
          calls.push({
            kind: "insert",
            table,
            payload: values,
          });

          return {
            select: () => ({
              single: async () => ({ error: null }),
            }),
          };
        },
        select: (columns) => ({
          eq: (column, value) => {
            calls.push({
              kind: "select",
              table,
              payload: {
                columns,
                column,
                value,
              },
            });

            return {
              maybeSingle: async () => ({
                data: {
                  expires_at: "2026-06-14T12:00:00.000Z",
                  password_version_hash: "password-version-hash",
                  session_token_hash: "token-hash",
                },
                error: null,
              }),
            };
          },
        }),
        delete: () => ({
          eq: async (column, value) => {
            calls.push({
              kind: "delete",
              table,
              payload: {
                column,
                value,
              },
            });

            return { error: null };
          },
        }),
      }),
    }),
  });

  await repository.createSession({
    expiresAt: "2026-06-14T12:00:00.000Z",
    passwordVersionHash: "password-version-hash",
    sessionTokenHash: "token-hash",
  });

  const session = await repository.getSessionByTokenHash("token-hash");
  await repository.deleteSessionByTokenHash("token-hash");

  assert.deepEqual(calls, [
    {
      kind: "insert",
      table: "admin_sessions",
      payload: {
        expires_at: "2026-06-14T12:00:00.000Z",
        password_version_hash: "password-version-hash",
        session_token_hash: "token-hash",
      },
    },
    {
      kind: "select",
      table: "admin_sessions",
      payload: {
        columns: "session_token_hash, password_version_hash, expires_at",
        column: "session_token_hash",
        value: "token-hash",
      },
    },
    {
      kind: "delete",
      table: "admin_sessions",
      payload: {
        column: "session_token_hash",
        value: "token-hash",
      },
    },
  ]);

  assert.deepEqual(session, {
    expiresAt: "2026-06-14T12:00:00.000Z",
    passwordVersionHash: "password-version-hash",
    sessionTokenHash: "token-hash",
  });
});

test("clearActiveAdminSession deletes the current server-side session when a cookie is present", async () => {
  const sessionServerModule = await loadModule<{
    clearActiveAdminSession: (input: {
      cookieStore: {
        get: (name: string) => { value: string } | undefined;
      };
      repository: {
        deleteSessionByTokenHash: (sessionTokenHash: string) => Promise<void>;
      };
    }) => Promise<void>;
  }>("./session-server.ts", "server-side admin sessions");
  const sessionModule = await loadModule<{
    hashAdminSessionToken: (sessionToken: string) => string;
  }>("./session.ts", "admin session");

  const deletedTokenHashes: string[] = [];

  await sessionServerModule.clearActiveAdminSession({
    cookieStore: {
      get: () => ({ value: "server-session-token" }),
    },
    repository: {
      deleteSessionByTokenHash: async (sessionTokenHash) => {
        deletedTokenHashes.push(sessionTokenHash);
      },
    },
  });

  assert.deepEqual(deletedTokenHashes, [sessionModule.hashAdminSessionToken("server-session-token")]);
});
