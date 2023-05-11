const chai = require('chai');

const { expect } = chai;

Feature('GetCoreMetadata @requires-indexd @requires-peregrine @requires-sheepdog');

// test data
let valid_file;
let invalid_id_file;

Scenario('test core metadata @coreMetadata', async ({ peregrine, users }) => {
  let metadata = await peregrine.do.getCoremetadata(valid_file, 'application/json', users.mainAcct.accessTokenHeader);
  peregrine.ask.seeJsonCoremetadata(valid_file, metadata);

  metadata = await peregrine.do.getCoremetadata(valid_file, 'x-bibtex', users.mainAcct.accessTokenHeader);
  peregrine.ask.seeBibtexCoremetadata(valid_file, metadata);

  // to be implemented to support application/vnd.schemaorg.ld+json format in future
  // metadata = await peregrine.do.getCoremetadata(valid_file, 'application/vnd.schemaorg.ld+json', users.mainAcct.accessTokenHeader);
  // peregrine.ask.seeSchemaorgCoremetadata(valid_file, metadata);
});

Scenario('test core metadata invalid object_id @coreMetadata', async ({ peregrine, users }) => {
  const data = await peregrine.do.getCoremetadata(invalid_id_file, 'application/json', users.mainAcct.accessTokenHeader);
  peregrine.ask.seeCoreMetadataError(data);
});

Scenario('test core metadata no permission @coreMetadata', async ({ peregrine }) => {
  const invalid_token = { Authorization: 'invalid' };
  const data = await peregrine.do.getCoremetadata(valid_file, 'application/json', invalid_token);
  peregrine.ask.seeCoreMetadataError(data);
});

BeforeSuite(async ({ nodes, sheepdog }) => {
  // try to clean up any leftover nodes
  await sheepdog.complete.findDeleteAllNodes();

  await sheepdog.complete.addNodes(nodes.getPathToFile());

  valid_file = nodes.getFileNode().clone();
  await sheepdog.complete.addNode(valid_file);
  // console.log('Got file', valid_file);
  expect(!!valid_file.did, 'Sheepdog addNode did not set .did').to.be.true;
  invalid_id_file = nodes.getFileNode().clone();
  invalid_id_file.data.object_id = 'invalid_object_id';
  invalid_id_file.did = 'invalid_object_id';
});

AfterSuite(async ({ sheepdog }) => {
  try {
    await sheepdog.complete.findDeleteAllNodes();
  } catch (error) {
    console.log(error);
  }
});
