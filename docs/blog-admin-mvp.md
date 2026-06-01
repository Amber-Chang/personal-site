# Blog Admin MVP

> 用途：定義文章編輯後台第一版要解決的問題、範圍與內容模型。

## 1. 目標

這個功能的目標不是把整個網站 CMS 化，而是先建立一個只服務寫文章的輕量後台。

第一版希望解決的核心問題只有一個：

- 我不需要手動改 markdown 檔，也能登入後台完成文章新增、編輯、存草稿與發佈

## 2. 使用者

第一版只有一位使用者：

- 站主本人

這代表第一版不需要多人協作、角色權限或審核流程。

## 3. 產品範圍

第一版要做的事情：

- 提供登入頁
- 提供文章列表頁
- 提供新增文章頁
- 提供編輯文章頁
- 支援草稿與發佈狀態
- 文章內文使用 Markdown 編輯器
- 前台文章列表頁顯示已發佈文章
- 前台單篇文章頁顯示已發佈內容

第一版先不做的事情：

- 不做首頁內容管理
- 不做 about 頁管理
- 不做 projects 後台管理
- 不做多人角色與權限系統
- 不做媒體庫
- 不做複雜排版編輯器
- 不做 tag 系統

## 4. 技術方向

- 前台維持 Next.js App Router + TypeScript
- 後台登入採 email magic link
- 文章內容改存資料庫
- 第一版正式採用 Supabase 作為資料儲存與登入基礎
- 內文編輯體驗以 Markdown 為主，不追求 Notion-like rich text

採用理由：

- 它同時解決登入、資料庫與基本權限需求，符合單人使用的 MVP 範圍
- 可以用最少基礎設施完成草稿、發佈與後台 CRUD，不需要先自建一套內容系統
- 對目前網站來說，這是為 blog admin 導入的最小後端，而不是把整站全面 CMS 化

## 5. 內容模型

第一版先保留 `projects` 與 `blog posts` 兩種不同內容，不用 tag 取代內容類型。

### Projects

- `id`
- `title`
- `slug`
- `summary`
- `content_markdown`
- `status`
- `published_at`
- `created_at`
- `updated_at`

### Blog Posts

- `id`
- `title`
- `slug`
- `excerpt`
- `content_markdown`
- `status`
- `published_at`
- `related_project_id`：可空，代表這篇文章可選擇關聯某個 project
- `created_at`
- `updated_at`

## 6. 內容關係

- `project` 是案例主頁
- `blog post` 是單篇文章
- 一個 `project` 可以對應多篇 `blog post`
- 一篇 `blog post` 可以不屬於任何 `project`

這代表未來可以自然支援：

- 某個 project 底下有多篇延伸文章
- 某些文章純粹是觀點寫作，不屬於任何 project

## 7. 前後台邊界

第一版後台只處理 `blog posts`。

`projects` 先維持目前管理方式，但資料模型要預留可被文章關聯的能力。

這樣可以把第一版範圍收斂成：

- 登入
- 文章 CRUD
- 草稿 / 發佈
- 可選的 project 關聯

## 8. 成功標準

- 我可以自己登入後台管理文章
- 我可以建立草稿並在之後繼續編輯
- 我可以發佈文章，並讓前台穩定顯示已發佈內容
- 我不需要再手動修改 repo 內的 markdown 檔才能發文
- 這套後台不會把整個網站變成過重的 CMS

## 9. Implementation Slices

建議開發順序是：

1. 資料庫層
2. 後台層
3. 前台層
4. 整合驗證

### 9.1 資料庫層

先定義資料模型、登入方式與最基本的存取邏輯。

包含：

- 建立 `projects` table
- 建立 `blog_posts` table
- 建立 `blog_posts.related_project_id`
- 建立 `status`、`published_at`、`created_at`、`updated_at`
- 建立 email magic link 登入流程
- 建立後台只允許登入使用者存取的基本權限邏輯

完成標準：

- 可以在資料庫建立與更新文章
- 可以區分草稿與已發佈內容
- 文章可以選擇關聯某個 project

### 9.2 後台層

先做最小可用的文章管理介面，只處理 `blog posts`。

包含：

- 登入頁
- 後台文章列表頁
- 新增文章頁
- 編輯文章頁
- Markdown 編輯器
- 儲存草稿
- 發佈文章
- 選填關聯 project

完成標準：

- 我可以自己登入後台
- 我可以新增、修改與發佈文章
- 我不需要再碰 repo 內的 markdown 檔

### 9.3 前台層

把現有 blog 的顯示來源從 markdown 切到資料庫。

包含：

- `/blog` 顯示已發佈文章列表
- 單篇文章頁顯示已發佈內容
- 未發佈文章不可被公開讀到
- 預留未來顯示相關 project 的位置，但第一版可不先顯示

完成標準：

- 前台只會顯示已發佈文章
- 單篇文章可正常渲染 Markdown 內容

### 9.4 整合驗證

最後驗證整條內容流程是否成立。

包含：

- magic link 登入流程
- 建立草稿
- 編輯草稿
- 發佈後前台可見
- 未發佈內容前台不可見
- 關聯 project 不會造成文章建立或更新失敗

### 9.5 建議待辦順序

1. 建資料表與登入
2. 建後台文章列表
3. 建文章新增與編輯表單
4. 接上 Markdown editor
5. 前台 blog 改讀資料庫
6. 補權限與發佈邏輯
7. 做整體驗證
