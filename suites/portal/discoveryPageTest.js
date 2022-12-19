/* eslint-disable no-tabs */
const uuid = require('uuid');
const { expect } = require('chai');
const { output } = require('codeceptjs');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();
const I = actor();
I.cache = {};

Feature('Discovery page @discoveryPage @requires-portal @requires-metadata @requires-indexd @requires-sower @aggMDS');

After(({ users, mds }) => {
  if ('studyId' in I.cache) {
    try {
      mds.do.deleteMetadataRecord(users.mainAcct.accessTokenHeader, I.cache.studyId);
    } catch (error) {
      console.log(error);
    }
  }
});

Scenario('User is able to navigate to Discovery page @requires-portal', ({ discovery }) => {
  discovery.do.goToPage();
  discovery.ask.isPageLoaded();
});

Scenario('Publish a study, search and export to workspace @requires-hatchery @requires-portal', async ({
  mds, users, discovery, files, indexd, home, workspace,
}) => {
  // dynamically get UID field name from portal config
  const UIDFieldName = await bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.discoveryConfig.minimalFieldMapping.uid\'').replace(/^"(.*)"$/, '$1');
  expect(UIDFieldName).to.be.a('string').that.is.not.empty;

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

  output.print('--- Publish study metadata');
  const studyMetaData = {
    _guid_type: 'discovery_metadata',
    gen3_discovery: {
      tags: [
        {
          category: 'Other',
          name: 'AUTOTEST Tag',
        },
      ],
      authz: ['/programs/QA'],
      [UIDFieldName]: `${I.cache.studyId}`,
      sites: 3,
      summary: '[AUTOTEST Summary] The BACPAC Research Program, Data Integration, Algorithm Development, and Operations Management Center (DAC) will bring cohesion to research performed by the participating Mechanistic Research Centers, Technology Research Sites, and Phase 2 Clinical Trials Centers. DAC Investigators will share their vision and provide scientific leadership and organizational support to the BACPAC Consortium. The research plan consists of supporting design and conduct of clinical trials with precision interventions that focus on identifying the best treatments for individual patients. The DAC will enhance collaboration and research progress with experienced leadership, innovative design and analysis methodologies, comprehensive research operations support, a state-of-the-art data management and integration system, and superior administrative support. This integrated structure will set the stage for technology assessments, solicitation of patient input and utilities, and the evaluation of high-impact interventions through the innovative design and sound execution of clinical trials, leading to effective personalized treatment approaches for patients with chronic lower back pain.',
      study_description_summary: '[AUTOTEST Summary] The BACPAC Research Program, Data Integration, Algorithm Development, and Operations Management Center (DAC) will bring cohesion to research performed by the participating Mechanistic Research Centers, Technology Research Sites, and Phase 2 Clinical Trials Centers. DAC Investigators will share their vision and provide scientific leadership and organizational support to the BACPAC Consortium. The research plan consists of supporting design and conduct of clinical trials with precision interventions that focus on identifying the best treatments for individual patients. The DAC will enhance collaboration and research progress with experienced leadership, innovative design and analysis methodologies, comprehensive research operations support, a state-of-the-art data management and integration system, and superior administrative support. This integrated structure will set the stage for technology assessments, solicitation of patient input and utilities, and the evaluation of high-impact interventions through the innovative design and sound execution of clinical trials, leading to effective personalized treatment approaches for patients with chronic lower back pain.',
      location: 'Chapel Hill, Nc',
      subjects: 150,
      __manifest: [
        {
          md5sum: `${I.cache.md5sum}`,
          file_name: 'discovery_test.csv',
          file_size: 16,
          object_id: `${I.cache.did}`,
          commons_url: `${process.env.HOSTNAME}`,
        },
      ],
      study_name: 'BACPAC Research Consortium',
      study_name_title: 'BACPAC Research Consortium',
      study_type: 'Other',
      institutions: 'University Of North Carolina Chapel Hill',
      year_awarded: 2019,
      investigators: 'Lavange, Lisa',
      project_title: '[AUTOTEST Title] Back Pain Consortium (BACPAC) Research Program Data Integration, Algorithm Development and Operations Management Center',
      protocol_name: 'BACPAC Minimum Dataset Example',
      administering_ic: 'NIAMS',
      advSearchFilters: [
        {
          key: 'Research Focus Area',
          value: 'AUTOTEST Filter',
        },
      ],
      research_program: 'Back Pain Consortium Research Program',
      research_question: 'To inform a precision medicine approach to cLBP.',
      study_description: 'Observational',
      research_focus_area: 'Clinical Research in Pain Management',
    },
  };
  output.print('--- Creating metadata record');
  await mds.do.createMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId, studyMetaData,
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
  discovery.do.goToPage();
  I.saveScreenshot('discoveryPage.png');

  output.print('--- Perform tag search');
  discovery.do.tagSearch('TESTING', 'AUTOTEST Tag');
  I.saveScreenshot('2_clicked_tag.png');
  discovery.ask.isStudyFound(I.cache.studyId);

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
  discovery.ask.isStudyFound(I.cache.studyId);

  output.print('--- Perform text search');
  I.refreshPage();
  I.wait(2);
  discovery.do.textSearch('[AUTOTEST Summary]');
  I.saveScreenshot('5_entered_text.png');
  discovery.ask.isStudyFound(I.cache.studyId);

  output.print('--- Open study in workspace');
  discovery.do.openInWorkspace(I.cache.studyId);
  I.saveScreenshot('6_open_in_workspace.png');
  I.waitInUrl('/workspace', 120);
  await workspace.do.launchWorkspace('(Tutorial) Bacpac Synthetic Data Analysis Notebook');

  output.print('--- Run `gen3 drs-pull object` in a new Python3 notebook');
  await workspace.do.runCommandinPythonNotebook(`!gen3 drs-pull object --object_id ${I.cache.did}`);
  I.saveScreenshot('7_run_drs_pull_in_notebook.png');
}).tag('@discoveryPage', '@e2e');
