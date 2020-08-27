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

1. User goes to the page and selects the needed dataset for research
2. If the user has access, Click on Download button and the file gets downloaded from indexd
3. if the user has no access, Click on `Request Access` button and the receive `request_id` from the `Request Access Queue`
4. User makes a manual call to validate the `request_id` with the Requestor
5. If successful validation, user goes back to the study-viewer page and clicks `Download` button and the file get downloaded from indexd
6. User can click on `Learn More` button allows the user to see more details about the dataset

## Tests Scenarios

1. User with no access - <br>
a. go to page, click on `Request Access` button to request access, recives `request_id` from the Request Access Queue <br>
b. makes a manual call to validate the `request_id` with the Requestor <br>
c. go back to the back, click on `Download` button to download the dataset <br>

2. User with access - go to page, click on `Download` button and download the file from indexd
 
3. `Learn More` button navigates the user to `one row` page which displays the requested dataset
