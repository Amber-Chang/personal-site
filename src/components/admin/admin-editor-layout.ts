// 功能：後台文章與專案編輯頁的寬度規則（SPEC-003 追加）。
// 寬螢幕（lg 以上）時編輯頁放寬到 max-w-7xl，讓 Markdown 編輯區與預覽並排時每邊約 575px：
// 全站根版面的內容外框（max-w-5xl）用 has-[[data-admin-editor]] 只對這四個編輯頁放寬，編輯頁的 main 帶 data-admin-editor。
// 其他內容（標題、一般欄位、上傳區塊、刪除區塊）維持原本的寬度：49rem，
// 等於原本 max-w-4xl 頁面扣掉左右內距後的寬度。只有標了 data-admin-wide 的區塊用滿整個寬度。
// 用法：放在容器上，作用在它的直接子元素；lg 以下不受影響。

export const ADMIN_EDITOR_NARROW_CHILDREN = "lg:[&>*:not([data-admin-wide])]:max-w-[49rem]";
