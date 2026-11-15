import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

type UploadOptions = { contentType?: string };

type FakeClient = {
  storage: {
    from: (bucket: string) => {
      uploadToSignedUrl: (path: string, token: string, file: unknown, options: UploadOptions) => Promise<{ error: { message: string } | null }>;
    };
  };
};

type BrowserUploadModule = {
  uploadFileToSignedUrl: (
    input: { file: { type: string }; path: string; token: string },
    options?: {
      createClient?: (url: string, key: string, clientOptions: Record<string, unknown>) => FakeClient;
      env?: { anonKey: string; url: string };
    },
  ) => Promise<void>;
};

async function loadModule(): Promise<BrowserUploadModule> {
  const loadedModule = await import("./content-images-upload.ts").catch(() => null);

  assert.ok(loadedModule, "expected browser upload module to exist at ./content-images-upload.ts");

  return loadedModule as BrowserUploadModule;
}

function createFakeClient(error: { message: string } | null) {
  const calls: unknown[][] = [];
  const created: unknown[][] = [];
  const createClient = (url: string, key: string, clientOptions: Record<string, unknown>): FakeClient => {
    created.push([url, key, clientOptions]);

    return {
      storage: {
        from: (bucket) => ({
          uploadToSignedUrl: async (objectPath, token, file, options) => {
            calls.push([bucket, objectPath, token, file, options]);
            return { error };
          },
        }),
      },
    };
  };

  return { calls, createClient, created };
}

test("uploadFileToSignedUrl uploads with the public key and a session-less client", async () => {
  const { uploadFileToSignedUrl } = await loadModule();
  const { calls, createClient, created } = createFakeClient(null);
  const file = { type: "image/png" };

  await uploadFileToSignedUrl(
    { file, path: "id.png", token: "t" },
    { createClient, env: { anonKey: "publishable-key", url: "https://project.supabase.co" } },
  );

  assert.deepEqual(created, [
    [
      "https://project.supabase.co",
      "publishable-key",
      { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } },
    ],
  ]);
  assert.deepEqual(calls, [["content-images", "id.png", "t", file, { contentType: "image/png" }]]);
});

test("uploadFileToSignedUrl throws Supabase's error message", async () => {
  const { uploadFileToSignedUrl } = await loadModule();
  const { createClient } = createFakeClient({ message: "mime type image/svg+xml is not supported" });

  await assert.rejects(
    () =>
      uploadFileToSignedUrl(
        { file: { type: "image/svg+xml" }, path: "id.png", token: "t" },
        { createClient, env: { anonKey: "k", url: "https://project.supabase.co" } },
      ),
    { message: "mime type image/svg+xml is not supported" },
  );
});

test("the browser upload helper only reads public env values and loads supabase-js on demand", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/lib/infra/supabase/content-images-upload.ts"), "utf8");

  // Next.js 只會把直接寫出的 process.env.NEXT_PUBLIC_* 換成實際值，所以要逐一寫出。
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(source, /SERVICE_ROLE/);
  assert.doesNotMatch(source, /admin\.ts/);
  assert.match(source, /await import\("@supabase\/supabase-js"\)/);
});
