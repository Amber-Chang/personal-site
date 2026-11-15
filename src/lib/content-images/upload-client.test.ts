import assert from "node:assert/strict";
import test from "node:test";

type SignedUpload = { path: string; publicUrl: string; signedUrl: string; token: string };

type UploadClientModule = {
  requestContentImageUpload: (
    file: { size: number; type: string },
    fetchImpl?: (url: string, init: RequestInit) => Promise<Response>,
  ) => Promise<SignedUpload>;
  uploadContentImage: (input: {
    file: { size: number; type: string };
    requestUpload: (file: { size: number; type: string }) => Promise<SignedUpload>;
    uploadToSignedUrl: (input: { file: { size: number; type: string }; path: string; token: string }) => Promise<void>;
  }) => Promise<string>;
};

async function loadModule(): Promise<UploadClientModule> {
  const loadedModule = await import("./upload-client.ts").catch(() => null);

  assert.ok(loadedModule, "expected upload client module to exist at ./upload-client.ts");

  return loadedModule as UploadClientModule;
}

const FILE = { size: 2048, type: "image/png" };
const SIGNED: SignedUpload = {
  path: "id.png",
  publicUrl: "https://project.supabase.co/storage/v1/object/public/content-images/id.png",
  signedUrl: "https://project.supabase.co/storage/v1/object/upload/sign/content-images/id.png?token=t",
  token: "t",
};

test("requestContentImageUpload posts only the declared type and size to the admin endpoint", async () => {
  const { requestContentImageUpload } = await loadModule();
  const requests: Array<{ init: RequestInit; url: string }> = [];

  const result = await requestContentImageUpload(FILE, async (url, init) => {
    requests.push({ init, url });
    return Response.json(SIGNED, { status: 200 });
  });

  assert.deepEqual(result, SIGNED);
  assert.equal(requests[0]?.url, "/api/admin/content-images");
  assert.equal(requests[0]?.init.method, "POST");
  assert.equal(requests[0]?.init.credentials, "same-origin");
  assert.deepEqual(JSON.parse(String(requests[0]?.init.body)), { contentType: "image/png", size: 2048 });
});

test("requestContentImageUpload surfaces the server's message when the endpoint refuses", async () => {
  const { requestContentImageUpload } = await loadModule();

  await assert.rejects(
    () => requestContentImageUpload(FILE, async () => Response.json({ error: "圖片不能超過 5MB。" }, { status: 400 })),
    { message: "圖片不能超過 5MB。" },
  );
  await assert.rejects(
    () => requestContentImageUpload(FILE, async () => new Response("<html>502</html>", { status: 502 })),
    { message: "暫時無法取得上傳網址，請稍後再試。" },
  );
  await assert.rejects(
    () =>
      requestContentImageUpload(FILE, async () => {
        throw new TypeError("Failed to fetch");
      }),
    { message: "暫時無法取得上傳網址，請稍後再試。" },
  );
});

test("uploadContentImage sends the file straight to the signed url and returns the public url", async () => {
  const { uploadContentImage } = await loadModule();
  const uploads: Array<{ file: { size: number; type: string }; path: string; token: string }> = [];

  const publicUrl = await uploadContentImage({
    file: FILE,
    requestUpload: async () => SIGNED,
    uploadToSignedUrl: async (input) => {
      uploads.push(input);
    },
  });

  assert.equal(publicUrl, SIGNED.publicUrl);
  assert.deepEqual(uploads, [{ file: FILE, path: "id.png", token: "t" }]);
});

test("uploadContentImage reports a storage failure with its reason", async () => {
  const { uploadContentImage } = await loadModule();

  await assert.rejects(
    () =>
      uploadContentImage({
        file: FILE,
        requestUpload: async () => SIGNED,
        uploadToSignedUrl: async () => {
          throw new Error("The object exceeded the maximum allowed size");
        },
      }),
    { message: "圖片上傳失敗，請稍後再試。（The object exceeded the maximum allowed size）" },
  );
});
