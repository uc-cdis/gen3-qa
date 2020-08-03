Feature: Submission UI from different pages of the application
"""
Sheepdog Admin policy:
- id: 'services.sheepdog-admin'
  description: 'CRUD access to programs and projects'
  role_ids:
    - 'sheepdog_admin'
  resource_paths:
    - '/services/sheepdog/submission/program'
    - '/services/sheepdog/submission/project'
"""

  @manual
  Scenario: Submission UI is visible from program page when user has sheepdog admin policy configured
    Given user has sheepdog admin policy configured @manual
    When the user navigates to program page @manual
    # e.g. https://qa-brain.planx-pla.net/DEV
    Then the user can see the button to Upload File and toggle to Use Form Submission @manual

  @manual
  Scenario: Submission UI is visible from project page when user has sheepdog admin policy configured
    Given user has sheepdog admin policy configured @manual
    When the user navigates to project page @manual
    # e.g. https://qa-brain.planx-pla.net/DEV-test
    Then the user can see the button to Upload File and toggle to Use Form Submission @manual