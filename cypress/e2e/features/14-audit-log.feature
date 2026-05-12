Feature: Audit Log
  As a user who needs traceability
  I want to view an audit trail of all changes
  So that I can understand what happened and when

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Clicking the Audit Log link opens the Audit Trail modal
    When the user clicks the audit log link
    Then the modal title should be "Audit Trail"

  Scenario: Audit log contains the seeded System initialization entry
    When the user clicks the audit log link
    Then the audit log modal should contain an entry with action "System"

  Scenario: Each audit entry shows an action badge
    When the user clicks the audit log link
    Then every audit entry should have a meta badge

  Scenario: Each audit entry shows a timestamp
    When the user clicks the audit log link
    Then every audit entry should have a meta time element

  Scenario: Adding a question creates a Question audit entry
    When the user opens the "add-question" modal
    And the user fills in the principle with "Auditable Principle"
    And the user fills in the question text with "Auditable question text."
    And the user submits the add-question form
    And the user clicks the audit log link
    Then the audit log modal should contain an entry with action "Question"

  Scenario: Deleting a question creates a Question audit entry
    When the user deletes the first question in the table
    And the user clicks the audit log link
    Then the audit log modal should contain an entry with action "Question"

  Scenario: Adding a discipline creates a Discipline audit entry
    When the user opens the "manage-disciplines" modal
    And the user types "Audit Discipline" into the add discipline input
    And the user submits the add discipline form
    And the user closes the modal
    And the user clicks the audit log link
    Then the audit log modal should contain an entry with action "Discipline"

  Scenario: Adding a snapshot creates a Snapshot audit entry
    When the user opens the "snapshot-manager" modal
    And the user switches to single snapshot mode
    And the user fills the snapshot label with "Audit Snapshot"
    And the user fills the snapshot date with "2026-06-01"
    And the user submits the snapshot form
    And the user closes the modal
    And the user clicks the audit log link
    Then the audit log modal should contain an entry with action "Snapshot"

  Scenario: Footer shows the last modified timestamp
    Then the element ".footer-bar" should contain text "Last modified"
