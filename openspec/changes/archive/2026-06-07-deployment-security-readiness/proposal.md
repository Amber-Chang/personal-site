## Why

The site can now build and serve its core pages, but the current admin and deployment posture is still at MVP level. Before treating the site as ready for public deployment, we need a clear baseline for single-owner admin safety, production configuration, and end-to-end publishing verification.

## What Changes

- Add a deployment security readiness round focused on public launch safety rather than new content features
- Harden the single-password admin login flow with minimum brute-force resistance and clearer session expectations
- Define the production deployment checklist, required environment configuration, and launch verification steps
- Record the manual admin publishing flow that must pass before the site is considered ready for release

## Capabilities

### New Capabilities
- `admin-login-protection`: Define the minimum safeguards required for the single-owner admin login flow before public deployment
- `deployment-readiness`: Define the production configuration, verification flow, and release criteria required before the site is treated as launch-ready

### Modified Capabilities

## Impact

- Affected code will primarily live in `src/lib/auth/**`, `src/app/admin/login/**`, and supporting docs such as `README.md`, `NOW.md`, and deployment guidance
- Adds verification and release requirements on top of the existing Supabase-backed admin architecture without introducing OAuth 2.0 or multi-user auth
- Creates the OpenSpec contract for the next implementation round covering login protection, session policy, deployment checks, and admin workflow verification
