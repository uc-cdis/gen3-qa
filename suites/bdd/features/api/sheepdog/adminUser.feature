Feature: Admin user handling of sheepdog api with centralized authentication (arborist)
"""
Sheepdog Admin policy:
- id: 'services.sheepdog-admin'
  description: 'CRUD access to programs and projects'
  role_ids:
    - 'sheepdog_admin'
  resource_paths:
    - '/services/sheepdog/submission/program'
    - '/services/sheepdog/submission/project'

Deprecated policy:
 Admin: True
"""

  @manual
  Scenario: User having Sheepdog Admin policy can create and delete programs and projects regardless of the deprecated policy settings

    Given Sheepdog admin policy is configured for the user @manual
    When deprecated policy Admin: True is set for a user @manual
    Then the user can create a program @manual
    And the user can delete a program @manual
    And the user can create a project @manual
    And the user can create a project @manual
    When deprecated policy Admin: False is set for a user @manual
    Then the user can create a program @manual
    And the user can delete a program @manual
    And the user can create a project @manual
    And the user can create a project @manual

  @manual
  Scenario: User NOT having Sheepdog Admin policy cannot create and delete programs and projects regardless of the deprecated policy settings

    Given Sheepdog admin policy is not configured for the user @manual
    When deprecated policy Admin: True is set for a user @manual
    Then the user cannot create a program @manual
    And the user cannot delete a program @manual
    And the user cannot create a project @manual
    And the user cannot create a project @manual
    When deprecated policy Admin: True is set for a user @manual
    Then the user cannot create a program @manual
    And the user cannot delete a program @manual
    And the user cannot create a project @manual
    And the user cannot create a project @manual