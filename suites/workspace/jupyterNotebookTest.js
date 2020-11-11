/*
 Jupyter Notebook test (PXP-????)
 This test plan has a few pre-requisites:
 1. The environment must have the file-upload capabilities
    (Ssjdispatcher should be configured)
 2. The environment must be configured with Hatchery (To run workspace applications)
*/
Feature('Jupyter Notebook');

const { expect } = require('chai');
const { checkPod, sleepMS, Gen3Response } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

Scenario('Submit dummy data to the Gen3 Commons environment @jupyterNb', async (fence, users) => {
  
});

Scenario('Upload a file through the gen3-client CLI @jupyterNb', async (fence, users) => {
  
});

Scenario('Map the uploaded file to one of the subjects of the dummy dataset @jupyterNb', async (fence, users) => {
  
});

Scenario('Run ETL so the recently-submitted dataset will be available on the Explorer page @jupyterNb', async (fence, users) => {
  
});

Scenario('Select a cohort that contains the recently-mapped file and export it to the workspace @jupyterNb', async (fence, users) => {
  
});

Scenario('Open the workspace, launch a Jupyter Notebook Bio Python app and load the exported manifest with some Python code @jupyterNb', async (fence, users) => {
  
});
