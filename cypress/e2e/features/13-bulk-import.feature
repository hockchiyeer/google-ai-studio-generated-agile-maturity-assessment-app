Feature: Bulk Import Questions
  As a user wanting to populate questions quickly
  I want to paste or import questions in bulk
  So that I do not have to add them one by one

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Bulk Actions modal contains the import textarea
    When the user opens the "bulk-actions" modal
    Then the bulk import textarea should be visible

  Scenario: Bulk Actions modal contains the default discipline select
    When the user opens the "bulk-actions" modal
    Then the bulk import discipline select should be visible

  Scenario: Importing one plain-text question adds it to the table
    Given the question count stat shows "60"
    When the user opens the "bulk-actions" modal
    And the user imports the question text "A plain text imported question."
    Then the question count stat should show "61"

  Scenario: Imported question appears in the active table
    When the user opens the "bulk-actions" modal
    And the user imports the question text "Visible Imported Question Text."
    Then the question table should contain "Visible Imported Question Text"

  Scenario: Importing a pipe-delimited question assigns the correct discipline
    When the user opens the "bulk-actions" modal
    And the user imports the question text "Test | Independent test cases | Are all test cases independent from each other?"
    Then the question table should contain "Are all test cases independent from each other?"

  Scenario: Importing multiple questions increases the count correctly
    Given the question count stat shows "60"
    When the user opens the "bulk-actions" modal
    And the user imports the question text "First bulk question.\nSecond bulk question.\nThird bulk question."
    Then the question count stat should show "63"

  Scenario: Submitting with empty import text does not close the modal
    When the user opens the "bulk-actions" modal
    And the user submits the bulk import form with empty text
    Then the modal should still be open

  Scenario: Export Questions button is present in Bulk Actions modal
    When the user opens the "bulk-actions" modal
    Then the element '[data-action="export-questions"]' should be visible
