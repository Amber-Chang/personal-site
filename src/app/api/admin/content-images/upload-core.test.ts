import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

type AuthState = { isAdmin: boolean; isAuthenticated: boolean };

type UploadHandlerDependencies = {
  createSignedUpload: (path: string) => Promise<{ path: string; signedUrl: string; token: string }>;
  getAdminAuthState: () => Promise<AuthState>;
  getPublicUrl: (path: string) => string;
  isTrustedOrigin: (headers: Headers) => boolean;
  logError?: (message: string, error?: unknown) => void;
  randomId?: () => string;
};

type UploadCoreModule = {
  createContentImageUploadHandler: (dependencies: UploadHandlerDependencies) => (request: Request) => Promise<Response>;
};

async function loadUploadCore(): Promise<UploadCoreModule> {
  const loadedModule = await import("./upload-core.ts").catch(() => null);

  assert.ok(loadedModule, "expected upload core module to exist at ./upload-core.ts");

  return loadedModule as UploadCoreModule;
}

const RANDOM_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const PUBLIC_BASE = "https://project.supabase.co/storage/v1/object/public/content-images/";

function createDependencies(overrides?: Partial<UploadHandlerDependencies>) {
  const signedPaths: string[] = [];
  const dependencies: UploadHandlerDependencies = {
    createSignedUpload: async (objectPath) => {
      signedPaths.push(objectPath);

      return {
        path: objectPath,
        signedUrl: `https://project.supabase.co/storage/v1/object/upload/sign/content-images/${objectPath}?token=signed-token`,
        token: "signed-token",
      };
    },
    getAdminAuthState: async () => ({ isAdmin: true, isAuthenticated: true }),
    getPublicUrl: (objectPath) => `${PUBLIC_BASE}${objectPath}`,
    isTrustedOrigin: () => true,
    logError: () => {},
    randomId: () => RANDOM_ID,
    ...overrides,
  };

  return { dependencies, signedPaths };
}

function createRequest(body: unknown) {
  return new Request("https://amber.test/api/admin/content-images", {
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", origin: "https://amber.test" },
    method: "POST",
  });
}

const VALID_BODY = { contentType: "image/png", size: 123_456 };

test("a signed-out request gets 401 and no upload url", async () => {
  const { createContentImageUploadHandler } = await loadUploadCore();
  const { dependencies, signedPaths } = createDependencies({
    getAdminAuthState: async () => ({ isAdmin: false, isAuthenticated: false }),
  });

  const response = await createContentImageUploadHandler(dependencies)(createRequest(VALID_BODY));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "登入狀態已失效，請重新登入。" });
  assert.equal(signedPaths.length, 0);
});

test("a signed-in user who is not an allowed admin gets 403", async () => {
  const { createContentImageUploadHandler } = await loadUploadCore();
  const { dependencies, signedPaths } = createDependencies({
    getAdminAuthState: async () => ({ isAdmin: false, isAuthenticated: true }),
  });

  const response = await createContentImageUploadHandler(dependencies)(createRequest(VALID_BODY));

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "這個帳號沒有後台權限。" });
  assert.equal(signedPaths.length, 0);
});

test("an admin request from another origin gets 403", async () => {
  const { createContentImageUploadHandler } = await loadUploadCore();
  const receivedHeaders: Headers[] = [];
  const { dependencies, signedPaths } = createDependencies({
    isTrustedOrigin: (headers) => {
      receivedHeaders.push(headers);
      return false;
    },
  });

  const response = await createContentImageUploadHandler(dependencies)(createRequest(VALID_BODY));

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "請從本站的後台頁面上傳圖片。" });
  assert.equal(receivedHeaders[0]?.get("origin"), "https://amber.test");
  assert.equal(signedPaths.length, 0);
});

