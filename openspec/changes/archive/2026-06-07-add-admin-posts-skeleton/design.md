## Context

The project now has Supabase schema, auth flow, service/repository boundaries, and a verified admin content path. However, `/admin/posts` is still a placeholder page, and the app does not yet prove that those boundaries can support actual listing, creation, and editing of blog posts through the UI layer.

This slice should stay intentionally narrow:

- validate that admin pages can read and write through the existing service-role-backed repository path
- provide a minimal but real admin UI for posts
- avoid mixing in migration work, rich editor work, or publication UX polish

## Goals / Non-Goals

**Goals:**

- Build a real `/admin/posts` list page
- Build minimal `/admin/posts/new` and `/admin/posts/[id]` flows
- Keep page-level code thin and route all writes through actions + services
- Prove the foundation can support admin CRUD skeleton work

**Non-Goals:**

- Rich Markdown editing experience
- Preview, autosave, or advanced editor UX
- Blog front-end switching to database in this round
- Markdown import/migration
- Project admin management

## Decisions

### Use a shared admin post form component

The create and edit pages should share one minimal form structure so field shape stays consistent and future enhancements only need one form surface.

Alternative considered:

- Separate create/edit page implementations: rejected because it would duplicate field wiring immediately

### Keep server actions as the mutation boundary

Create and update operations will live in server actions, which call the existing service/repository path. This keeps the form simple and preserves the existing app-layer boundary.

Alternative considered:

- Direct client-side Supabase writes: rejected because it bypasses the chosen architecture

### Treat “skeleton” as real CRUD wiring, not placeholder pages

This round will still create and update real post records. “Skeleton” means the UI is intentionally minimal, not fake.

Alternative considered:

- Placeholder form pages with no working data path: rejected because it would not validate the foundation

## Risks / Trade-offs

- [Minimal UI may expose rough edges in error handling] → keep actions returning controlled states and prefer simple server redirects/messages over richer interaction for now
- [The field set may still change once richer editor work starts] → centralize the form shape so later changes stay localized
- [Draft/published semantics can complicate create/update flows] → keep the initial fields aligned with the current schema and reuse service-layer publish rules later instead of re-encoding them in pages

## Migration Plan

1. Replace the admin posts placeholder with a list powered by admin repositories
2. Add new/edit routes and shared form component
3. Add create/update server actions
4. Validate the flows with tests and lint

Rollback strategy:

- Revert the admin UI routes while keeping the already validated backend foundation in place

## Open Questions

- Whether the first form submit should redirect back to the list or stay on the edit page after create
- Whether `status` should be editable directly in this round or default to draft with later publish controls
