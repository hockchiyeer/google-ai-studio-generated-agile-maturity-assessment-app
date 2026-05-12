Feature: Delete Question
  As a user managing assessment questions
  I want to delete questions I no longer need
  So that the assessment remains focused and relevant

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Clicking Delete on a question row removes it from the active table
    Given the question count stat shows "60"
    When the user deletes the first question in the table
    Then the question count stat should show "59"

  Scenario: Total question count decrements by one after deletion
    When the user deletes the first question in the table
    Then the question count stat should show "59"

  Scenario: The filtered question count in the section header decrements
    When the user deletes the first question in the table
    Then the section header should show "59 of 59 questions"

  Scenario: The deleted question is moved into the recovery bin
    When the user deletes the first question in the table
    And the user opens the "recovery" modal
    Then the recovery modal should contain at least one deleted question card

  Scenario: Deleting a question creates an entry in the audit log
    When the user deletes the first question in the table
    And the user clicks the audit log link
    Then the audit log modal should contain an entry with action "Question"
