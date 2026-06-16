## 1. OAuth auth contract

- [x] 1.1 Write failing auth tests for allowlisted-email evaluation, callback success/failure redirects, and protected admin access under authenticated vs non-admin users
- [x] 1.2 Add or refactor shared auth helpers so admin eligibility is determined centrally from normalized email plus authenticated Supabase session state

## 2. Login and callback flow

- [x] 2.1 Replace the `/admin/login` primary password entry with a Google OAuth login entry and controlled admin login error states
- [x] 2.2 Implement the OAuth callback flow that exchanges the session, validates the allowlisted admin email, signs out unauthorized users, and redirects authorized users into `/admin/posts`

## 3. Guard and logout migration

- [x] 3.1 Update protected admin route and mutation guards to use the new authenticated-admin authorization model
- [x] 3.2 Update admin logout to clear the active Supabase-backed session and verify protected admin routes are inaccessible afterward
- [x] 3.3 Remove or demote the old password-login flow so the repo no longer treats it as the formal primary admin entry

## 4. Verification and documentation sync

- [x] 4.1 Run targeted auth tests plus broader impacted verification for admin posts/projects flows
- [ ] 4.2 Re-run manual admin verification for login, logout, draft, publish, unpublish, and unauthorized-account rejection
- [x] 4.3 Update `docs/google-oauth-admin-upgrade-spec.md`, `docs/blog-admin-implementation-spec.md`, `docs/deployment-security-readiness.md`, and `NOW.md` to match the implemented auth model
