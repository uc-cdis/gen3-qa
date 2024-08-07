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
4. With `request_id`, the request is send update the status of the request to requestor service
5. If successful validation, user goes back to the study-viewer page and clicks `Download` button and the file get downloaded from indexd
6. User can click on `Learn More` button allows the user to see more details about the dataset

## Users 

1. Requestor Admin - cdis.autotest@gmail.com (mainAcct) which helps to update the request status in requestor
2. User 1 (without access) - dcf-integration-test-0@planx-pla.net (user0)
3. User 2 (has access and can download dataset) - dummy-one@planx-pla.net (auxAcct1)

## Tests Scenarios

1. User with no access - <br>
1.1. User0 user does not login and requests the access <br>
  a. go to study page, sees `Login to Request Access` button, clicks the button <br>
  b. redirected to the `Login Page`. The user logs in with valid credentials  <br>
  c. goes back to the study page, sees `Request Access` button to request access for the dataset <br>
1.2. User0 user logs in and request access <br>
  a. logs in and goes to the study page, clicks on `Request Access` button <br>
  b. the user receives `request_id` <br>
  c. using `request_id` received, request to requestor service is send to update the status of the request to `APPROVED` <br>
  d. user refreshes the study page and sees button disabled with message `DAR In Progress` <br>
  e. with the same `request_id`, another request to requestor service is send to update the status of the request to `SIGNED` <br>
  f. user refreshes the study page and sees `Download` button displayed where the user can now download the study

2. auxAcct1 user with access - user logs in and goes to study page, click on `Download` button and download the file from indexd
 
3. `Learn More` button navigates the user to `one row` page which displays the requested dataset

4. testing multiple datasets - user0 user logs in and goes to study viewer page, the user would see multiple dataset. <br>
   navigate through different datasets on the study viewer page
   
5. Test functionality in a Data Commons with multiple configured Study Viewers (not implemented)
