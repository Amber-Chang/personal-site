# System Architecture Principles

> 用途：定義這個網站未來功能擴張時的最小架構原則，避免每次新增功能都重做系統設計。

## 1. 原則

- 先做夠用的 MVP，但資料模型與模組邊界要避免把未來路徑鎖死
- 優先保持內容模型、權限模型與畫面層解耦
- 能共用的能力應抽成基礎層，不把 feature-specific 邏輯散落在頁面裡
- 不為了假想需求過度設計，但對高機率會擴張的能力要預留清楚邊界

## 1.5 目前選定的技術與分工

- `Next.js` 負責前台頁面、admin 頁面、Server Actions、Route Handlers 與應用層邏輯
- `Supabase` 負責資料庫、登入與基本授權基礎設施
- `Postgres` 是內容資料的主要結構來源，適合未來擴張內容關聯
- `Markdown` 仍是目前前台既有內容來源，但 blog admin 會逐步把 blog 內容主來源切向資料庫

## 2. 目前高機率會擴張的能力

- 內容來源：從 Markdown 逐步走向資料庫內容
- 後台能力：從 blog admin 擴展到更多內容管理
- 身分驗證：從單人登入擴展到更完整的存取控制
- 內容關聯：從 blog post 關聯 project，逐步形成較完整的內容圖譜

## 3. 後續 implementation spec 最少要回答的問題

- 這個功能的責任邊界是什麼
- 它依賴哪些共用基礎能力
- 哪些資料模型是 feature 專屬，哪些可能成為共用內容模型
- 哪些地方先為 MVP 簡化，未來擴展時要怎麼延伸
- 它會不會改變前台、後台、資料層或權限層的責任切分

## 4. 系統設計偏好

- 前台頁面負責展示，不直接承擔複雜內容規則
- 內容讀寫邏輯集中在資料存取層，不散落在 route 與 component
- schema 設計優先支援清楚狀態欄位、發佈流程與關聯欄位
- auth 與授權規則獨立思考，不把「先只有一位使用者」當成永遠成立的前提
- 新功能若建立在既有能力上，優先補強既有抽象，不平行再做第二套

## 4.5 建議責任切分

- `app/`：頁面、layout、組裝 UI、宣告資料需求
- `Server Actions`：處理後台表單操作，例如新增、更新、發佈
- `Route Handlers`：處理 auth callback、preview、webhook 或外部 API
- `service layer`：集中商業規則與流程判斷
- `repository layer`：集中資料讀寫，隔離 Supabase-specific 存取細節
- `infra layer`：放 Supabase client 與 provider adapter

## 5. Blog Admin 的架構定位

- `blog admin` 是第一個正式引入資料庫與登入的能力
- 它不只是單一功能，也是在建立未來內容後台的最小底座
- 因此 blog admin 的 implementation spec 應同時處理：
  - blog post 的 CRUD 需求
  - 內容資料層與前台讀取方式的切分
  - 後續擴展到其他內容類型時的可延伸性

## 6. 目前明確不採用的做法

- 不把 `Next.js` 當成唯一後端能力來源，仍需搭配資料庫與 auth 基礎設施
- 不在 page 或 component 直接散寫 `supabase.from(...)`
- 不為不同內容類型各自做一套平行的資料存取與 auth 流程
