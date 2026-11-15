// 功能：後台圖片上傳通道（只接受 POST）。回傳一次性上傳網址與之後的公開網址，圖片本身不經過本站伺服器。
// 檢查流程與回應內容見 upload-core.ts；規格見 docs/02-spec/SPEC-003-admin-authoring.md。

import { readServerAdminAuthState } from "@/lib/auth/server-admin-auth.ts";
import { isTrustedAdminOrigin } from "@/lib/auth/trusted-origin.ts";
import { createContentImageStorage } from "@/lib/infra/supabase/content-images-storage.ts";

import { createContentImageUploadHandler } from "./upload-core.ts";

export const dynamic = "force-dynamic";

// Storage client 在第一個請求進來時才建立，build 時不需要讀到 service-role key。
let storage: ReturnType<typeof createContentImageStorage> | null = null;

function getStorage() {
  storage ??= createContentImageStorage();
  return storage;
}

export const POST = createContentImageUploadHandler({
  createSignedUpload: (path) => getStorage().createSignedUpload(path),
  getAdminAuthState: () => readServerAdminAuthState(),
  getPublicUrl: (path) => getStorage().getPublicUrl(path),
  isTrustedOrigin: (headers) => isTrustedAdminOrigin({ headers }),
});
