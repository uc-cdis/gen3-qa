Feature: Tiered access implementation for Data Exploration page
  In order to ensure that data access is secured
  As an authenticated user
  I should be able to explore data only I am authorized to within the tier access limits

  @manual
  Scenario: User with access to a project can explore both summary and raw data
    Given the user is logged in @manual
    And the user navigates to the Exploration page @manual
    When the user selects an accessible project with data size below tier_access_limit @manual
    Then the user can see the charts and table data @manual
    When the user selects an authorized project with data size above tier_access_limit @manual
    Then the user can see the charts and table data @manual

  @manual
  Scenario: User without access to a project can explore summary data according to tier access limit
    Given the user is logged in @manual
    And the user navigates to the Exploration page @manual
    When the user selects an inaccessible project with data size below tier_access_limit @manual
    Then the user cannot see the charts and table data @manual
    When the user selects an authorized project with data size above tier_access_limit @manual
    Then the user can see the charts but not the table data @manual

  @manual
  Scenario: User with partial access to projects selected can explore summary data according to tier access limit
    Given the user is logged in @manual
    And the user navigates to the Exploration page @manual
    When the user selects an accessible project @manual
    And the user selects an inaccessible project with data size below tier_access_limit @manual
    Then the user cannot see the charts and table data @manual
    When the user selects an accessible project @manual
    And the user selects an inaccessible project with data size above the tier access limit @manual
    Then the user can see the charts but not the table data @manual