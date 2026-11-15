// 功能：後台圖片上傳通道的核心邏輯。檢查通過後，向 Supabase 要一個一次性上傳網址交給瀏覽器，
// 圖片檔由瀏覽器直接傳到 Supabase，不經過本站伺服器（避開 Vercel 4.5MB 的請求上限）。
// route.ts 只負責接上真正的登入檢查、來源檢查與 Storage；這裡的依賴都可替換，方便測試每個拒絕情境。

import { randomUUID } from "node:crypto";

import {
  createContentImageObjectName,
  getContentImageSizeError,
  getContentImageTypeError,
} from "../../../../lib/content-images/rules.ts";

export type ContentImageUploadDependencies = {
  createSignedUpload: (path: string) => Promise<{ path: string; signedUrl: string; token: string }>;
  getAdminAuthState: () => Promise<{ isAdmin: boolean; isAuthenticated: boolean }>;
  getPublicUrl: (path: string) => string;
  isTrustedOrigin: (headers: Headers) => boolean;
  logError?: (message: string, error?: unknown) => void;
  randomId?: () => string;
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return Response.json(body, {
    headers: { "cache-control": "no-store" },
    status,
  });
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();

    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    // 不是 JSON：當成沒有宣告檔案類型，交給下面的類型檢查回 400。
    return {};
  }
}

export function createContentImageUploadHandler(dependencies: ContentImageUploadDependencies) {
  const logError = dependencies.logError ?? ((message: string, error?: unknown) => console.error(message, error));
  const randomId = dependencies.randomId ?? randomUUID;

  return async function handleContentImageUpload(request: Request): Promise<Response> {
    try {
      // 檢查順序固定：登入 → 管理員 → 來源 → 檔案類型 → 檔案大小。任何一項不過都不發網址。
      const authState = await dependencies.getAdminAuthState();

      if (!authState.isAuthenticated) {
        return jsonResponse({ error: "登入狀態已失效，請重新登入。" }, 401);
      }

      if (!authState.isAdmin) {
        return jsonResponse({ error: "這個帳號沒有後台權限。" }, 403);
      }

      if (!dependencies.isTrustedOrigin(request.headers)) {
        return jsonResponse({ error: "請從本站的後台頁面上傳圖片。" }, 403);
      }

      const body = await readJsonBody(request);
      const typeError = getContentImageTypeError(body.contentType);

      if (typeError) {
        return jsonResponse({ error: typeError }, 400);
      }

      const sizeError = getContentImageSizeError(body.size);

      if (sizeError) {
        return jsonResponse({ error: sizeError }, 400);
      }

      // 只讀 contentType 與 size；使用者送來的檔名、路徑一律忽略。
      const objectName = createContentImageObjectName(body.contentType as string, randomId);
      const upload = await dependencies.createSignedUpload(objectName);

      return jsonResponse(
        {
          path: upload.path,
          publicUrl: dependencies.getPublicUrl(upload.path),
          signedUrl: upload.signedUrl,
          token: upload.token,
        },
        200,
      );
    } catch (error) {
      logError("[content-images] failed to create a signed upload url.", error);

      return jsonResponse({ error: "暫時無法取得上傳網址，請稍後再試。" }, 500);
    }
  };
}
