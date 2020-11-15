# PFB Export to Workspace

## Overview
An enhancement to the Export To Workspace flow that applies PFB as a handoff mechanism to send user-created virtual cohorts from the Data Explorer to the Workspace for programmatic user analysis.

## Technical Design
[Design Document](https://docs.google.com/document/d/1954SSzVgDDM41uBksIt9RY7_MRAcCzoaMfmwHtfpFG4)
[Workflow](https://app.lucidchart.com/documents/edit/e0f8a7a9-616d-4c60-9362-e86a59d012cb/0_0)

## Scope - development
The repos modified for implementing the feature are:
1. data-portal
1. pelican
1. manifestservice
1. gen3-fuse

New k8s cron job:
1. remove_tmp_indexd_records

## Scope - testing
The areas of testing in scope are:
1. Analyze the changes in individual services / jobs and add tests to cover those as needed
1. End to end tests for the feature with different combinations of clinical and object data
1. Performance benchmarking for different combinations of the clinical and object data
1. Data security - tests to verify that access to unauthorized data is not possible - ??
1. Regression - tests to ensure that the exisiting functionalities are not affected by the changes (the automated tests that are a part of the CI runs)

## Tests
### Functional testing
1. Test the changes in the updated services
1. Test the cron job
1. Create different cohorts in explorer and check the PFB data
1. Create different cohorts in explorer and run the export operation and verify the data available in the notebook

### Load testing
1. Test different sizes and benchmark the time taken to complete the export operation
1. Test and benchmark the cron job

### Stress testing
1. Identify the largest possible cohort that can be exported in reasonable time, given the resources available in the test environment

### Data security testing
1. TBD
