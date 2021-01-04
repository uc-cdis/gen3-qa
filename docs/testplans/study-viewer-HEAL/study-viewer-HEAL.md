# HEAL PROJECT Study Viewer: Tiered Access Support

## Overview
The Study Viewer should be able to display both open-access and controlled-access study level metadata. The user can 
view the metadata depending on the user authorization.

## Technical Document
[Study Viewer : Tiered Access Support](https://docs.google.com/document/d/1F9ytUu-jedmtIj9SRRq4BtJdTfuklAqbsKHctI9UwNQ/edit#)

## Use-Cases
1. Researcher without prior access to studies,

    a. can navigate through all the studies and view their study level metadata, can request access if needed.
    
    b. can view all open-access study-level metadata.
    
2. Researcher with access to subset of studies,
    
    a. can navigate through all the studies and view their study level metadata, request additional access or launch a 
    workspace.
    
    b. can view a subset of study-level metadata which the authorized user (researcher) has access to.
    
3. As a developer,

    a. able to dictate which displayed properties are controlled-access and which are open-access so that authorized/non-authorized 
    users have information based on their access.
    
    b. open-access properties are visible to all the users on study-viewer. controlled-access properties will be displayed 
    on the data exploration page.
    
    c. controlled-access properties can or cannot be common across all the studies. The "core" set of open access properties
    are similar for all the studies. 

## User Flow

1. Researcher/Developer visits HEAL platform.
2. Logs in Google user account.
3. User goes to Study-Viewer page and navigate through all the datasets available datasets in the commons.
4. Then user selects the necessary dataset for the research looking at the properties.
5. User clicks on `Learn More` button which displays additional study-level metadata properties.
6. User clicks `Request Access` and the page is redirected DCC landing page to complete DAR.

## Configuration 
(As per the #Option1 from the feature documentation)

ES indices

```
{
    "name": "open"
    "doc_type": "open",
    "root": "study",
    "props": ["study_name", "description", "date", "auth_resource_path"],
}

{
    "name": "studies"
    "doc_type": "studies",
    "root": "study",
    "props": ["study_name", "description", "date", "auth_resource_path", "controlled_info", ...],
}
```
Guppy Configuration
```
 "guppy": {
   "indices": [{
       "index": "open",
       "type": "open",
       "tiered_access_level": "libre"
     },
     {
       "index": "studies",
       "type": "studies",
  "tiered_access_level": "private"
     }
   ],
   "auth_filter_field": "auth_resource_path",
   ...
 }
```
With the above configuration changes, Guppy can apply appropriate tiered access middleware for different ES indices

## Test Scenarios

1. User without Access <br>
    a. Go to Study Viewer, the user can see all the open access studies and its properties. <br>
    b. can request access to particular study 
    
2. User with Access to subset of studies <br>
    a. Go to Study Viewer, the user can see all open access studies and its properties <br>
    b. subset of studies are accessible to the user which they are authorized to. <br>
    c. can request additional access or launch workspace with the accessible data
    


