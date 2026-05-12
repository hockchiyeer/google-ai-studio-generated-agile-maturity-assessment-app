Feature: Recovery Bin
  As a user who accidentally deleted questions
  I want to recover them from the recovery bin
  So that assessment history is not permanently lost

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Recovery modal with no deleted questions shows empty state message
    When the user opens the "recovery" modal
    Then the modal should contain "No deleted questions found"

  Scenario: After deleting a question the recovery bin shows one card
    When the user deletes the first question in the table
    And the user opens the "recovery" modal
    Then the recovery modal should contain at least one deleted question card

  Scenario: Recovering a question restores it to the active table
    Given the question count stat shows "60"
    When the user deletes the first question in the table
    Then the question count stat should show "59"
    When the user opens the "recovery" modal
    And the user clicks Recover on the first deleted question card
    Then the question count stat should show "60"

  Scenario: Recover button closes the recovery modal automatically
    When the user deletes the first question in the table
    And the question count stat should show "59"
    And the user opens the "recovery" modal
    And the user clicks Recover on the first deleted question card
    Then the modal should still be open
    And the question count stat should show "60"

  Scenario: Clear Bin button appears when deleted questions exist
    When the user deletes the first question in the table
    And the user opens the "recovery" modal
    Then the element '[data-action="prompt-clear-bin"]' should be visible

  Scenario: Clicking Clear Bin shows the confirm and cancel buttons
    When the user deletes the first question in the table
    And the user opens the "recovery" modal
    And the user clicks the Clear Bin button
    Then the element '[data-action="confirm-clear-bin"]' should be visible
    And the element '[data-action="cancel-clear-bin"]' should be visible

  Scenario: Cancelling Clear Bin keeps the deleted questions in the bin
    When the user deletes the first question in the table
    And the user opens the "recovery" modal
    And the user clicks the Clear Bin button
    And the user cancels the clear bin
    Then the recovery modal should contain at least one deleted question card

  Scenario: Confirming Clear Bin permanently removes all deleted questions
    When the user deletes the first question in the table
    And the user opens the "recovery" modal
    And the user clicks the Clear Bin button
    And the user confirms the clear bin
    Then the modal should contain "No deleted questions found"
