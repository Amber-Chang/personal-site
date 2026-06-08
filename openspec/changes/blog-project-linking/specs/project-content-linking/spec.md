## ADDED Requirements

### Requirement: Published blog posts expose their related project context
The system SHALL show related project context on a published blog post page when that post is linked to a project that can be resolved for public display.

#### Scenario: Blog post page shows related project block
- **WHEN** a published blog post has a valid `related_project_id` that resolves to a project
- **THEN** the public blog post page shows that project's title, summary context, and a link to the project page

#### Scenario: Blog post page safely omits missing related project
- **WHEN** a published blog post has no related project or the referenced project cannot be resolved for public display
- **THEN** the public blog post page omits the related project block without failing the page render

### Requirement: Published project pages expose related published posts
The system SHALL show published blog posts related to a project on that project's public page.

#### Scenario: Project page lists related published posts
- **WHEN** a public project page is requested for a project that has one or more published blog posts pointing to it
- **THEN** the page shows a related-posts section containing those published posts with links and summary metadata

#### Scenario: Project page excludes draft related posts
- **WHEN** a project has related blog posts that are not published
- **THEN** those unpublished posts are excluded from the public related-posts section

#### Scenario: Project page omits empty related-posts section
- **WHEN** a project has no related published posts
- **THEN** the public project page omits the related-posts section without failing the page render

### Requirement: Relationship reads go through content-layer boundaries
The system SHALL assemble blog/project relationship data through content-layer queries and services rather than page-level provider-specific access.

#### Scenario: Blog page relationship data uses content-layer composition
- **WHEN** the public blog post page needs related project information
- **THEN** it obtains already-composed relationship data through content-layer helpers instead of inline provider-specific queries in the page component

#### Scenario: Project page relationship data uses content-layer composition
- **WHEN** the public project page needs related published posts
- **THEN** it obtains already-composed relationship data through content-layer helpers instead of inline provider-specific queries in the page component
