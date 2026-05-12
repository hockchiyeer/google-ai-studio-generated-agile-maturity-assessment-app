Feature: Edit Question
  As a user reviewing assessment questions
  I want to edit the principle and question text inline
  So that I can correct or refine questions without losing scores

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Clicking Edit on the principle cell shows an inline input
    When the user clicks the Edit button for the principle of the first question
    Then the inline principle editor should be visible

  Scenario: Saving a new principle value updates the table cell
    When the user clicks the Edit button for the principle of the first question
    And the user clears and types "Updated Principle Name" into the inline editor
    And the user saves the inline edit
    Then the question table should contain "Updated Principle Name"

  Scenario: Cancelling the principle edit restores the original value
    When the user clicks the Edit button for the principle of the first question
    And the user clears and types "Temporary Value" into the inline editor
    And the user cancels the inline edit
    Then the question table should not contain "Temporary Value"

  Scenario: Clicking Edit on the question text cell shows an inline textarea
    When the user clicks the Edit button for the question of the first question
    Then the inline question textarea editor should be visible

  Scenario: Saving a new question text updates the table cell
    When the user clicks the Edit button for the question of the first question
    And the user clears and types "Updated question text for testing purposes." into the inline textarea
    And the user saves the inline edit
    Then the question table should contain "Updated question text for testing purposes."

  Scenario: Cancelling the question text edit restores the original content
    When the user clicks the Edit button for the question of the first question
    And the user clears and types "Throwaway question text" into the inline textarea
    And the user cancels the inline edit
    Then the question table should not contain "Throwaway question text"

  Scenario: Pressing Escape while editing a cell cancels the edit
    When the user clicks the Edit button for the principle of the first question
    Then the inline principle editor should be visible
    When the user presses Escape
    Then the inline principle editor should not be visible