test("checks run in order: sign-in, admin, origin, then file type and size", async () => {
  const { createContentImageUploadHandler } = await loadUploadCore();
  const calls: string[] = [];
  const { dependencies } = createDependencies({
    getAdminAuthState: async () => {
      calls.push("auth");
      return { isAdmin: false, isAuthenticated: false };
    },
    isTrustedOrigin: () => {
      calls.push("origin");
      return false;
    },
  });

  // 未登入且檔案類型也不對：先回 401，不檢查來源。
  const response = await createContentImageUploadHandler(dependencies)(createRequest({ contentType: "image/svg+xml", size: 0 }));

  assert.equal(response.status, 401);
  assert.deepEqual(calls, ["auth"]);

  // 來源不對且檔案類型也不對：回 403（來源），不回 400。
  const untrusted = createDependencies({ isTrustedOrigin: () => false });
  const untrustedResponse = await createContentImageUploadHandler(untrusted.dependencies)(
    createRequest({ contentType: "image/svg+xml", size: 0 }),
  );

  assert.equal(untrustedResponse.status, 403);
});

test("a file type outside the four allowed formats gets 400 with the agreed message", async () => {
  const { createContentImageUploadHandler } = await loadUploadCore();

  for (const contentType of ["image/svg+xml", "text/html", undefined]) {
    const { dependencies, signedPaths } = createDependencies();
    const response = await createContentImageUploadHandler(dependencies)(createRequest({ contentType, size: 1000 }));

    assert.equal(response.status, 400, String(contentType));
    assert.deepEqual(await response.json(), { error: "只能上傳 PNG、JPG、WebP 或 GIF 圖片。" });
    assert.equal(signedPaths.length, 0);
  }
});

test("a declared size over 5MB, zero, or not a number gets 400 with the agreed message", async () => {
  const { createContentImageUploadHandler } = await loadUploadCore();

  for (const size of [5_242_881, 0, "1000", undefined]) {
    const { dependencies, signedPaths } = createDependencies();
    const response = await createContentImageUploadHandler(dependencies)(createRequest({ contentType: "image/jpeg", size }));

    assert.equal(response.status, 400, String(size));
    assert.deepEqual(await response.json(), { error: "圖片不能超過 5MB。" });
    assert.equal(signedPaths.length, 0);
  }
});

test("a body that is not JSON is rejected as an unsupported file type", async () => {
  const { createContentImageUploadHandler } = await loadUploadCore();
  const { dependencies } = createDependencies();

  const response = await createContentImageUploadHandler(dependencies)(createRequest("not json"));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "只能上傳 PNG、JPG、WebP 或 GIF 圖片。" });
});

test("a valid admin request gets a one-time upload url and the later public url, named by the server", async () => {
  const { createContentImageUploadHandler } = await loadUploadCore();
  const { dependencies, signedPaths } = createDependencies();

  const response = await createContentImageUploadHandler(dependencies)(
    createRequest({ contentType: "image/webp", fileName: "../../etc/passwd.webp", path: "evil/x.webp", size: 5_242_880 }),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  // 檔名由伺服器決定：隨機字串加上依類型決定的副檔名，忽略使用者送來的檔名與路徑。
  assert.deepEqual(signedPaths, [`${RANDOM_ID}.webp`]);
  assert.deepEqual(await response.json(), {
    path: `${RANDOM_ID}.webp`,
    publicUrl: `${PUBLIC_BASE}${RANDOM_ID}.webp`,
    signedUrl: `https://project.supabase.co/storage/v1/object/upload/sign/content-images/${RANDOM_ID}.webp?token=signed-token`,
    token: "signed-token",
  });
});

test("a storage failure returns 500 with a generic message and logs the cause", async () => {
  const { createContentImageUploadHandler } = await loadUploadCore();
  const logged: string[] = [];
  const { dependencies } = createDependencies({
    createSignedUpload: async () => {
      throw new Error("bucket not found");
    },
    logError: (message) => logged.push(message),
  });

  const response = await createContentImageUploadHandler(dependencies)(createRequest(VALID_BODY));

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "暫時無法取得上傳網址，請稍後再試。" });
  assert.equal(logged.length, 1);
});

test("the route only accepts POST and wires the real admin auth, origin check and storage", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/app/api/admin/content-images/route.ts"), "utf8");

  assert.match(source, /export const POST = /);
  assert.doesNotMatch(source, /export const (GET|PUT|PATCH|DELETE)\b/);
  assert.doesNotMatch(source, /export (async )?function (GET|PUT|PATCH|DELETE)\b/);
  assert.match(source, /export const dynamic = "force-dynamic";/);
  assert.match(source, /readServerAdminAuthState/);
  assert.match(source, /isTrustedAdminOrigin\(\{ headers \}\)/);
  assert.match(source, /createContentImageStorage\(\)/);
});
