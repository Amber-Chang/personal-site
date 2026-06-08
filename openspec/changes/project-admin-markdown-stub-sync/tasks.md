## 1. Spec and data model alignment

- [x] 1.1 Write failing tests for expanded project repository, public project page/list data, homepage featured project reads, and admin project form fields
- [x] 1.2 Add the missing Supabase project content schema and extend content-layer types/contracts for Supabase-first projects

## 2. Public and admin project content implementation

- [x] 2.1 Implement repository/service support for full public/admin project content reads and writes
- [x] 2.2 Expand admin project create/edit flows to manage the current public project fields

## 3. Public page migration

- [x] 3.1 Replace `/projects` and homepage featured project reads with Supabase-backed public content reads
- [x] 3.2 Replace `/projects/[slug]` with a Supabase-first public project page path while preserving related posts behavior

## 4. Migration and verification

- [x] 4.1 Add or update Markdown-to-project import tooling so existing project content can seed Supabase records
- [x] 4.2 Run verification, sync docs, and update progress tracking after the migration path and public reads are working
