Feature: Discipline Management
  As a user managing the assessment structure
  I want to add, rename and delete disciplines
  So that the assessment reflects the project's actual areas

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Opening Manage Disciplines modal lists all disciplines
    When the user opens the "manage-disciplines" modal
    Then the modal title should be "Manage Disciplines"
    And the discipline list should show "8" disciplines

  Scenario: Adding a new discipline appends it to the list
    When the user opens the "manage-disciplines" modal
    And the user types "DevSecOps" into the add discipline input
    And the user submits the add discipline form
    Then the discipline list should contain "DevSecOps"

  Scenario: New discipline appears in the filter dropdown
    When the user opens the "manage-disciplines" modal
    And the user types "Platform Engineering" into the add discipline input
    And the user submits the add discipline form
    And the user closes the modal
    Then the filter dropdown should contain "Platform Engineering"

  Scenario: Adding a discipline with an empty name is rejected
    When the user opens the "manage-disciplines" modal
    And the user submits the add discipline form without a name
    Then the discipline list should show "8" disciplines

  Scenario: Renaming a discipline updates the name in the modal
    When the user opens the "manage-disciplines" modal
    And the user clicks Rename on the first discipline
    And the user types "Agility Renamed" into the rename input
    And the user saves the rename
    Then the discipline list should contain "Agility Renamed"

  Scenario: Renamed discipline name appears in the filter dropdown
    When the user opens the "manage-disciplines" modal
    And the user clicks Rename on the first discipline
    And the user types "Agility Updated" into the rename input
    And the user saves the rename
    And the user closes the modal
    Then the filter dropdown should contain "Agility Updated"

  Scenario: Deleting a discipline removes it from the list
    When the user opens the "manage-disciplines" modal
    And the user deletes the last discipline in the list
    Then the discipline list should show "7" disciplines

  Scenario: Deleting a discipline removes it from the filter dropdown
    When the user opens the "manage-disciplines" modal
    And the user deletes the last discipline in the list
    And the user closes the modal
    Then the filter dropdown should not contain "Build Management"
