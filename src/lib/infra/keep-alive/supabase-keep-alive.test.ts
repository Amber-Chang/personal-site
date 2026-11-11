import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type KeepAliveModule = {
  createSupabaseKeepAliveHandler: (dependencies: {
    listPublishedPosts: () => Promise<unknown[]>;
    logError?: (message: string, error?: unknown) => void;
    readCronSecret: () => string | null | undefined;
  }) => (request: Request) => Promise<Response>;
};

const KEEP_ALIVE_PATH = "/api/cron/supabase-keep-alive";
const CRON_SECRET = "test-cron-secret-value";

async function loadKeepAliveModule(): Promise<KeepAliveModule> {
  const loadedModule = await import("./supabase-keep-alive.ts").catch(() => null);

  assert.ok(loadedModule, "expected keep-alive module to exist at ./supabase-keep-alive.ts");

  return loadedModule as KeepAliveModule;
}

function createRequest(input?: { authorization?: string; method?: string }) {
  const headers = new Headers();

  if (input?.authorization) {
    headers.set("authorization", input.authorization);
  }

  return new Request(`https://example.test${KEEP_ALIVE_PATH}`, {
    headers,
    method: input?.method ?? "GET",
  });
}

function createQuerySpy(result: unknown[] | Error = [{ id: "post-1" }, { id: "post-2" }]) {
  let calls = 0;

  return {
    get calls() {
      return calls;
    },
    listPublishedPosts: async () => {
      calls += 1;

      if (result instanceof Error) {
        throw result;
      }

      return result;
    },
  };
}

test("keep-alive rejects every request and skips the database when CRON_SECRET is not configured", async () => {
  const { createSupabaseKeepAliveHandler } = await loadKeepAliveModule();
  const query = createQuerySpy();
  const loggedMessages: string[] = [];
  const handler = createSupabaseKeepAliveHandler({
    listPublishedPosts: query.listPublishedPosts,
    logError: (message) => loggedMessages.push(message),
    readCronSecret: () => "   ",
  });

  const response = await handler(createRequest({ authorization: "Bearer    " }));

  assert.equal(response.status, 500);
  assert.equal(query.calls, 0);
  assert.equal(loggedMessages.length, 1);
  assert.deepEqual(await response.json(), { error: "cron_secret_not_configured", ok: false });
});

test("keep-alive returns 401 and skips the database when the authorization header is missing", async () => {
  const { createSupabaseKeepAliveHandler } = await loadKeepAliveModule();
  const query = createQuerySpy();
  const handler = createSupabaseKeepAliveHandler({
    listPublishedPosts: query.listPublishedPosts,
    readCronSecret: () => CRON_SECRET,
  });

  const response = await handler(createRequest());

  assert.equal(response.status, 401);
  assert.equal(query.calls, 0);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
});

test("keep-alive returns 401 and skips the database when the bearer secret is wrong", async () => {
  const { createSupabaseKeepAliveHandler } = await loadKeepAliveModule();
  const query = createQuerySpy();
  const handler = createSupabaseKeepAliveHandler({
    listPublishedPosts: query.listPublishedPosts,
    readCronSecret: () => CRON_SECRET,
  });

  const wrongSecretResponse = await handler(createRequest({ authorization: "Bearer not-the-secret" }));
  const missingSchemeResponse = await handler(createRequest({ authorization: CRON_SECRET }));

  assert.equal(wrongSecretResponse.status, 401);
  assert.equal(missingSchemeResponse.status, 401);
  assert.equal(query.calls, 0);
});

test("keep-alive queries published posts once and reports the count when the secret matches", async () => {
  const { createSupabaseKeepAliveHandler } = await loadKeepAliveModule();
  const query = createQuerySpy([{ id: "post-1" }, { id: "post-2" }, { id: "post-3" }]);
  const handler = createSupabaseKeepAliveHandler({
    listPublishedPosts: query.listPublishedPosts,
    readCronSecret: () => CRON_SECRET,
  });

  const response = await handler(createRequest({ authorization: `Bearer ${CRON_SECRET}` }));
  const body = (await response.json()) as { checkedAt: string; ok: boolean; publishedPostCount: number };

  assert.equal(response.status, 200);
  assert.equal(query.calls, 1);
  assert.equal(body.ok, true);
  assert.equal(body.publishedPostCount, 3);
  assert.ok(!Number.isNaN(Date.parse(body.checkedAt)), "expected checkedAt to be an ISO timestamp");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("keep-alive accepts POST requests with the same secret check", async () => {
  const { createSupabaseKeepAliveHandler } = await loadKeepAliveModule();
  const query = createQuerySpy();
  const handler = createSupabaseKeepAliveHandler({
    listPublishedPosts: query.listPublishedPosts,
    readCronSecret: () => CRON_SECRET,
  });

  const response = await handler(createRequest({ authorization: `Bearer ${CRON_SECRET}`, method: "POST" }));

  assert.equal(response.status, 200);
  assert.equal(query.calls, 1);
});

test("keep-alive returns 500 and logs the cause when the Supabase query fails", async () => {
  const { createSupabaseKeepAliveHandler } = await loadKeepAliveModule();
  const failure = new Error("Database is not reachable");
  const query = createQuerySpy(failure);
  const loggedErrors: Array<{ error: unknown; message: string }> = [];
  const handler = createSupabaseKeepAliveHandler({
    listPublishedPosts: query.listPublishedPosts,
    logError: (message, error) => loggedErrors.push({ error, message }),
    readCronSecret: () => CRON_SECRET,
  });

  const response = await handler(createRequest({ authorization: `Bearer ${CRON_SECRET}` }));

  assert.equal(response.status, 500);
  assert.equal(query.calls, 1);
  assert.deepEqual(await response.json(), { error: "supabase_query_failed", ok: false });
  assert.equal(loggedErrors.length, 1);
  assert.equal(loggedErrors[0].error, failure);
});

test("vercel.json schedules the keep-alive route three times a day at fixed times", async () => {
  const vercelConfig = JSON.parse(await readFile(new URL("../../../../vercel.json", import.meta.url), "utf8")) as {
    crons?: Array<{ path: string; schedule: string }>;
  };
  const keepAliveCrons = (vercelConfig.crons ?? []).filter((cron) => cron.path === KEEP_ALIVE_PATH);

  assert.equal(keepAliveCrons.length, 3);

  for (const cron of keepAliveCrons) {
    const [minute, hour, ...rest] = cron.schedule.split(" ");

    // Vercel Hobby rejects any cron expression that runs more than once per day.
    assert.match(minute, /^\d+$/, `expected a fixed minute in "${cron.schedule}"`);
    assert.match(hour, /^\d+$/, `expected a fixed hour in "${cron.schedule}"`);
    assert.deepEqual(rest, ["*", "*", "*"]);
  }

  await assert.doesNotReject(
    readFile(new URL("../../../app/api/cron/supabase-keep-alive/route.ts", import.meta.url), "utf8"),
    "expected the keep-alive route handler file to exist",
  );
});
