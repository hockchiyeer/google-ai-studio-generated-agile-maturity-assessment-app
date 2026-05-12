Feature: Timeline Comparison Charts
  As a user analysing maturity trends
  I want to view bar and line chart comparisons across snapshots
  So that I can visualise progress over time

  Background:
    Given the app is seeded with "seed-data-with-snapshots" and visited

  Scenario: Timeline section shows Bar and Line toggle buttons
    Then the element '[data-action="set-comparison-type"][data-type="bar"]' should be visible
    And the element '[data-action="set-comparison-type"][data-type="line"]' should be visible

  Scenario: Bar toggle is active by default
    Then the bar toggle button should be active

  Scenario: Bar chart canvas is visible when Bar is selected
    Then the element "#bar-chart" should be visible

  Scenario: Line chart panel is hidden when Bar is selected
    Then the element ".chart-panel:has(#line-chart)" should have class "is-hidden"

  Scenario: Clicking Line toggle makes it the active button
    When the user clicks the line chart toggle
    Then the line toggle button should be active

  Scenario: Clicking Line toggle shows the line chart canvas
    When the user clicks the line chart toggle
    Then the element "#line-chart" should be visible

  Scenario: Clicking Line toggle hides the bar chart panel
    When the user clicks the line chart toggle
    Then the element ".chart-panel:has(#bar-chart)" should have class "is-hidden"

  Scenario: Clicking Bar toggle after Line restores Bar as active
    When the user clicks the line chart toggle
    And the user clicks the bar chart toggle
    Then the bar toggle button should be active

  Scenario: Timeline section header shows the correct snapshot count
    Then the element ".card__header-split h2" should contain text "3"

  Scenario: Radar chart canvas is present on the dashboard
    Then the element "#radar-chart" should exist in the DOM
