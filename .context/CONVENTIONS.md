# 編碼約定 / 架構禁區（CONVENTIONS）

## 這個專案特有的約定

- 公開內容與 admin 內容都先經 `content-runtime`，不要在 page、component 或 action 內散寫 provider-specific query。
- `content/posts/*.md` 與 `content/projects/*.md` 是匯入來源；改 Markdown 不代表前台內容已同步，需走既有 import / sync workflow。
- `published` 的 post / project 不能直接刪除；若要刪除，先下架回 `draft`。
- 手動排序以 `sort_order` 為唯一權威欄位；reorder 操作必須提交完整 id 清單，不接受局部交換。
- PostHog 只能在使用者同意後啟用，且目前只追公開頁面，不追 `/admin`。

## 架構禁區（不准碰 / 不准這樣做）

- 不在 `page.tsx`、React component 或 UI form 裡直接寫 `supabase.from(...)`。
- 不為 `blog posts` 與 `projects` 各做一套平行的內容存取規則；共用邊界優先補在 service / repository 層。
- 不把新的 admin 登入捷徑直接塞回頁面層；admin access 必須經過 Supabase auth callback 與 allowlist guard。
- 不在未經 consent 的情況下初始化 analytics SDK 或送出事件。
