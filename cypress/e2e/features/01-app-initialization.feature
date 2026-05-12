Feature: App Initialization
  As a user opening the Agile Maturity Assessment app
  I want the application shell to render correctly
  So that I can immediately start assessing maturity

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Application shell is rendered
    Then the element ".app-shell" should be visible

  Scenario: Brand mark shows initials AM
    Then the element ".brand__mark" should contain text "AM"

  Scenario: Brand heading shows Agile Maturity
    Then the element ".brand h1" should contain text "Agile Maturity"

  Scenario: Page title is Agile Maturity Assessment
    Then the page title should be "Agile Maturity Assessment"

  Scenario: Toolbar renders Open JSON button
    Then the button with action "open-json" should be visible

  Scenario: Toolbar renders Link JSON button
    Then the button with action "link-json" should be visible

  Scenario: Toolbar renders PDF export button
    Then the button with action "export-pdf" should exist in the DOM

  Scenario: Toolbar renders PPTX export button
    Then the button with action "export-pptx" should exist in the DOM

  Scenario: Toolbar renders Excel export button
    Then the button with action "export-xlsx" should exist in the DOM

  Scenario: Footer renders Download JSON button
    Then the button with action "download-json" should be visible

  Scenario: Footer shows Last modified label
    Then the element ".footer-bar" should contain text "Last modified"

  Scenario: App loads scores from seeded localStorage data
    Then the overall score stat should show "3.00"

  Scenario: App with no saved data initialises with default template data
    Given the app is visited with no saved data
    Then the element ".app-shell" should be visible
    And the element ".data-table tbody tr" should exist in the DOM

  Scenario: Active Assessment section heading is visible
    Then the element ".eyebrow" should contain text "Active Assessment"

  Scenario: Assessment Questions section heading is visible
    Then the element ".data-table" should be visible
