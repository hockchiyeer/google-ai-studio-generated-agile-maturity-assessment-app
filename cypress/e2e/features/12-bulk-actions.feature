Feature: Bulk Actions - Clear All Questions
  As a user wanting to reset the question set
  I want to clear all active questions at once
  So that I can start fresh with a new question import

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Opening Bulk Actions modal shows the Danger Zone section
    When the user opens the "bulk-actions" modal
    Then the modal should contain "Danger Zone"

  Scenario: Bulk Actions modal contains the Clear All Questions button
    When the user opens the "bulk-actions" modal
    Then the element '[data-action="prompt-clear-all"]' should be visible

  Scenario: Clicking Clear All Questions shows confirm and cancel buttons
    When the user opens the "bulk-actions" modal
    And the user clicks the Clear All Questions button
    Then the element '[data-action="confirm-clear-all"]' should be visible
    And the element '[data-action="cancel-clear-all"]' should be visible

  Scenario: Cancelling Clear All retains all questions
    Given the question count stat shows "60"
    When the user opens the "bulk-actions" modal
    And the user clicks the Clear All Questions button
    And the user cancels the clear all
    And the user closes the modal
    Then the question count stat should show "60"

  Scenario: Confirming Clear All empties the active question table
    When the user opens the "bulk-actions" modal
    And the user clicks the Clear All Questions button
    And the user confirms the clear all
    And the user closes the modal
    Then the question count stat should show "0"

  Scenario: After Clear All the table shows the empty state message
    When the user opens the "bulk-actions" modal
    And the user clicks the Clear All Questions button
    And the user confirms the clear all
    And the user closes the modal
    Then the element ".empty-state" should be visible

  Scenario: Cleared questions appear in the recovery bin
    When the user opens the "bulk-actions" modal
    And the user clicks the Clear All Questions button
    And the user confirms the clear all
    And the user closes the modal
    And the user opens the "recovery" modal
    Then the recovery modal should contain at least one deleted question card
