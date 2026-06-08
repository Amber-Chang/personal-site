## 1. Content and action contracts

- [x] 1.1 Write failing tests for admin project page-data, actions, and repository contracts covering list, create, update, not-found, and relation-option visibility
- [x] 1.2 Extend content-layer types, repository contracts, and service methods with explicit admin project identity read/write capabilities

## 2. Project identity persistence

- [x] 2.1 Implement Supabase project repository support for admin project list, get-by-id, create, and update flows with readable duplicate-slug behavior
- [x] 2.2 Keep published-only relation options aligned with project admin writes and verify the existing sync tooling still works with the repository changes

## 3. Admin UI and routing

- [x] 3.1 Add `/admin/projects` list page with empty state and create entry point
- [x] 3.2 Add shared admin project form plus `/admin/projects/new` and `/admin/projects/[id]` pages using authenticated server actions

## 4. Verification and sync

- [x] 4.1 Run targeted project-admin tests plus broader admin/content verification
- [x] 4.2 Update `NOW.md` and directly related docs/spec progress notes after implementation and verification
