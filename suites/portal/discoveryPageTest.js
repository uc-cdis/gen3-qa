/* eslint-disable no-tabs */
const uuid = require('uuid');
const { expect } = require('chai');
const { output } = require('codeceptjs');
const { Bash } = require('../../utils/bash.js');
const fs = require('fs');
const { sleepMS } = require('../../utils/apiUtil.js');

const bash = new Bash();
const I = actor();
I.cache = {};

Feature('Discovery page @discoveryPage @requires-portal @requires-metadata @requires-indexd @requires-hatchery @requires-wts @aggMDS');

After(({ users, mds }) => {
  if ('studyId' in I.cache) {
    try {
      mds.do.deleteMetadataRecord(users.mainAcct.accessTokenHeader, I.cache.studyId);
    } catch (error) {
      console.log(error);
    }
  }
});

Scenario('User is able to navigate to Discovery page', ({ discovery }) => {
  discovery.do.goToPage();
  discovery.ask.isPageLoaded();
});

Scenario('Publish a study, search and export to workspace @requires-indexd @requires-hatchery', async ({
  mds, users, discovery, files, indexd, home, workspace,
}) => {
  // dynamically get UID field name from portal config
  const UIDFieldName = bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.discoveryConfig.minimalFieldMapping.uid\'').replace(/^"(.*)"$/, '$1');
  expect(UIDFieldName).to.be.a('string').that.is.not.empty;
  const studyPreviewField = bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.discoveryConfig.studyPreviewField.field\'').replace(/^"(.*)"$/, '$1');
  expect(studyPreviewField).to.be.a('string').that.is.not.empty;

  output.print('--- Create Indexd Record');
  I.cache.did = uuid.v4();
  I.cache.studyId = uuid.v4();
  I.cache.md5sum = '694b1d13b8148756442739fa2cc37fd6'; // pragma: allowlist secret
  const indexdRecords = [{
    filename: 'discovery_test.csv',
    did: I.cache.did,
    link: 's3://cdis-presigned-url-test/testdata/discovery_test.csv',
    md5: I.cache.md5sum,
    authz: ['/programs/QA'],
    size: 16,
  },]
  
  const ok = await indexd.do.addFileIndices(indexdRecords);
  expect(ok, 'Unable to index files').to.be.true;

  output.print('--- Populate study metadata');
  const studyMetadata = JSON.parse(fs.readFileSync('test-data/aggMDSTest/study1.json'));
  if(studyPreviewField !== 'summary') {
    studyMetadata.gen3_discovery[studyPreviewField] = studyMetadata.gen3_discovery.summary;
    delete studyMetadata["gen3_discovery"]["summary"];
  }
  studyMetadata.gen3_discovery[UIDFieldName] = I.cache.studyId;
  studyMetadata.gen3_discovery.__manifest.push({
    md5sum: `${I.cache.md5sum}`,
    file_name: 'discovery_test.csv',
    file_size: 16,
    object_id: `${I.cache.did}`,
    commons_url: `${process.env.HOSTNAME}`,
  });
  
  output.print('--- Creating metadata record');
  await mds.do.createMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId, studyMetadata,
  );
  output.print('--- Re-sync aggregate metadata');
  await mds.do.reSyncAggregateMetadata();
  const record = await mds.do.readAggMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId,
  );
  expect(record.commons_name).to.equal('HEAL');

  output.print('--- Navigate to discovery page');
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);
  await sleepMS(120000);
  discovery.do.goToPage();
  I.saveScreenshot('discoveryPage.png');

  output.print('--- Perform tag search');
  discovery.do.tagSearch('TESTING', 'AUTOTEST Tag');
  I.saveScreenshot('2_clicked_tag.png');
  await discovery.ask.isStudyFound(I.cache.studyId);

  // Advanced search
  // I.refreshPage();
  // I.wait(2);
  // discovery.do.advancedSearch(['AUTOTEST Filter']);
  // I.saveScreenshot('3_advanced_search.png');
  // discovery.ask.isStudyFound(I.cache.studyId);

  output.print('--- Perform text search');
  I.refreshPage();
  I.wait(2);
  discovery.do.textSearch('[AUTOTEST Title]');
  I.saveScreenshot('4_entered_text.png');
  await discovery.ask.isStudyFound(I.cache.studyId);

  output.print('--- Perform text search');
  I.refreshPage();
  I.wait(2);
  discovery.do.textSearch('[AUTOTEST Summary]');
  I.saveScreenshot('5_entered_text.png');
  await discovery.ask.isStudyFound(I.cache.studyId);

  output.print('--- Open study in workspace');
  discovery.do.openInWorkspace(I.cache.studyId);
  I.saveScreenshot('6_open_in_workspace.png');
  I.waitInUrl('/workspace', 120);

  await workspace.do.launchWorkspace('(Tutorial) Bacpac Synthetic Data Analysis Notebook');

  output.print('--- Run `gen3 drs-pull object` in a new Python3 notebook');
  await workspace.do.runCommandinPythonNotebook(`!gen3 drs-pull object --object_id ${I.cache.did}`);
  I.saveScreenshot('7_run_drs_pull_in_notebook.png');
});
