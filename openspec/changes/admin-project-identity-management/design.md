## Context

The site already has a `projects` table in Supabase and now uses it as the identity source for blog post relations and admin select options. However, admins still cannot create a new project identity from the UI; they must rely on Markdown files plus a sync script.

The relevant constraints are:

- blog admin already has a working pattern for list / new / edit pages, shared forms, and server actions
- public project pages still rely on Markdown-backed content
- this round must improve admin ergonomics without splitting project content into an accidental second CMS
- duplicate slug handling and published/draft visibility rules should stay consistent with existing admin behavior

This is a cross-cutting admin change because it touches routing, page-data loaders, server actions, content-layer contracts, and repository writes.

## Goals / Non-Goals

**Goals:**

- Add a lightweight admin UI for listing, creating, and updating project identities
- Reuse the existing admin content architecture rather than creating page-level database mutations
- Limit editable fields to the minimum identity set needed for blog relations and route stability
- Ensure published project identities appear in blog relation options while draft identities do not
- Keep the behavior testable through content, page-data, and action seams

**Non-Goals:**

- Build a full project CMS with long-form content editing
- Move public project page rendering from Markdown to Supabase
- Add tags, outcomes, role, period, preview, media, or rich editor support
- Solve bidirectional sync between database content and Markdown source files

## Decisions

### 1. Treat project admin as identity management, not content management

This round will only manage the minimal fields that define a project as a relation target and route identity: `title`, `slug`, `summary`, and `status`.

Why this approach:

- it solves the real workflow pain without prematurely migrating all project authoring
- it keeps source-of-truth boundaries explicit
- it avoids building a misleading half-finished project CMS

Alternatives considered:

- **Full project admin now**: too much scope, would force an immediate project source-of-truth decision
- **Keep only sync tooling**: still leaves the admin workflow awkward and indirect

### 2. Reuse the post-admin page and action pattern

The implementation will mirror the existing post admin flow with dedicated project list/create/edit routes, shared form component, data loaders, and server actions.

Why this approach:

- it keeps admin UX consistent
- it reduces architecture drift
- it leverages already-proven auth and mutation guard patterns

Alternatives considered:

- **Single modal or inline editor on the post form**: faster short-term, but harder to scale and weaker for managing multiple projects
- **Ad hoc mutations directly in pages**: violates the content-layer boundary already established in the repo

### 3. Extend the existing project repository with admin CRUD, not just sync upsert

The current repository can list admin projects and upsert identities for sync. This round will add explicit create/read/update methods for project admin pages instead of forcing the UI to reuse a sync-specific interface.

Why this approach:

- admin behavior becomes clearer and more intention-revealing
- validation, duplicate handling, and redirect flows are easier to reason about
- sync tooling can continue to exist without becoming the only write path

Alternatives considered:

- **Drive admin entirely through upsert**: technically possible, but blurs create/update intent and makes UX/error handling less explicit

## Risks / Trade-offs

- **[Database identity and Markdown content can drift]** → Keep this round limited to identity fields and document that public project body content still depends on Markdown
- **[Admins may expect full project editing once a project UI exists]** → Use explicit helper copy in the form and spec docs to signal this is identity-only in v1
- **[Slug edits could break existing public project routes if Markdown is not updated]** → Warn through field copy and keep slug editing explicit rather than hidden
- **[Published/draft visibility rules could diverge from relation options]** → Continue sourcing relation options from published project identities only

## Migration Plan

1. Add OpenSpec artifacts and a docs-level implementation spec
2. Add failing tests for project admin data loading, actions, and content-layer contracts
3. Extend content types, repository contracts, and Supabase project repository with admin CRUD
4. Add admin project list/new/edit routes and shared project form
5. Verify that published projects appear in relation options and draft projects do not
6. Run targeted tests, broader suite, and doc-sync checks
7. Update `NOW.md` and relevant implementation docs

Rollback strategy:

- If the admin project UI causes regressions, remove the admin routes and shared form while leaving the repository extensions isolated for later reuse
- If slug-editing risk proves too confusing, narrow the editable field set in a follow-up without undoing the rest of the list/create flow

## Open Questions

- Should the admin projects list get a dedicated nav link in the shared admin chrome immediately, or is direct routing enough for the first slice?
- Do we want to prevent slug edits for already-related projects later, or is warning copy enough for now?
