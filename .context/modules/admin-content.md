# admin-content

## 目的

承接 `/admin/posts` 與 `/admin/projects` 的內容管理流程，讓單人 admin 可以建立、編輯、排序、上架、下架與刪除內容。

## 主要路徑

- `src/app/admin/posts/`
- `src/app/admin/projects/`
- `src/components/admin/post-form.tsx`
- `src/components/admin/project-form.tsx`
- `src/components/admin/sortable-admin-post-list.tsx`
- `src/components/admin/sortable-admin-project-list.tsx`
- `src/components/admin/markdown-content-field.tsx`、`src/components/admin/content-image-upload.tsx`、`src/components/admin/markdown-preview.tsx`、`src/components/admin/markdown-toolbar.tsx`、`src/components/admin/textarea-edit.ts`
- `src/lib/markdown/toolbar-actions.ts`、`src/lib/markdown/text-edits.ts`
- `src/app/api/admin/content-images/`（內文圖片上傳通道）
- `src/lib/content-images/rules.ts`、`src/lib/infra/supabase/content-images-storage.ts`

## 運作方式

- `actions.ts` 只做 Server Action 入口，真正的表單解析與流程判斷集中在 `action-core.ts`。
- `action-core.ts` 會呼叫 `content-runtime` 做 create / update / publish / reorder / delete。
- posts 與 projects 共用相同的排序概念與狀態語意：`draft` / `published`。
- article 與 project 的刪除都受 service 規則保護，不能直接刪除已上架內容。
- 內文圖片（SPEC-003）：`POST /api/admin/content-images` 檢查登入、管理員、trusted origin、檔案類型與宣告大小後，由伺服器決定檔名（隨機字串 + 副檔名），用 service-role client 向 `content-images` bucket 要一次性上傳網址，回傳上傳資訊與公開網址；圖片檔由瀏覽器直接傳到 Supabase。類型與大小規則在 `rules.ts`，伺服器端與後台表單共用。
- 文章與專案表單的 Markdown 內容欄位都用 `MarkdownContentField`（textarea 維持原本的 id、name、defaultValue，資料格式不變），旁邊是「上傳圖片」區塊：選檔當下檢查類型與大小、替代文字必填，成功後把 `![替代文字](公開網址)` 插入游標處（沒點過欄位時加在最後），透過 `textarea-edit.ts` 用 `insertText` 寫回，Cmd/Ctrl+Z 可以復原。瀏覽器端用不保存 session 的 supabase-js client（`src/lib/infra/supabase/content-images-upload.ts`）呼叫 `uploadToSignedUrl`，supabase-js 在第一次上傳時才載入。
- 寬螢幕（`lg`，64rem 以上，用 `matchMedia` 判斷）時內容欄位與預覽左右並排，停止輸入約 500 毫秒後更新；預覽區最高 70vh、自己捲動，不和編輯區同步捲動。原始碼沒變的 Mermaid 圖表不會重新繪製（`MermaidDiagram` 記住 `dangerouslySetInnerHTML` 的物件；在圖表前面新增或刪除程式碼區塊時，後面的圖表仍會重畫一次）。
- 較窄的螢幕維持「編輯／預覽」切換：預覽用和前台相同的 `Prose` + `MarkdownContent` 在瀏覽器端輸出 textarea 目前的文字（含未儲存的修改），第一次打開時才載入（`next/dynamic`）。預覽時 textarea 只隱藏不卸載，文字、游標與表單送出的值都不變；預覽不儲存、不發佈。表單頁本身已由 `getAdminPageContentService()` 擋下非管理員。
- 內容欄位上方有 Markdown 工具列（`role="toolbar"`，方向鍵移動）：粗體、斜體、大標、小標、連結、引言、項目清單、編號清單、表格、程式碼區塊、Mermaid 圖表、圖片（只把焦點移到上傳區塊）。每個按鈕的規則是 `toolbar-actions.ts` 裡的純函式（`{ value, selectionStart, selectionEnd }` 進出）；Cmd/Ctrl+B／I／K 是粗體、斜體、連結。修改都經 `textarea-edit.ts` 用 `insertText` 寫回，Cmd/Ctrl+Z 可以復原；儲存的仍是純 Markdown。

## 目前約束

- reorder 操作需提供完整 id 順序，避免部分排序造成資料不一致。
- related project 選單依賴已存在的 project option 清單。
- 專案表單的類型（Type）必選；`action-core.ts` 在伺服器端再驗一次，沒選或值不認得時回中文錯誤、不寫入。
- admin UI 是內容工作流入口，不應自己實作第二套資料驗證。
