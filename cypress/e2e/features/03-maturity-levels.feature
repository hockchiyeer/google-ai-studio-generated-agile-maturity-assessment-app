Feature: Maturity Levels Legend
  As a user on the dashboard
  I want to see the CMMI-based maturity level legend
  So that I understand what each score value means

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Legend grid is rendered
    Then the element ".legend-grid" should be visible

  Scenario: Legend renders exactly 5 maturity levels
    Then the legend should contain exactly 5 cards

  Scenario: Level 1 is labelled Adhoc
    Then the legend card at position 1 should contain text "Adhoc"

  Scenario: Level 2 is labelled Defined
    Then the legend card at position 2 should contain text "Defined"

  Scenario: Level 3 is labelled Consistent
    Then the legend card at position 3 should contain text "Consistent"

  Scenario: Level 4 is labelled Managed
    Then the legend card at position 4 should contain text "Managed"

  Scenario: Level 5 is labelled Optimizing
    Then the legend card at position 5 should contain text "Optimizing"

  Scenario: Each legend card displays its score number
    Then the legend should contain text "1"
    And the legend should contain text "2"
    And the legend should contain text "3"
    And the legend should contain text "4"
    And the legend should contain text "5"
