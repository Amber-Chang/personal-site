## Why

The site can already relate blog posts to projects, but creating a new relation target still depends on Markdown authoring and sync tooling. To make the content graph usable in day-to-day admin work, the project identity layer needs a lightweight admin surface.

## What Changes

- Add a lightweight admin flow for project identities at `/admin/projects`, `/admin/projects/new`, and `/admin/projects/[id]`
- Allow admins to create and update the minimum project identity fields needed for routing and blog relations: `title`, `slug`, `summary`, and `status`
- Extend the admin content service / repository boundary with project identity list, create, and update capabilities
- Keep project body content and full project-page authoring out of scope so `projects` does not become a full CMS in this round

## Capabilities

### New Capabilities
- `project-identity-admin`: Define how admins manage project identities used by blog relations and project routing

### Modified Capabilities

## Impact

- Affected code will primarily live in `src/app/admin/**`, `src/components/admin/**`, `src/lib/content/**`, and `src/lib/infra/repositories/**`
- This round extends the existing admin content path without changing the public project page source of truth
- It adds new admin CRUD behavior for project identities while preserving the current Markdown-backed project content model
