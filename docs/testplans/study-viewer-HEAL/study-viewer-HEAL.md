# HEAL PROJECT Study Viewer: Tiered Access Support

## Overview
The Study Viewer should be able to display both open-access and controlled-access study level metadata. The user can 
view the metadata depending on the user authorization.

## Technical Document 
[Study Viewer : Tiered Access Support](https://docs.google.com/document/d/1F9ytUu-jedmtIj9SRRq4BtJdTfuklAqbsKHctI9UwNQ/edit#heading=h.5e0lej9k5tiv)

## User-Cases

1. Researcher without prior access to studies, 
    
    a. can navigate through all the studies and view their study level metadata, can request access if needed.
    
    b. can view all open-access study-level metadata.
    
2. Researcher with access to subset of studies,

    a. can navigate through all the studies and view their study level metadata, request additional access or launch 
    a workspace.
    
    b. can view a subset of study-level metadata which the authorized user (researcher) has access to.
       
3. As a developer,

    a. able to dictate which displayed properties are controlled-access and which are open-access so that authorized/non-authorized
    users have information based on their access.
    
    b. open-access properties are visible to all the users and controlled-access properties would be visible to user with 
    approved authorization for specific study.
    
    c. controlled-access properties not necessarily be commons for all studies, but the core open access properties are 
    common to all the studies.
    
## User Flow

1. 
    

