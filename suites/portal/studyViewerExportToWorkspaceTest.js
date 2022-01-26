/*
Pre-requisites for executing the tests:
 1. Latest code of data-portal, pelican, manifestservice, gen3-fuse
 2. Users
    User1 has access to workspace
*/
Feature('Export To Workspace From Study Viewer @requires-portal');

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

Scenario('User1 can export study to workspace', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/study-viewer' page
            2. Click 'Show details' under a study
            3. Verify that the 'Export to Workspace' button is enabled
            4. Click on 'Export to Workspace'
            5. Verify that a confirmation message is shown at the bottom of the page with a button to redirect to workspace
            6. Click on 'Go to Workspace' button
            7. The '/workspace' page is loaded
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('On initiating export to workspace, a pelican-export job is initiated', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/study-viewer' page
            2. Click 'Show details' under a study
            3. Verify that the 'Export to Workspace' button is enabled
            4. Click on 'Export to Workspace'
            5. Verify that kubernetes job pelican-export is triggered
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('On initiating export to workspace, a hatchery pod is created', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/study-viewer' page
            2. Click 'Show details' under a study
            3. Verify that the 'Export to Workspace' button is enabled
            4. Click on 'Export to Workspace'
            5. Verify that kubernetes pod hatchery is created
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('The exported study is available in the jupyter notebook', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to '/study-viewer' page
            2. Click 'Show details' under a study
            3. Verify that the 'Export to Workspace' button is enabled
            4. Click on 'Export to Workspace'
            5. Verify that a confirmation message is shown at the bottom of the page with a button to redirect to workspace
            6. Click on 'Go to Workspace' button
            7. The '/workspace' page is loaded
            8. Launch a workspace
            9. Navigate to pd/data/ and verify that a new PFB and mount are present, labeled cohort-<GUID>.avro and manifest-<GUID>
       `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');
