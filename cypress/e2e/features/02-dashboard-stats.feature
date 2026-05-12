Feature: Dashboard Statistics
  As a user on the dashboard
  I want to see accurate summary statistics
  So that I can quickly gauge the overall maturity level

  # Seed: 60 questions all scored 3, targetScore 4 → Overall=3.00, Target=4.00
  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Overall Score card shows the correct calculated average
    Then the overall score stat should show "3.00"

  Scenario: Target Score card shows the correct calculated target average
    Then the target score stat should show "4.00"

  Scenario: Disciplines stat card shows the correct discipline count
    Then the discipline count stat should show "8"

  Scenario: Total Questions stat card shows the correct question count
    Then the question count stat should show "60"

  Scenario: Overall Score maturity label reads Consistent for score 3
    Then the element ".stat-card-primary" should contain text "Consistent"

  Scenario: Target Score maturity label reads Managed for target 4
    Then the element ".stat-card-success" should contain text "Managed"

  Scenario: Changing a score to 5 increases the overall average
    When the user clicks the score chip "5" on the first question row
    Then the overall score stat should be greater than "3.00"

  Scenario: Changing a score to 1 decreases the overall average
    When the user clicks the score chip "1" on the first question row
    Then the overall score stat should be less than "3.00"

  Scenario: Active Assessment heading displays the seeded snapshot label
    Then the element ".card-summary h2" should contain text "Sprint Review 1"
