@CoreMetadataTests
Feature : GetCoremetadata 

    @JsonFormat
    Scenario : Get data in JSON format with valid_id
    Given I have permission to the coremetadata
    When I give valid object_id
    And I give valid JSON file format
    And I pass valid access token
    Then The data in valid file format is downloaded

    @BibtexFormat
    Scenario : Get data in Bibtex format with valid_id
    Given I have permission to the coremetadata
    When I give valid object_id
    And I give valid Bibtex file format
    And I pass valid access token
    Then The data in valid file format is downloaded

    @JSON_LDformat
    Scenario : Get data in JSON-LD format with valid_id
    Given I have permission to the coremetadata
    When I give valid object_id
    And I give valid JSON-LD file format
    And I pass valid access token
    Then The data in valid file format is downloaded

    @withInvalidObjectId
    Scenario : Get data in JSON format with invalid object_id
    Given I have permission to the coremetadata
    When I give invalid object_id
    And I give valid JSON file format to be downloaded
    And I pass valid access token
    Then I see an error as output

    @noPermission
    Scenario : no permission to coremetadata
    Given I do no have permission to the coremetadata
    When I give valid object_id
    And I give valid JSON file format to be downloaded
    And I pass invalid access token
    Then I see an authorization error as output


