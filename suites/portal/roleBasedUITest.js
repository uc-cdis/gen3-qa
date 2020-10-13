Feature('RoleBasedUI - https://ctds-planx.atlassian.net/browse/PXP-4252');

const chai = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const { expect } = chai;

Scenario('The following tests require Windmill to have some particular configs set @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. In gitops.json, useArboristUI should be true.
        2. In gitops.json, componentToResourceMapping should have Workspace, Analyze Data, Query, and Query Data objects.
        3. Config example here: https://github.com/uc-cdis/cdis-wiki/blob/master/dev/gen3/guides/ui_etl_configuration.md#portal-folder
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The query button and data card work for the user with query access @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with query access
        2. Verify button and panel are present
        3. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The query button and data card are not visible for the user without query access @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Verify that the query button and panel are not present when not logged in.
        2. Login as the user without query access
        3. Verify button and panel are not present
        4. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('On the projects page, the submit button is only present for projects the user may submit to - otherwise only browse is present @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with access to some, but not all projects
        2. Navigate to the all-projects page
        3. Verify that the submit button is present for appropriate projects
        4. Verify that browse button is present for other projects
        5. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('On the all-projects page, the recent submissions table is present if the user has create or update permission on some project @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with access to some, but not all projects
        2. Navigate to the all-projects page
        3. Verify that the submit table is present
        4. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('On the all-projects page, the recent submissions table is not present if the user has no create or update permission @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with no create/update access on any projects
        2. Navigate to the all-projects page
        3. Verify that the recent submissions table is not present
        4. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('On a project page - the submission tools are present if the user has submit permission @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with access to the project
        2. Navigate to the project page
        3. Verify that the submit tools are present
        4. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('On a project page - the submission tools are not present if the user does not have submit permission @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with no access to the project
        2. Navigate to the project page
        3. Verify that the submit tools are not present
        4. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('On the node browser - delete buttons are present if the user has delete permission on the project @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with access to the project
        2. Navigate to a project the user has access to
        3. Verify that the delete buttons are present
        4. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('On the node browser - delete buttons are not present if the user does not have delete permission on the project @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with access to the project
        2. Navigate to a project the user does not have access to
        3. Verify that the delete buttons are not present
        4. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The workspace button is present if the user has access @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with workspace access
        2. Verify that the workspace button is present
        3. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The workspace button is not present if the user does not have access @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as the user with workspace access
        2. Verify that the workspace button is not present
        3. More details: https://docs.google.com/document/d/1IsUlRwoNLUNtT5I9D2tzmepC3y8vdhjmuLfUh-wumvU/edit?ts=5d72d22b#
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The file page download button is present if the user has read-storage permission on the file @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as a user with read-storage access on some project
        2. Navigate to the file page for a file in that project (/files/{guid})
        3. Verify that the download button is present
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The file page download button is not present if the user does not have read-storage permission on the file @manual', ifInteractive(
  async () => {
    const result = await interactive(`
        1. Login as a user with no read-storage access on some project
        2. Navigate to the file page for a file in that project (/files/{guid})
        3. Verify that the download button is not present
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));
