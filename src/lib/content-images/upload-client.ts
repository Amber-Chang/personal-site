// 功能：後台在瀏覽器端上傳內文圖片的流程：先向本站要一次性上傳網址，再把檔案直接傳到 Supabase。
// 兩個步驟都可替換，方便測試；實際傳檔由 src/lib/infra/supabase/content-images-upload.ts 負責。

type ImageFileInfo = { size: number; type: string };

export type SignedContentImageUpload = { path: string; publicUrl: string; signedUrl: string; token: string };

const REQUEST_FAILED_MESSAGE = "暫時無法取得上傳網址，請稍後再試。";

// 只送宣告的類型與大小；檔名由伺服器決定。
export async function requestContentImageUpload(
  file: ImageFileInfo,
  fetchImpl: (url: string, init: RequestInit) => Promise<Response> = fetch,
): Promise<SignedContentImageUpload> {
  let response: Response;

  try {
    response = await fetchImpl("/api/admin/content-images", {
      body: JSON.stringify({ contentType: file.type, size: file.size }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST",
    });
  } catch {
    throw new Error(REQUEST_FAILED_MESSAGE);
  }

  const body = (await response.json().catch(() => null)) as Partial<SignedContentImageUpload> & { error?: unknown } | null;

  if (!response.ok || !body || typeof body.token !== "string" || typeof body.path !== "string" || typeof body.publicUrl !== "string") {
    // 伺服器拒絕時（例如未登入、格式不對）顯示它回的中文原因。
    throw new Error(typeof body?.error === "string" ? body.error : REQUEST_FAILED_MESSAGE);
  }

  return { path: body.path, publicUrl: body.publicUrl, signedUrl: String(body.signedUrl ?? ""), token: body.token };
}

export async function uploadContentImage<TFile extends ImageFileInfo>(input: {
  file: TFile;
  requestUpload: (file: TFile) => Promise<SignedContentImageUpload>;
  uploadToSignedUrl: (input: { file: TFile; path: string; token: string }) => Promise<void>;
}): Promise<string> {
  const upload = await input.requestUpload(input.file);

  try {
    await input.uploadToSignedUrl({ file: input.file, path: upload.path, token: upload.token });
  } catch (error) {
    const reason = error instanceof Error && error.message ? `（${error.message}）` : "";

    throw new Error(`圖片上傳失敗，請稍後再試。${reason}`);
  }

  return upload.publicUrl;
}
