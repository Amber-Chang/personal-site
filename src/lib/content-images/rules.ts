// 功能：文章與專案內文圖片的上傳規則。伺服器端端點與後台上傳介面共用，確保兩邊檢查的標準一致。
// 這些數值要和 supabase/migrations/202611150002_add_content_images_bucket.sql 的 bucket 設定相同。

export const CONTENT_IMAGE_BUCKET = "content-images";

// 單檔上限 5MB（5,242,880 bytes）。
export const CONTENT_IMAGE_MAX_BYTES = 5_242_880;

// 允許的檔案類型與對應的副檔名。不允許 SVG：SVG 可以夾帶腳本。
const CONTENT_IMAGE_EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

export type ContentImageType = keyof typeof CONTENT_IMAGE_EXTENSIONS;

export const CONTENT_IMAGE_TYPES = Object.keys(CONTENT_IMAGE_EXTENSIONS) as ContentImageType[];

export const CONTENT_IMAGE_TYPE_ERROR = "只能上傳 PNG、JPG、WebP 或 GIF 圖片。";
export const CONTENT_IMAGE_SIZE_ERROR = "圖片不能超過 5MB。";

export function isContentImageType(contentType: unknown): contentType is ContentImageType {
  return typeof contentType === "string" && Object.hasOwn(CONTENT_IMAGE_EXTENSIONS, contentType);
}

// 回傳錯誤訊息；通過時回傳 null。
export function getContentImageTypeError(contentType: unknown): string | null {
  return isContentImageType(contentType) ? null : CONTENT_IMAGE_TYPE_ERROR;
}

// 宣告的檔案大小必須是大於 0、不超過 5MB 的數字。
export function getContentImageSizeError(size: unknown): string | null {
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0 || size > CONTENT_IMAGE_MAX_BYTES) {
    return CONTENT_IMAGE_SIZE_ERROR;
  }

  return null;
}

// 儲存用的檔名由伺服器決定：隨機字串加上依檔案類型決定的副檔名，不使用使用者提供的檔名或路徑。
export function createContentImageObjectName(contentType: string, randomId: () => string): string {
  if (!isContentImageType(contentType)) {
    throw new Error(CONTENT_IMAGE_TYPE_ERROR);
  }

  return `${randomId()}.${CONTENT_IMAGE_EXTENSIONS[contentType]}`;
}
