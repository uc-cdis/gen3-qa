GWAS Result app Test Plan

## Overview

GWAS Results helps scientists to see the results of the GWAS workflows. See the execution logs and also see the manhattan graphs for viewing the results

## Scope

Provide a Results app that allows the users to view the workflow logs along with the results graph. The user can download the result for future viewing.

## Workflow

- User starts a workflow using the GWS workflow.
- After submiting thw workflow, the success message page offers the user with couple of option one of which is the `See Status` button.
- Clicking on the button should take you the `GWAS Result V2` app.
- User can see the workflows start along with the status of the workflow. Workflow can be in statuses - Pending, Running, Succeeded or Failed.
- On success, the user can see `Execution` button which shows user the logs from workflow and `Results` button shows user with Manhattan graph of the workflow . In Actions column, the user could download the result of the workflow.
- If the user has already submitted the workflow in past and wants to check the status of the workflow. the user can click on GWAS Results V2 on app tabs. The view will show all the workflows that user have submitted in past and can click on any workflow and check the status of the workflow.

## Test Scenario

- Testing the whole workflow along with redirecting to the latest result app
- Checking the result page and also trying to download option