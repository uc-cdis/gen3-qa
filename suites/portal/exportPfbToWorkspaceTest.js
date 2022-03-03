/*
Pre-requisites for executing the tests:
 1. Latest code of data-portal, pelican, manifestservice, gen3-fuse
 2. Clinical metadata and object data (at least 1 file linked)
 3. ETL executed and data present in ES
 4. Users
    User1 has access to project `DEV-test` (which has a file linked)
    User2 has access to project `jnkns-jenkins` (which does not have a file linked)
*/
Feature('Export PFB To Workspace @requires-portal @requires-hatchery');

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

Scenario('User1 can assemble a cohort and export pfb to workspace', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/explorer' page
            2. Verify that the 'Export PFB to Workspace' button is enabled
            3. Select checkboxes from the faceted search to assemble a cohort
            4. Click on 'Export PFB to Workspace'
            5. Verify that a confirmation message is shown at the bottom of the page with a button to redirect to workspace
            6. Click on 'Go to Workspace' button
            7. The '/workspace' page is loaded
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('User2 can assemble a cohort but cannot export pfb to workspace', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/explorer' page
            2. Verify that the 'Export PFB to Workspace' button is disabled
            3. Select checkboxes from the faceted search to assemble a cohort
            4. Verify that the 'Export PFB to Workspace' button is disabled
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('On initiating export pfb to workspace, a pelican-export job is initiated', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/explorer' page
            2. Verify that the 'Export PFB to Workspace' button is enabled
            3. Select checkboxes from the faceted search to assemble a cohort
            4. Click on 'Export PFB to Workspace'
            5. Verify that kubernetes job pelican-export is triggered
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('On initiating export pfb to workspace, a hatchery pod is created', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/explorer' page
            2. Verify that the 'Export PFB to Workspace' button is enabled
            3. Select checkboxes from the faceted search to assemble a cohort
            4. Click on 'Export PFB to Workspace'
            5. Verify that kubernetes pod hatchery is created
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('The exported pfb is available in the jupyter notebook', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/explorer' page
            2. Verify that the 'Export PFB to Workspace' button is enabled
            3. Select checkboxes from the faceted search to assemble a cohort
            4. Click on 'Export PFB to Workspace'
            5. Verify that a confirmation message is shown at the bottom of the page with a button to redirect to workspace
            6. Click on 'Go to Workspace' button
            7. The '/workspace' page is loaded
            8. Launch a workspace
            9. Navigate to pd/data/ and verify that a new PFB and mount are present, labeled cohort-<GUID>.avro and manifest-<GUID>  
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('The exported pfb can be decoded with pypfb inside the jupyter notebook', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/explorer' page
            2. Verify that the 'Export PFB to Workspace' button is enabled
            3. Select checkboxes from the faceted search to assemble a cohort
            4. Click on 'Export PFB to Workspace'
            5. Verify that a confirmation message is shown at the bottom of the page with a button to redirect to workspace
            6. Click on 'Go to Workspace' button
            7. The '/workspace' page is loaded
            8. Launch a workspace
            9. The exported pfb file is available in the file system
            10. Verify that the pfb file can be decoded with pypfb sdk
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');
