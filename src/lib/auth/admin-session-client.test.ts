import assert from "node:assert/strict";
import test from "node:test";

import { ADMIN_SESSION_STATUS_PATH, readIsAdminFromBrowser } from "./admin-session-client.ts";

type FetchCall = { init?: RequestInit; url: string };

function createFetch(respond: () => Promise<Response>) {
  const calls: FetchCall[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ init, url });
    return respond();
  }) as unknown as typeof fetch;

  return { calls, fetchImpl };
}

const SESSION_COOKIE = "theme=light; sb-127-auth-token=base64-abc";

test("visitors without a Supabase session cookie never call the endpoint", async () => {
  for (const cookie of ["", "analytics-consent=rejected", "sb-127-auth-token-code-verifier=abc"]) {
    const { calls, fetchImpl } = createFetch(async () => Response.json({ isAdmin: true }));

    assert.equal(await readIsAdminFromBrowser({ cookie, fetch: fetchImpl }), false);
    assert.equal(calls.length, 0, `expected no request for cookie ${JSON.stringify(cookie)}`);
  }
});

test("with a session cookie it asks the endpoint once, without caching", async () => {
  const { calls, fetchImpl } = createFetch(async () => Response.json({ isAdmin: true }));

  assert.equal(await readIsAdminFromBrowser({ cookie: SESSION_COOKIE, fetch: fetchImpl }), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, ADMIN_SESSION_STATUS_PATH);
  assert.equal(ADMIN_SESSION_STATUS_PATH, "/api/admin/session");
  assert.equal(calls[0].init?.cache, "no-store");
  assert.equal(calls[0].init?.credentials, "same-origin");
});

test("only a literal { isAdmin: true } from a successful response counts", async () => {
  const responses: Array<() => Promise<Response>> = [
    async () => Response.json({ isAdmin: false }),
    async () => Response.json({ isAdmin: "true" }),
    async () => Response.json({}),
    async () => Response.json(null),
    async () => Response.json({ isAdmin: true }, { status: 500 }),
    async () => new Response("<html>not json</html>", { status: 200 }),
    async () => {
      throw new TypeError("network down");
    },
  ];

  for (const respond of responses) {
    const { fetchImpl } = createFetch(respond);

    assert.equal(await readIsAdminFromBrowser({ cookie: SESSION_COOKIE, fetch: fetchImpl }), false);
  }
});

test("an aborted check resolves to false instead of throwing", async () => {
  const controller = new AbortController();
  const { fetchImpl } = createFetch(async () => {
    throw new DOMException("aborted", "AbortError");
  });

  controller.abort();

  assert.equal(await readIsAdminFromBrowser({ cookie: SESSION_COOKIE, fetch: fetchImpl, signal: controller.signal }), false);
});
