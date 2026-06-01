## 1. Admin posts list

- [x] 1.1 Write failing tests for loading admin post list data through the existing admin content path
- [x] 1.2 Replace the `/admin/posts` placeholder with a real list page and edit/new entry points

## 2. Admin post form flows

- [x] 2.1 Write failing tests for create and update post action behavior
- [x] 2.2 Add a shared admin post form component for the skeleton field set
- [x] 2.3 Add `/admin/posts/new` and `/admin/posts/[id]` pages that use the shared form

## 3. Admin mutations

- [x] 3.1 Implement create post server action through the existing service/repository path
- [x] 3.2 Implement update post server action through the existing service/repository path
- [x] 3.3 Handle missing/invalid admin post lookups with safe routing behavior

## 4. Verification

- [x] 4.1 Verify new list/create/edit tests pass locally
- [x] 4.2 Verify the full suite and lint still pass after the admin UI skeleton is wired in
