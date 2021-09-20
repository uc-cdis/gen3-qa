# dataguids.org test plan

## Overview
[Dataguid.org](https://github.com/uc-cdis/indexd/blob/master/dataguid.org) is a centralized resolver, which will resolve the GUID into JSON through the server registered under the prefix of the GUID.


## Technical Document

[Data GUID 1.1 Design Proposal](https://docs.google.com/document/d/1a3uyq0nz9q538GKtIWUqJSz21kvjdJidNdmuR71_amA/edit#heading=h.wuc075sngqhe)

[KF, DRS and prefixes](https://docs.google.com/document/d/1F2_yxgdTorSIX82oW2aFwSCpMn9-ZGDCxSkfOGrPWLo/edit?usp=sharing)

[Indexd README.md](https://github.com/uc-cdis/indexd/blob/master/README.md)


## Workflow

1. User goes to the page and input the GUID
2. User click on`resolve` button
3. It should show the information user can use

## Tests Scenarios

1. Test distributed indexd functionality by getting records in linked Data Commons - test GUID with different prefixes.

    To do that, manually or automatically get GUID from each host which is listed in [DIST config](https://github.com/uc-cdis/cdis-manifest/blob/master/dataguids.org/manifest.json#L33). (Note: this might not test the prefixes since the first GUID you find will not necessarily contain a prefix. it will only test the resolution.)

2. Test GUID without prefixes
3. Test DRS endpoints - check DRS endpoints by given any random GUID such as https://dataguids.org/ga4gh/drs/v1/objects/dg.4503/00e6cfa9-a183-42f6-bb44-b70347106bbe
4. Test bundles - Test GUID which has bundle form (Note: none of the production commons use bundles right now. If we want to check it, we could go to /bundle for each Commons, and if there are existing bundles, try to resolve a random one with http://dataguids.org/ )
5. Negative test - When user input invalid GUID, the expected output is “Data GUID &lt;user input> not found.”
