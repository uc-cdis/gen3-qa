Feature('Aggregate Metadata Service @aggMDS @requires-metadata');

const uuid = require('uuid');
const { expect } = require('chai');
const { output } = require('codeceptjs');

const I = actor();
I.cache = {};

// After(async ({ users, mds }) => {
//  if ('studyId' in I.cache) {
//    await mds.do.deleteMetadataRecord(users.mainAcct.accessTokenHeader, I.cache.studyId);
//    await mds.do.reSyncAggregateMetadata();
//  }
// });

Scenario('Create, edit and delete aggregate metadata record', async ({ mds, users }) => {
  I.cache.studyId = uuid.v4();
  // eslint-disable-next-line prefer-const
  let studyMetaData = {
    _guid_type: 'discovery_metadata',
    gen3_discovery: {
      tags: [
        {
          category: 'Other',
          name: 'AUTOTEST Tag',
        },
      ],
      authz: [],
      sites: 3,
      summary: '[AUTOTEST Summary] The BACPAC Research Program, Data Integration, Algorithm Development, and Operations Management Center (DAC) will bring cohesion to research performed by the participating Mechanistic Research Centers, Technology Research Sites, and Phase 2 Clinical Trials Centers. DAC Investigators will share their vision and provide scientific leadership and organizational support to the BACPAC Consortium. The research plan consists of supporting design and conduct of clinical trials with precision interventions that focus on identifying the best treatments for individual patients. The DAC will enhance collaboration and research progress with experienced leadership, innovative design and analysis methodologies, comprehensive research operations support, a state-of-the-art data management and integration system, and superior administrative support. This integrated structure will set the stage for technology assessments, solicitation of patient input and utilities, and the evaluation of high-impact interventions through the innovative design and sound execution of clinical trials, leading to effective personalized treatment approaches for patients with chronic lower back pain.',
      location: 'Chapel Hill, Nc',
      subjects: 150,
      __manifest: [],
      study_name: 'BACPAC Research Consortium',
      study_type: 'Other',
      institutions: 'University Of North Carolina Chapel Hill',
      year_awarded: 2019,
      investigators: 'Lavange, Lisa',
      project_title: '[AUTOTEST Title] Testing Aggregate Metadata Service',
      protocol_name: 'BACPAC Minimum Dataset Example',
      project_number: `${I.cache.studyId}`,
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
  // CREATE
  output.print('Creating Metadata Record');
  await mds.do.createMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId, studyMetaData,
  );
  output.print('Re-sync Aggregate Metadata');
  await mds.do.reSyncAggregateMetadata();
  const record = await mds.do.readAggMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId,
  );
  expect(record.commons_name).to.equal('HEAL');
  expect(record.project_title).to.equal('[AUTOTEST Title] Testing Aggregate Metadata Service');
  // EDIT
  output.print('Updating Metadata Record');
  studyMetaData.gen3_discovery.project_title = '[AUTOTEST Title] Testing Aggregate Metadata Service - Modified';
  await mds.do.editMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId, studyMetaData,
  );
  output.print('Re-sync Aggregate Metadata');
  await mds.do.reSyncAggregateMetadata();
  const updatedRecord = await mds.do.readAggMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId,
  );
  expect(updatedRecord.project_title).to.equal('[AUTOTEST Title] Testing Aggregate Metadata Service - Modified');
  // DELETE
  // output.print('Deleting Metadata Record');
  // await mds.do.deleteMetadataRecord(
  //  users.mainAcct.accessTokenHeader, I.cache.studyId,
  // );
  // output.print('Re-sync Aggregate Metadata');
  // await mds.do.reSyncAggregateMetadata();
  // const deletedRecord = await mds.do.readAggMetadataRecord(
  // users.mainAcct.accessTokenHeader, I.cache.studyId,
  // );
  // expect(deletedRecord.status).to.equal(404);
});
