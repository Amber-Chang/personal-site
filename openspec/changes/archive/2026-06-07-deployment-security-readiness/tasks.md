## 1. Deployment security document baseline

- [x] 1.1 Expand `docs/deployment-security-readiness.md` with scope, admin model assumptions, required env, release gates, and known limitations
- [x] 1.2 Cross-check the new readiness document against `docs/blog-admin-implementation-spec.md`, `README.md`, and `NOW.md` for conflicting auth or deployment language

## 2. Admin login protection

- [x] 2.1 Add failing tests for blocked login attempts and post-success reset behavior in `src/lib/auth/login-action.test.ts`
- [x] 2.2 Implement a minimal login rate-limit helper in `src/lib/auth/login-rate-limit.ts`
- [x] 2.3 Integrate login rate limiting into `src/lib/auth/login-action.ts` and the admin login server action flow
- [x] 2.4 Run targeted auth tests and then the full test suite

## 3. Session policy hardening

- [x] 3.1 Add or update tests covering admin session cookie defaults and intended lifetime in `src/lib/auth/session.test.ts`
- [x] 3.2 Tighten or confirm `src/lib/auth/session.ts` cookie policy and session lifetime based on the chosen single-owner deployment baseline

## 4. Deployment checklist and release gates

- [x] 4.1 Update `README.md` with production env expectations, admin password requirements, and deployment caveats
- [x] 4.2 Update `NOW.md` so current priorities and next steps reflect deployment security readiness and manual admin verification

## 5. Manual admin publishing verification

- [x] 5.1 Document the reproducible admin publish/unpublish verification checklist in the readiness docs
- [x] 5.2 Execute the documented manual verification flow in a valid env-backed environment and record the result

## 6. Release readiness validation

- [x] 6.1 Run `npm run lint`, `npm test`, and `npm run build`
- [x] 6.2 Review the result against the new readiness criteria and record whether the site is ready for preview-only or production deployment
