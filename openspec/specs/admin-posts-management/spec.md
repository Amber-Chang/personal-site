# Purpose

Define the current minimum admin post management capability for creating, listing, and editing blog posts through the authenticated admin interface.

## Requirements

### Requirement: Admin can list blog posts
The system SHALL provide an authenticated admin posts page that lists blog post records through the admin content path.

#### Scenario: Authenticated admin opens posts list
- **WHEN** an allowed admin user opens `/admin/posts`
- **THEN** the system shows a list of blog post records with enough metadata to identify and edit each post

#### Scenario: Unauthenticated user opens posts list
- **WHEN** a non-admin or unauthenticated user opens `/admin/posts`
- **THEN** the system redirects the user to the admin login flow instead of exposing admin content

### Requirement: Admin can start a new post from the app
The system SHALL provide a minimal admin create flow for blog posts.

#### Scenario: Admin opens new post page
- **WHEN** an allowed admin user opens `/admin/posts/new`
- **THEN** the system shows a post form with the fields required by the current admin skeleton scope

#### Scenario: Admin submits a valid new post
- **WHEN** an allowed admin user submits a valid post creation form
- **THEN** the system creates the post through the admin content path and makes the created record available for later editing

### Requirement: Admin can edit an existing post from the app
The system SHALL provide a minimal admin edit flow for existing blog posts.

#### Scenario: Admin opens existing post page
- **WHEN** an allowed admin user opens `/admin/posts/[id]`
- **THEN** the system loads the existing post and shows the current field values in the edit form

#### Scenario: Admin submits changes to an existing post
- **WHEN** an allowed admin user submits valid changes for an existing post
- **THEN** the system updates the post through the admin content path and preserves the current record identity
