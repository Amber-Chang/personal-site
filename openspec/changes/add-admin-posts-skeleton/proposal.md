## Why

The blog admin foundation is in place, but `/admin/posts` is still only a placeholder and there is no usable path to create or edit posts from the app. We need the next slice to prove the foundation can support real admin workflows before adding richer editing and migration features.

## What Changes

- Replace the `/admin/posts` placeholder with a real admin posts list page
- Add `/admin/posts/new` with a minimal post creation form that can create draft-backed records
- Add `/admin/posts/[id]` with a minimal edit form that can load and update existing posts
- Wire these admin pages through the existing admin service/repository boundaries instead of direct page-level provider calls

## Capabilities

### New Capabilities
- `admin-posts-management`: Allow the admin to list posts, open create/edit flows, and save minimal blog post records through the existing admin content path

### Modified Capabilities

## Impact

- Affected code will primarily live in `src/app/admin/posts/**`, `src/components/admin/**`, and the existing content service/repository boundaries
- Reuses the current Supabase-backed admin content path and exposes whether that foundation is sufficient for real CRUD UI work
- Adds new tests for admin post listing, loading, and create/update actions
