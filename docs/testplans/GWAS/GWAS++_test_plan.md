# GWAS++ Test Plan

## Overview

GWAS helps scientists identify genes associated with a particular disease (or another trait). This method studies the entire set of DNA (the genome) of a large group of people, searching for small variations called single nucleotide polymorphisms or SNPs

## Technical Documentation

The documentation about the GWAS app can be found in QA and PreProd

[Documentation from QA](https://qa-mickey.planx-pla.net/dashboard/Public/documentation/index.html#gen3-gwas)

## Scope

Gen3 GWAS App provides the interface to perform high throughput GWAS on Million Veteran Program (MVP) data using the University of Washington Genesis pipeline.

## Workflow

-   User logs in and navigates to Apps on commons homepage
-   Selects GWAS++ App
-   Selects the Cohort and sees change in Attrition table on the top for selected cohort. Click Next
-   Select Outcome Phenotype (Continuous or Dichotomous). Select variables.Click Submit. See the change in Attrition Table. Click Submit
-   Select Covariate Phenotype (Continuous or Dichotomous). Select covariate variables. Click Add. See the change in Attrition Table.
-   Configure GWAS.
-   Submitting the job.
-   Checking if the navigation and deletion button work as expected.

## Test Scenarios

-   Testing whole workflow to submit a GWAS job with both continuous and dichotomous phenotype and covariate phenotypes.
-   Negative tests - unauthorized permissions to GWAS, Selecting non-phenotype file at intial stages of the workflow
-   Adding various parameters and fields and unseleting them -   Checking the GWAS results