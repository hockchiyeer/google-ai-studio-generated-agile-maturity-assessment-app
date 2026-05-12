Feature: Persistence via localStorage
  As a returning user
  I want my assessment data to survive page reloads
  So that I do not lose any work between sessions

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: App stores data in localStorage after loading
    Then the app localStorage key should contain valid JSON

  Scenario: Changing a score is persisted in localStorage
    When the user clicks the score chip "5" on the first question row
    Then the app localStorage data should reflect a score of 5 for question "q-A01"

  Scenario: A score change survives a page reload
    When the user clicks the score chip "5" on the first question row
    And the user reloads the page
    Then the first question row should have score chip "5" active

  Scenario: An added question survives a page reload
    When the user opens the "add-question" modal
    And the user fills in the principle with "Persistent Principle"
    And the user fills in the question text with "Does this question survive a reload?"
    And the user submits the add-question form
    And the user reloads the page
    Then the question table should contain "Persistent Principle"

  Scenario: A new discipline survives a page reload
    When the user opens the "manage-disciplines" modal
    And the user types "Persistent Discipline" into the add discipline input
    And the user submits the add discipline form
    And the user closes the modal
    And the user reloads the page
    Then the filter dropdown should contain "Persistent Discipline"

  Scenario: App with no localStorage initialises cleanly on reload
    Given the app is visited with no saved data
    Then the element ".app-shell" should be visible
    And the app localStorage key should contain valid JSON
