## Why

The site can already publish blog posts and show project pages, but the two content tracks still behave like separate islands. To better communicate how work, thinking, and outcomes connect, the next round needs to turn the existing `blog post -> project` relationship into an actual front-end content path.

## What Changes

- Add a front-end content linking round that lets published blog posts link back to their related project
- Add a reciprocal project-page experience that lists published posts related to that project
- Extend the content service / repository boundary so blog and project relationship data is assembled outside page-level UI code
- Keep `projects` on the current Markdown source for now while still exposing the minimum data needed for relationship rendering

## Capabilities

### New Capabilities
- `project-content-linking`: Define how published blog posts and project pages expose their relationship to readers

### Modified Capabilities

## Impact

- Affected code will primarily live in `src/app/blog/**`, `src/app/projects/**`, `src/lib/content/**`, and project-reading adapters
- This round extends the existing blog admin content model without introducing project admin CRUD or a generalized CMS
- It creates the OpenSpec contract for implementing blog/project relationship rendering through repository and service boundaries
