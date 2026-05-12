Feature: Modal Behavior
  As a user interacting with modals
  I want consistent open and close behavior
  So that the interface feels predictable and accessible

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Opening a modal renders the modal overlay
    When the user opens the "add-question" modal
    Then the element ".modal-backdrop" should be visible
    And the element ".modal" should be visible

  Scenario: Clicking the Close button dismisses the modal
    When the user opens the "add-question" modal
    And the user closes the modal via the Close button
    Then the element ".modal" should not exist in the DOM

  Scenario: Pressing Escape dismisses an open modal
    When the user opens the "add-question" modal
    And the user presses Escape
    Then the element ".modal" should not exist in the DOM

  Scenario: Clicking inside the modal content does not close it
    When the user opens the "add-question" modal
    And the user clicks inside the modal body
    Then the element ".modal" should be visible

  Scenario: Only one modal is open at any time
    When the user opens the "add-question" modal
    Then exactly one ".modal" element should exist

  Scenario: Escape with no modal and an active inline edit cancels the edit
    When the user clicks the Edit button for the principle of the first question
    Then the inline principle editor should be visible
    When the user presses Escape
    Then the inline principle editor should not be visible

  Scenario: Closing the recovery modal via Escape works correctly
    When the user opens the "recovery" modal
    And the user presses Escape
    Then the element ".modal" should not exist in the DOM

  Scenario: Closing the snapshot modal via the Close button works correctly
    When the user opens the "snapshot-manager" modal
    And the user closes the modal via the Close button
    Then the element ".modal" should not exist in the DOM
