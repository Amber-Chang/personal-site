// 功能：在瀏覽器端把圖片檔直接傳到 Supabase Storage 的一次性上傳網址（不經過本站伺服器）。
// 只用公開的 URL 與 publishable key；上傳權限來自伺服器發的一次性 token，不需要登入 session。
// 用不保存 session 的 client，避免影響後台登入狀態的 cookie。supabase-js 在第一次上傳時才載入。

import { CONTENT_IMAGE_BUCKET } from "../../content-images/rules.ts";
import { readSupabasePublicEnv } from "./env.ts";

type SignedUploadClient = {
  storage: {
    from: (bucket: string) => {
      uploadToSignedUrl: (
        path: string,
        token: string,
        file: never,
        options: { contentType?: string },
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
};

type CreateClient = (url: string, key: string, options: Record<string, unknown>) => SignedUploadClient;

export async function uploadFileToSignedUrl<TFile extends { type: string }>(
  input: { file: TFile; path: string; token: string },
  options?: { createClient?: CreateClient; env?: { anonKey: string; url: string } },
): Promise<void> {
  // Next.js 只會把直接寫出的 process.env.NEXT_PUBLIC_* 換成 build 時的值。
  const env =
    options?.env ??
    readSupabasePublicEnv({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  const createClient = options?.createClient ?? ((await import("@supabase/supabase-js")).createClient as unknown as CreateClient);
  const client = createClient(env.url, env.anonKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { error } = await client.storage
    .from(CONTENT_IMAGE_BUCKET)
    .uploadToSignedUrl(input.path, input.token, input.file as never, { contentType: input.file.type });

  if (error) {
    throw new Error(error.message);
  }
}
