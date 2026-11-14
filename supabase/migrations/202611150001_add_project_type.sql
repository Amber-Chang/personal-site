-- 專案類型（SPEC-002）：每個專案必填 work / research / side 其中一個。
-- 可重複執行；只新增欄位，現行程式不讀這個欄位，可在新程式上線前先套用。

-- 1. 先加可為空、沒有預設值的欄位，既有資料保持空值，才能依 slug 回填。
alter table public.projects
add column if not exists project_type text;

-- 2. 設預設值：從這一步起，還沒帶這個欄位的舊程式新增專案時會得到 'side'。
alter table public.projects
alter column project_type set default 'side';

-- 3. 依 slug 回填。只補空值，重跑時不會覆蓋後台改過的類型。
update public.projects
set project_type = case slug
  when 'ai-builder-workflow' then 'side'
  when 'modern-martech-architecture' then 'research'
  when 'turning-work-into-thinking' then 'side'
  when 'ai-writing-review-product' then 'work'
  when 'sms-management-platform' then 'work'
  else 'side'
end
where project_type is null;

-- 4. 回填完才設為必填。
alter table public.projects
alter column project_type set not null;

-- 5. 只接受三個值。先刪再建，重跑時不會因同名限制已存在而失敗。
alter table public.projects
drop constraint if exists projects_project_type_check;

alter table public.projects
add constraint projects_project_type_check
check (project_type in ('work', 'research', 'side'));
