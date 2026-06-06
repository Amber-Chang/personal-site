# Archive Note

This change was archived on 2026-06-07 after implementation was completed.

## Auth spec note

The original `specs/blog-admin-authentication/spec.md` in this change describes a Supabase magic link flow.

That auth direction is no longer the current system of record. The project later moved to:

- single-owner password-gated admin login
- random server-side admin sessions
- minimum login rate limiting for deployment readiness

Those current behaviors are represented by later archived changes and by the active main specs under:

- `openspec/specs/admin-server-side-sessions/spec.md`
- `openspec/specs/admin-login-protection/spec.md`
- `openspec/specs/deployment-readiness/spec.md`

The `blog-content-storage` capability from this foundation change was synced forward to main specs. The old magic-link auth delta was archived for history but intentionally not synced as the current auth definition.
