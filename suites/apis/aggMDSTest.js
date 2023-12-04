Feature('Aggregate Metadata Service @aggMDS @requires-metadata');

// Dummy commit ...

const uuid = require('uuid');
const { expect } = require('chai');
const { output } = require('codeceptjs');
const fs = require('fs');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();
const I = actor();
I.cache = {};

// Can uncomment after PXP-10530 gets fixed
// After(async ({ users, mds }) => {
//  if ('studyId' in I.cache) {
//    await mds.do.deleteMetadataRecord(users.mainAcct.accessTokenHeader, I.cache.studyId);
//    await mds.do.reSyncAggregateMetadata();
//  }
// });

const testDataFiles = new DataTable(['studyFilePath']);
testDataFiles.add(['test-data/aggMDSTest/study1.json']);
testDataFiles.add(['test-data/aggMDSTest/study2.json']);
testDataFiles.add(['test-data/aggMDSTest/study3.json']);

Data(testDataFiles).Scenario('Create, edit and delete aggregate metadata record', async ({
  mds, users, current,
}) => {
  I.cache.studyId = uuid.v4();
  // dynamically get UID field name from portal config
  const UIDFieldName = bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.discoveryConfig.minimalFieldMapping.uid\'').replace(/^"(.*)"$/, '$1');
  expect(UIDFieldName).to.be.a('string').that.is.not.empty;
  const studyMetadata = JSON.parse(fs.readFileSync(current.studyFilePath));
  studyMetadata.gen3_discovery[UIDFieldName] = I.cache.studyId;
  const projectTitle = studyMetadata.gen3_discovery.project_title;
  // CREATE
  output.print('Creating Metadata Record');
  await mds.do.createMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId, studyMetadata,
  );
  output.print('Re-sync Aggregate Metadata');
  await mds.do.reSyncAggregateMetadata();
  const record = await mds.do.readAggMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId,
  );
  expect(record.commons_name).to.equal('HEAL');
  expect(record.project_title).to.equal(projectTitle);
  // EDIT
  output.print('Updating Metadata Record');
  studyMetadata.gen3_discovery.project_title = `${projectTitle} - Modified`;
  await mds.do.editMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId, studyMetadata,
  );
  output.print('Re-sync Aggregate Metadata');
  await mds.do.reSyncAggregateMetadata();
  const updatedRecord = await mds.do.readAggMetadataRecord(
    users.mainAcct.accessTokenHeader, I.cache.studyId,
  );
  expect(updatedRecord.project_title).to.equal(`${projectTitle} - Modified`);
  // Can uncomment after PXP-10530 gets fixed
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
