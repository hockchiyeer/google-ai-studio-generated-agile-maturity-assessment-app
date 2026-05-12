Feature: Add Question
  As a user managing assessment questions
  I want to add new questions to the assessment
  So that the assessment reflects our specific context

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Clicking Add Question opens the modal
    When the user opens the "add-question" modal
    Then the modal title should be "Add New Question"

  Scenario: Add Question modal contains a Discipline dropdown
    When the user opens the "add-question" modal
    Then the add-question form should have a discipline select

  Scenario: Add Question modal contains a Principle input
    When the user opens the "add-question" modal
    Then the add-question form should have a principle input

  Scenario: Add Question modal contains a Question textarea
    When the user opens the "add-question" modal
    Then the add-question form should have a question textarea

  Scenario: Submitting the form with all fields creates the question
    When the user opens the "add-question" modal
    And the user fills in the principle with "My Test Principle"
    And the user fills in the question text with "Does the team follow this practice consistently?"
    And the user submits the add-question form
    Then the modal should be closed
    And the question table should contain "My Test Principle"

  Scenario: New question appears in the questions table
    When the user opens the "add-question" modal
    And the user fills in the principle with "Unique Principle XYZ"
    And the user fills in the question text with "Is this unique question visible in the table?"
    And the user submits the add-question form
    Then the question table should contain "Unique Principle XYZ"

  Scenario: Total question count increments after adding a question
    Given the question count stat shows "60"
    When the user opens the "add-question" modal
    And the user fills in the principle with "Extra Question"
    And the user fills in the question text with "An additional assessment question."
    And the user submits the add-question form
    Then the question count stat should show "61"

  Scenario: Submitting with an empty principle does not create a question
    When the user opens the "add-question" modal
    And the user fills in the question text with "Question without principle"
    And the user submits the add-question form
    Then the modal should still be open

  Scenario: Discipline dropdown is pre-populated with existing disciplines
    When the user opens the "add-question" modal
    Then the add-question discipline select should contain "Agility"
    And the add-question discipline select should contain "Test"
