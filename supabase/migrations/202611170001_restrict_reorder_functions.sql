-- 架構檢視 F1（2026-11-17）：排序函式只給伺服器使用。
-- reorder_blog_posts／reorder_projects 以 security definer（擁有者權限）執行。
-- Postgres 預設把函式的 EXECUTE 給 PUBLIC，所以拿到公開金鑰的任何人都能透過 /rest/v1/rpc 改網站排序。
-- 後台排序走 service_role（src/lib/infra/repositories/factory.ts 的 createAdminContentRepositories），不受影響。
-- 可重複執行：revoke／grant 重跑不會出錯。

revoke execute on function public.reorder_blog_posts(uuid[]) from public, anon, authenticated;
revoke execute on function public.reorder_projects(uuid[]) from public, anon, authenticated;

grant execute on function public.reorder_blog_posts(uuid[]) to service_role;
grant execute on function public.reorder_projects(uuid[]) to service_role;

-- Supabase 安全檢查：觸發器函式固定 search_path，避免被同名物件劫持。
-- 函式只用到 now()（在 pg_catalog，空的 search_path 仍找得到）。
alter function public.set_updated_at_timestamp() set search_path = '';
