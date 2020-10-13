/*
 Access GUI tests (PXP-6822)
 This test plan has a few pre-requisites:
 1. Sower must be deployed and
 2. The environment's manifest must have the indexing jobs declared
    within the sower config block (manifest-indexing & indexd-manifest)
 3. The Indexing GUI is only available in data-portal >= 2.24.9
*/
Feature('Indexing GUI');

const { expect } = require('chai');
const { checkPod, sleepMS, Gen3Response } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');
