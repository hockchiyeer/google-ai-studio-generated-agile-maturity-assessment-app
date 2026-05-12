Feature: Question Filter
  As a user reviewing assessment questions
  I want to filter questions by discipline
  So that I can focus on one area at a time

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Filter dropdown contains "All Disciplines" option
    Then the filter dropdown should contain "All Disciplines"

  Scenario: Filter dropdown contains all 8 discipline names
    Then the filter dropdown should contain "Agility"
    And the filter dropdown should contain "Overall Process"
    And the filter dropdown should contain "Requirements"
    And the filter dropdown should contain "Architecture and Design"
    And the filter dropdown should contain "Implementation"
    And the filter dropdown should contain "Test"
    And the filter dropdown should contain "Operations and Support"
    And the filter dropdown should contain "Build Management"

  Scenario: Selecting a discipline filters the question table
    When the user selects "Agility" in the filter dropdown
    Then every visible question row should belong to discipline "Agility"

  Scenario: Filtered count in section header reflects the selected discipline
    When the user selects "Test" in the filter dropdown
    Then the section header should show "8 of 60 questions"

  Scenario: Selecting All Disciplines shows all questions
    When the user selects "Agility" in the filter dropdown
    And the user selects "All Disciplines" in the filter dropdown
    Then the question count stat should show "60"
    And the section header should show "60 of 60 questions"
