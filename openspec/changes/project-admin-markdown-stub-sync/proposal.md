## Why

Project admin can now create project identities, but the public site still reads projects from repo Markdown files. As a result, admin-created projects do not appear on `/projects`, project detail pages, or homepage featured work, which breaks the expected content workflow.

## What Changes

- Move public project reads to a Supabase-first content path for `/projects`, `/projects/[slug]`, and homepage featured projects
- Expand the `projects` data model and admin project form so public project content can be authored from the admin UI
- Reposition `content/projects/*.md` from public source of truth to migration/import source
- Preserve published-only public visibility rules and existing blog-to-project relationship behavior

## Capabilities

### New Capabilities
- `projects-supabase-first`: Define Supabase-first public and admin project content behavior

### Modified Capabilities
- `project-identity-admin`: Expand project admin from identity-only management to public project content management

## Impact

- Affected code will primarily live in `src/app/projects/**`, `src/app/**home*`, `src/components/**project*`, `src/lib/content/**`, `src/lib/infra/repositories/**`, `scripts/**`, and Supabase migrations
- This round changes the public source of truth for projects and will likely deprecate direct Markdown-based public reads
- It aligns admin project writes, blog relation targets, and public project rendering onto the same content model
