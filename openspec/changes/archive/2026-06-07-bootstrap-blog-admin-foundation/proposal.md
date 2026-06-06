## Why

The site has already defined a blog admin MVP, but it still lacks the backend foundation needed to move blog publishing away from manual Markdown editing. We need a first implementation round that establishes database-backed content, admin authentication, and app-layer boundaries before UI-heavy admin work begins.

## What Changes

- Add a Supabase-backed foundation for blog admin, including database schema for `projects` and `blog_posts`
- Add magic link authentication flow for admin access and centralize admin session guards
- Add repository and service boundaries so blog content logic is not coupled directly to pages or Supabase queries
- Prepare the app to switch blog content reads from Markdown to database-backed access in a later round

## Capabilities

### New Capabilities
- `blog-admin-authentication`: Allow the site owner to sign in through magic link and access protected admin flows through centralized session guards
- `blog-content-storage`: Store blog admin content in database-backed models and expose structured read/write access through repository and service boundaries

### Modified Capabilities

## Impact

- Affected code will include auth handling, content data access, and future admin entry points in `src/app` and `src/lib`
- Adds Supabase as an active runtime dependency for authentication and database-backed content
- Introduces database schema, environment configuration, and OpenSpec-tracked implementation tasks for the first backend round
