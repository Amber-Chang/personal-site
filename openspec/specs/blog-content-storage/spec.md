# Purpose

Define the database-backed content boundary that supports blog admin writes and public reads without direct page-level provider access.

## Requirements

### Requirement: Blog admin data is stored in database-backed content models
The system SHALL provide database-backed content models for `projects` and `blog_posts` so blog admin can operate without relying on direct Markdown file edits.

#### Scenario: Blog post schema supports draft and published states
- **WHEN** the system stores a blog post
- **THEN** the stored record includes identity, content, status, publish metadata, and optional related project reference

#### Scenario: Project schema can support blog relationship
- **WHEN** the system stores a project for blog relationship use
- **THEN** the stored record includes the fields required to identify and relate it to blog posts

### Requirement: Content access goes through repository boundaries
The system SHALL expose blog content read and write operations through repository interfaces rather than page-level provider calls.

#### Scenario: Published blog reads use repository access
- **WHEN** app code needs published blog content
- **THEN** it reads through a repository method that encapsulates provider-specific queries

#### Scenario: Admin blog writes use repository access
- **WHEN** admin code creates or updates blog post data
- **THEN** it writes through repository methods rather than directly calling provider-specific queries from pages or components

### Requirement: Content business rules live in service layer
The system SHALL centralize content rules such as publish-state handling and access decisions in service-layer logic.

#### Scenario: Publishing a draft sets publish state correctly
- **WHEN** admin logic publishes a draft blog post
- **THEN** the service layer updates the record so it is treated as published by downstream reads

#### Scenario: Public reads exclude unpublished content
- **WHEN** public-facing app code requests blog content
- **THEN** the service layer and repository combination returns only content allowed for public visibility
