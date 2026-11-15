// 功能：文章與專案內文圖片的 Storage 存取（bucket：content-images）。只在伺服器端使用 service-role client。
// 寫入只透過這裡發出的一次性上傳網址；bucket 沒有給 anon / authenticated 的寫入政策。

import { CONTENT_IMAGE_BUCKET } from "../../content-images/rules.ts";
import { createAdminSupabaseClient } from "./admin.ts";

type SignedUpload = { path: string; signedUrl: string; token: string };

type ContentImageStorageClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUploadUrl: (path: string) => Promise<{ data: SignedUpload | null; error: { message: string } | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
};

export function createContentImageStorage(input?: { client?: ContentImageStorageClient }) {
  const client = input?.client ?? (createAdminSupabaseClient() as ContentImageStorageClient);
  const bucket = () => client.storage.from(CONTENT_IMAGE_BUCKET);

  return {
    // 一次性上傳網址：瀏覽器拿它直接把檔案傳到 Supabase。不開 upsert，同一路徑不能被覆蓋。
    async createSignedUpload(path: string): Promise<SignedUpload> {
      const { data, error } = await bucket().createSignedUploadUrl(path);

      if (error || !data) {
        throw new Error(`Failed to create a signed upload url: ${error?.message ?? "no data returned"}`);
      }

      return { path: data.path, signedUrl: data.signedUrl, token: data.token };
    },
    // 上傳完成後的公開網址（bucket 是公開讀取）。
    getPublicUrl(path: string): string {
      return bucket().getPublicUrl(path).data.publicUrl;
    },
  };
}
