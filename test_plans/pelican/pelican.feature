Feature : Pelican-Export

@wholeDatabase
Scenario : Exporting whole database
    Given I have access permission to data commons
    When I click 'Export to PFB' on Exploration Page
    Then I get a pre-assigned URL after the export is complete

@someOfTheDatabase
Scenario : Exporting some of the database   
    Given I have access permission to data commons
    When I click on various facet filters on Exploration Page
    And I click on 'Export to PFB' button
    Then The case table on exploration page changes according to the filters
    And I get a pre-assigned URL after the export is complete

@noPermission
Scenario : Export with no permission
    Given I have no access permission to data commons
    When I login to the data commons
    And I click on Exploration table
    Then I see all the buttons are disabled 