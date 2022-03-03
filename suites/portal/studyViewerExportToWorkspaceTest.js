/*
Pre-requisites for executing the tests:
 1. Latest code of data-portal, pelican, manifestservice, gen3-fuse
 2. Users
    dummy-one@planx-pla.net has access to workspace
    dummy-one@planx-pla.net has access to a study (NIAID-ACTT in QA-NCT)
*/
Feature('Export to Workspace from Study Viewer @requires-portal @requires-hatchery');

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

Scenario('User can export study to workspace', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Login as dummy-one@planx-pla.net
      2. Navigate to the study viewer page ('/study-viewer/clinical_trials' in QA-NCT)
      3. Click 'Show details' under a study you have access to (ACTT1 in QA-NCT)
      4. Verify that the 'Export to Workspace' button is enabled
      5. Click on 'Export to Workspace'
      6. Verify that a confirmation message is shown at the bottom of the page; wait to see a 'Go to Workspace' button
      7. Click on 'Go to Workspace' button
      8. Verify that you are redirected to the '/workspace' page
    `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');

Scenario('The exported study is available in the jupyter notebook', ifInteractive(
  async () => {
    const result = await interactive(`
      Follow-up to previous test:
      1. On the workspace page, launch a workspace; wait for it to load
      2. Navigate to the 'pd/data/<hostname>' directory
      3. Verify that there is a PFB file at 'cohort-<GUID>.avro'
      4. Verify that there is a file at 'manifest-<GUID>/by-guid/<GUID>'
      5. Verify that you can open the file at 'manifest-<GUID>/by-guid/<GUID>'
    `);
    expect(result.didPass, result.details).to.be.true;
  },
)).tag('@manual');
