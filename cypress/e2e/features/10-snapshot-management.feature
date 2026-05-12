Feature: Snapshot Management
  As a user tracking maturity over time
  I want to manage assessment snapshots
  So that I can compare progress across different dates

  Background:
    Given the app is seeded with "seed-data-minimal" and visited

  Scenario: Opening Manage Timeline modal shows the Assessment Timeline title
    When the user opens the "snapshot-manager" modal
    Then the modal title should be "Assessment Timeline"

  Scenario: Snapshot history shows the seeded snapshot
    When the user opens the "snapshot-manager" modal
    Then the snapshot list should contain "Sprint Review 1"

  Scenario: Snapshot history section label shows History
    When the user opens the "snapshot-manager" modal
    Then the element ".section-label" should contain text "History"

  Scenario: Default mode is Bulk Generate Snapshots
    When the user opens the "snapshot-manager" modal
    Then the element ".panel-title" should contain text "Bulk Generate Snapshots"

  Scenario: Switching to Single mode shows Add New Snapshot heading
    When the user opens the "snapshot-manager" modal
    And the user switches to single snapshot mode
    Then the element ".panel-title" should contain text "Add New Snapshot"

  Scenario: Single mode form has Label and Date fields
    When the user opens the "snapshot-manager" modal
    And the user switches to single snapshot mode
    Then the snapshot form should have a label input
    And the snapshot form should have a date input

  Scenario: Creating a single snapshot adds it to the snapshot list
    When the user opens the "snapshot-manager" modal
    And the user switches to single snapshot mode
    And the user fills the snapshot label with "Q1 Baseline"
    And the user fills the snapshot date with "2026-03-01"
    And the user submits the snapshot form
    Then the snapshot list should contain "Q1 Baseline"

  Scenario: Bulk mode shows Frequency and Count fields
    When the user opens the "snapshot-manager" modal
    Then the snapshot form should have a frequency select
    And the snapshot form should have a count input

  Scenario: Bulk generating 3 snapshots adds 3 entries to the history
    When the user opens the "snapshot-manager" modal
    And the user fills the snapshot label with "Sprint"
    And the user fills the snapshot date with "2026-04-01"
    And the user sets the snapshot count to "3"
    And the user submits the snapshot form
    Then the snapshot list should have "4" snapshots

  Scenario: Selecting a snapshot from history changes the active assessment
    Given the app is seeded with "seed-data-with-snapshots" and visited
    When the user opens the "snapshot-manager" modal
    And the user clicks the first snapshot in the list
    Then the modal should be closed or the active snapshot should change

  Scenario: The delete button does not appear when only one snapshot exists
    When the user opens the "snapshot-manager" modal
    Then the snapshot list should not have a delete button

  Scenario: Deleting a snapshot from a multi-snapshot set shows confirm row
    Given the app is seeded with "seed-data-with-snapshots" and visited
    When the user opens the "snapshot-manager" modal
    And the user clicks delete on the last snapshot
    Then a confirm delete row should appear

  Scenario: Confirming snapshot deletion removes it from the list
    Given the app is seeded with "seed-data-with-snapshots" and visited
    When the user opens the "snapshot-manager" modal
    And the user clicks delete on the last snapshot
    And the user confirms the snapshot deletion
    Then the snapshot list should have "2" snapshots
