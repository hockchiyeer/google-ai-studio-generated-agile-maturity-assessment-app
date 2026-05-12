Feature: Question Scoring
  As a user reviewing assessment questions
  I want to set a maturity score for each question
  So that the dashboard reflects the team's current state

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Each question row renders five score chips labelled 1 through 5
    Then the first question row should have 5 score chips

  Scenario: The seeded score of 3 is shown as active on the first question
    Then the first question row should have score chip "3" active

  Scenario: Clicking score chip 1 marks it as active
    When the user clicks the score chip "1" on the first question row
    Then the first question row should have score chip "1" active

  Scenario: Clicking score chip 5 marks it as active
    When the user clicks the score chip "5" on the first question row
    Then the first question row should have score chip "5" active

  Scenario: Clicking a new chip deactivates the previous active chip
    When the user clicks the score chip "4" on the first question row
    Then the first question row should have score chip "4" active
    And the first question row should not have score chip "3" active

  Scenario: Scoring a question updates the overall average on the dashboard
    Given the overall score stat shows "3.00"
    When the user clicks the score chip "5" on the first question row
    Then the overall score stat should be greater than "3.00"

  Scenario: Score chip title attribute contains the maturity label for score 1
    Then the score chip "1" title on the first row should contain "Adhoc"

  Scenario: Score chip title attribute contains the maturity label for score 5
    Then the score chip "5" title on the first row should contain "Optimizing"
