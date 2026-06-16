## MODIFIED Requirements

### Requirement: Admin login failures remain controlled and non-revealing
The system SHALL return controlled admin login errors without exposing sensitive configuration, provider internals, or authorization details.

#### Scenario: Invalid callback returns controlled login error
- **WHEN** the admin auth callback is missing required credentials or session exchange fails
- **THEN** the system redirects the user to a controlled admin login error state without exposing provider secrets or raw internal error details

#### Scenario: Unauthorized account returns controlled access denial
- **WHEN** an authenticated Google account is not present in the admin allowlist
- **THEN** the system returns the user to the admin login flow with a controlled unauthorized error state instead of exposing internal authorization details
