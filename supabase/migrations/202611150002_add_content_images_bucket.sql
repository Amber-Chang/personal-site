-- 文章與專案內文圖片（SPEC-003）：公開讀取的 Storage bucket `content-images`。
-- 單檔上限 5MB（5,242,880 bytes），只允許 PNG、JPEG、WebP、GIF（不允許 SVG，避免夾帶腳本）。
-- 可重複執行：bucket 已存在時，把設定更新成下面的值，不報錯。
--
-- 刻意不建立任何 storage.objects 政策：anon 與 authenticated 角色不能直接寫入、更新或刪除。
-- 寫入只能透過本站伺服器（service role）發出的一次性上傳網址；公開讀取由 bucket 的 public 設定提供。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
