import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

type StorageResult<T> = { data: T | null; error: { message: string } | null };

type StorageClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUploadUrl: (path: string) => Promise<StorageResult<{ path: string; signedUrl: string; token: string }>>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
};

type ContentImageStorageModule = {
  createContentImageStorage: (input?: { client?: StorageClient }) => {
    createSignedUpload: (path: string) => Promise<{ path: string; signedUrl: string; token: string }>;
    getPublicUrl: (path: string) => string;
  };
};

async function loadStorageModule(): Promise<ContentImageStorageModule> {
  const loadedModule = await import("./content-images-storage.ts").catch(() => null);

  assert.ok(loadedModule, "expected content image storage module to exist at ./content-images-storage.ts");

  return loadedModule as ContentImageStorageModule;
}

function createClient(result: StorageResult<{ path: string; signedUrl: string; token: string }>) {
  const calls: Array<[string, string, string]> = [];
  const client: StorageClient = {
    storage: {
      from: (bucket) => ({
        createSignedUploadUrl: async (objectPath) => {
          calls.push(["createSignedUploadUrl", bucket, objectPath]);
          return result;
        },
        getPublicUrl: (objectPath) => {
          calls.push(["getPublicUrl", bucket, objectPath]);
          return { data: { publicUrl: `https://project.supabase.co/storage/v1/object/public/${bucket}/${objectPath}` } };
        },
      }),
    },
  };

  return { calls, client };
}

test("createSignedUpload asks the content-images bucket for a one-time upload url", async () => {
  const { createContentImageStorage } = await loadStorageModule();
  const signed = { path: "a.png", signedUrl: "https://project.supabase.co/storage/v1/object/upload/sign/content-images/a.png?token=t", token: "t" };
  const { calls, client } = createClient({ data: signed, error: null });

  assert.deepEqual(await createContentImageStorage({ client }).createSignedUpload("a.png"), signed);
  assert.deepEqual(calls, [["createSignedUploadUrl", "content-images", "a.png"]]);
});

test("createSignedUpload throws when Supabase returns an error", async () => {
  const { createContentImageStorage } = await loadStorageModule();
  const { client } = createClient({ data: null, error: { message: "Bucket not found" } });

  await assert.rejects(() => createContentImageStorage({ client }).createSignedUpload("a.png"), /Bucket not found/);
});

test("getPublicUrl returns the public url of the object in the content-images bucket", async () => {
  const { createContentImageStorage } = await loadStorageModule();
  const { calls, client } = createClient({ data: null, error: null });

  assert.equal(
    createContentImageStorage({ client }).getPublicUrl("a.png"),
    "https://project.supabase.co/storage/v1/object/public/content-images/a.png",
  );
  assert.deepEqual(calls, [["getPublicUrl", "content-images", "a.png"]]);
});

test("the storage module uses the service-role client and never runs in the browser", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/lib/infra/supabase/content-images-storage.ts"), "utf8");

  assert.match(source, /createAdminSupabaseClient/);
  assert.doesNotMatch(source, /^"use client";/m);
});

test("content images migration creates a public bucket with the size and type limits and no write policies", () => {
  const migrationPath = path.join(process.cwd(), "supabase/migrations/202611150002_add_content_images_bucket.sql");

  assert.equal(fs.existsSync(migrationPath), true);

  const content = fs.readFileSync(migrationPath, "utf8");
  const statements = content.replace(/--.*$/gm, "");

  assert.match(statements, /insert into storage\.buckets \(id, name, public, file_size_limit, allowed_mime_types\)/i);
  assert.match(statements, /'content-images',\s*'content-images',\s*true,\s*5242880,/i);
  assert.match(statements, /array\['image\/png', 'image\/jpeg', 'image\/webp', 'image\/gif'\]/i);
  // 可重複執行：已存在時更新成同樣的設定，不報錯。
  assert.match(statements, /on conflict \(id\) do update set/i);
  assert.match(statements, /public = excluded\.public/i);
  assert.match(statements, /file_size_limit = excluded\.file_size_limit/i);
  assert.match(statements, /allowed_mime_types = excluded\.allowed_mime_types/i);
  // 不建立任何政策：anon / authenticated 不能直接寫入、更新或刪除。
  assert.doesNotMatch(statements, /create policy/i);
  assert.doesNotMatch(statements, /grant /i);
});
