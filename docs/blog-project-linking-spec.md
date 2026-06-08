# Blog Project Linking Spec

> 用途：定義 blog post 與 project 之間的雙向連結功能，讓內容不只可發佈，也能形成可被理解的案例脈絡。

## 1. 目標

這一輪要解決的問題不是「文章能不能編輯」，而是：

- 已發佈的文章如何自然連回它所屬的代表案例
- 案例頁如何反向收納相關文章，讓讀者看見這個 project 的延伸思考與拆解過程
- 在不引入 project 後台的前提下，把既有 `blog post -> project` 關聯真正用在前台體驗上

這一輪完成後，網站應開始具備最小的內容圖譜，而不是彼此獨立的 `blog` 與 `projects`。

## 2. 產品意圖

這個站的核心受眾是潛在雇主與合作對象。

對這類讀者來說，單篇文章與案例頁各自成立還不夠，他們還需要快速理解：

- 這篇文章是在拆解哪一個真實案例
- 這個案例背後有哪些延伸文章、方法、決策與觀察

因此這一輪的功能重點不是增加更多內容類型，而是把既有內容之間的關係顯示出來。

## 3. 範圍

本輪包含：

- 單篇文章頁顯示關聯 project
- 單一 project 頁顯示相關已發佈文章列表
- 前台資料讀取邊界補齊，讓 blog 與 project 關聯可透過同一套內容邏輯讀取
- 補對應 spec / 文件，讓後續擴充不需要重新定義關聯模型

本輪不包含：

- project 後台 CRUD
- 多對多 tag / topic 系統
- 自動推薦文章
- project 與 blog 的排序策略大改
- 首頁大改版
- 文章內嵌 preview card 或複雜內容編排元件

## 4. 使用情境

### 情境 A：從文章回到案例

- 讀者進入某篇文章
- 若該文章有關聯 project，頁面可清楚看見「這篇文章屬於哪個案例」
- 讀者可直接點回該案例頁

### 情境 B：從案例延伸看文章

- 讀者進入某個 project 頁
- 若該 project 關聯到已發佈文章，頁面可看見延伸文章列表
- 讀者可沿著這些文章理解更細的背景、決策與方法

### 情境 C：純觀點文章不受影響

- 若某篇文章沒有關聯 project
- 它仍可獨立存在，不需要被強迫掛到任何案例底下

## 5. 內容關係定義

- 一個 `project` 可對應多篇 `blog post`
- 一篇 `blog post` 最多只對應一個 `project`
- `related_project_id` 仍維持可空
- 前台只顯示 `published` 文章的關聯結果

這代表目前仍採一對多關係，而不是進一步升級成多對多內容圖譜。

## 6. UI / UX 原則

### 6.1 文章頁

- 若文章有關聯 project，應在文章頁顯示一個明確但不搶主內容的「相關案例」區塊
- 區塊至少包含：
  - project title
  - project summary 的精簡版本
  - 連往 project page 的入口
- 若無關聯 project，該區塊不顯示

### 6.2 Project 頁

- 若 project 有相關已發佈文章，應顯示「延伸文章」或同等語意區塊
- 區塊至少包含：
  - 文章標題
  - 日期
  - excerpt 或一行簡述
  - 連往文章頁的入口
- 若沒有相關已發佈文章，該區塊不顯示

### 6.3 呈現原則

- 關聯資訊是脈絡補強，不應壓過文章內容或案例內容本身
- UI 要讓讀者一眼理解這是內容關係，而不是廣告式推薦

## 7. 架構邊界

這一輪雖然是前台功能，但不應直接在 page 層手寫跨資料來源拼裝邏輯。

需要維持以下邊界：

- `page`：只負責組裝畫面與宣告資料需求
- `service layer`：定義文章頁與案例頁需要的關聯資料組合
- `repository layer`：提供文章與 project 的查詢能力
- `infra layer`：隔離 Supabase 與 Markdown 來源差異

## 8. 實作方向

目前 blog post 已在 Supabase，projects 仍主要來自 Markdown。

因此本輪的合理策略是：

1. 保留 project 內容主來源仍為 Markdown
2. 在內容層新增可讀取 project 基本資訊與 related posts 的能力
3. 不在 page 裡直接做「先抓 project，再手動掃全部 posts」這種散寫邏輯

建議至少補出以下能力：

- 文章頁資料組合：
  - 取得單篇 published post
  - 若 `related_project_id` 存在，讀取對應 project 基本資訊
- project 頁資料組合：
  - 取得單一 published project
  - 依 project id 列出相關 published posts

## 9. 資料讀取需求

### 9.1 Posts 側

需要有能力：

- `getPublishedPostBySlug(slug)`
- `listPublishedPostsByProjectId(projectId)`

### 9.2 Projects 側

需要有能力：

- `getProjectById(id)`
- `getProjectBySlug(slug)`
- 若 project 仍以 Markdown 為主，需有對應 adapter 可提供最小前台所需欄位

### 9.3 View model

前台不應直接依賴資料表欄位命名。

文章頁與 project 頁應各自有清楚的 view model，例如：

- `blog post page data`
- `project page data`

讓頁面知道自己拿到的是「可渲染資料」，不是 provider-specific raw record。

## 10. 成功標準

- 有關聯 project 的文章頁可清楚連回對應案例
- 有相關文章的 project 頁可顯示延伸文章列表
- 未關聯的文章與無延伸文章的 project 頁仍能自然顯示
- 前台只顯示 `published` 文章，不洩漏 draft
- 關聯資料讀取邏輯不散落在 page / component 中

## 11. 驗證重點

- 文章有關聯 project 時，文章頁顯示正確 project 資訊
- 文章沒有關聯 project 時，文章頁不出現空區塊
- project 有相關已發佈文章時，project 頁顯示正確列表
- project 只有 draft 文章或沒有文章時，project 頁不出現空列表
- 關聯的 project 若不存在，前台應採安全降級，不讓頁面爆掉

## 12. 建議切片

### Slice 1：Spec 與資料邊界對齊

- 補這份主 spec
- 決定 project / post 雙向連結的最小 view model

### Slice 2：Repository / service 擴充

- 補 posts 與 projects 的必要讀取能力
- 建立文章頁 / project 頁資料組合函式

### Slice 3：文章頁 UI

- 在 blog post page 顯示相關案例區塊

### Slice 4：Project 頁 UI

- 在 project page 顯示延伸文章列表

### Slice 5：驗證與文件同步

- 補測試
- 更新 `NOW.md`
- 視需要回寫 blog admin 相關主 spec 的目前進度

## 13. 決策界線

這一輪先明確不跨過以下界線：

- 不把 project 搬進完整後台
- 不把 blog / project 抽象成通用 content type system
- 不做多對多內容關係
- 不為了這一輪就重做整個 project 資料來源

這些都可能是未來方向，但不是這一輪要解的問題。
