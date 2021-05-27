# GWAS Test Plan

## Overview
Helper tool to convert input files/folder to input manifest for mariner

## Workflow

-  User logs in and goes to the page of VA GWAS
-  STEP1: Upload Phenotype and Covariate File
	- Precondition: files need to be uploaded to workspace storage service.
	- Click Select File button
	- Select a file
	- Preview the file
	- Click Next
- STEP2: Specify Phenotype and Covariate
	- Select properties
	- Click Next
- STEP3: Parameter Settings
	- Select parameters
- STEP4: Job Submission
	- GWAS Job supposed to be submitted successfully
-  Previous button should navigate to previous step in STEP 3,4,5

## Test Scenario

- Test whole workflow to submit GWAS Job
- Test selecting different parameters
- Select files which are not Phenotype or Covariate file in STEP1
	- They are not supposed to  be loaded in STEP 2
