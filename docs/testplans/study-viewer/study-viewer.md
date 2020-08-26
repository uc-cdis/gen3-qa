# Study Viewer

## Overview
Dataset Browser allows the user visiting the commons to discover if the dataset they need is available on the commons. The user doesn't need to have full access to look for the dataset they are interested in. Users can request access to data they don't have access to.

It enables to the user to check :
1. if Gen3 has the data they need
2. if the data is sufficient enough for research 

## Technical Document
[Dataset browser/ Study Viewer](https://docs.google.com/document/d/1BLbLX4GEViJfcWFNDNN723KmC2XMHH-SWFMM_cPg6wk/)

[Access Request Queue](https://docs.google.com/document/d/1h5ZLYXb_wi2a2H3sfXrRcY41KQ0SjQF3DBtdpt2oLxE/)

## Workflow

1. The users visits the commons 
2. Navigate to the Dataset Browser/ Study Viewer Tab on the navigation bar
3. The users searches for the dataset that they need and anc clicks 'Show Details'
4. if they have access, 'Download' button is displayed
5. if they do not have access, 'Request Access' button is displayed
6. Click on download button, if file -> file is downloaded, if program/project/study -> JSON manifest is downloaded

## Tests
 
1. Navigate to the Study Viewer Tab, if user has access, User should see 'Download' button
2. User should be able to download file as file or program/project/study as JSON manifest
3. If user doesn't have access, the user should see 'Request Access' button though which the user can request access
4. After receiving access to download, the user should see 'Download' button on the dataset
 
