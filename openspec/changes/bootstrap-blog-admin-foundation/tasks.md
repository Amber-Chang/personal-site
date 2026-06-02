## 1. Supabase foundation

- [x] 1.1 Add Supabase dependencies and environment variable contract for app, server, and admin usage
- [x] 1.2 Create shared Supabase client helpers for browser, server, and privileged server-side access
- [x] 1.3 Add initial database schema definitions for `projects` and `blog_posts`

## 2. Authentication flow

- [x] 2.1 Write failing tests for centralized admin session guard behavior
- [x] 2.2 Implement admin guard utilities and auth callback flow to satisfy the guard tests
- [x] 2.3 Add admin login action flow for magic link sign-in using allowed admin access rules

## 3. Content access boundaries

- [x] 3.1 Write failing tests for repository and service contracts covering published reads and admin writes
- [x] 3.2 Add content types and repository interfaces for blog posts and project options
- [x] 3.3 Implement Supabase-backed repository adapters and service-layer publish/access rules to satisfy the contract tests

## 4. Verification

- [x] 4.1 Verify schema, auth flow, and content boundary tests pass locally
- [x] 4.2 Document any required setup notes or follow-up constraints discovered during implementation
