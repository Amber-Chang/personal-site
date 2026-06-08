## 1. Content relationship contracts

- [x] 1.1 Write failing tests for public blog/project page data that cover related project rendering, related post listing, and safe missing-data fallbacks
- [x] 1.2 Extend content-layer types and repository contracts with the minimum relationship read models needed for published post-by-project and project lookup flows

## 2. Relationship data composition

- [x] 2.1 Implement repository / adapter support for resolving published posts by project and project summary lookups needed by the public pages
- [x] 2.2 Implement public page-data composition helpers or service methods that assemble blog post + related project data and project + related published posts data

## 3. Public page rendering

- [x] 3.1 Update the public blog post page to render the related project block when relationship data exists
- [x] 3.2 Update the public project page to render the related published posts section when relationship data exists

## 4. Verification and sync

- [x] 4.1 Run targeted tests for the new relationship behavior plus any impacted broader tests
- [x] 4.2 Update `NOW.md` and directly related docs/spec progress notes after implementation and verification
