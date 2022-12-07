const chai = require('chai');

const { expect } = chai;

Feature('GetCoreMetadata @requires-indexd');

// test data
let valid_file;
let invalid_id_file;

Scenario('test core metadata @coreMetadata', async ({ pidgin, users }) => {
  let metadata = await pidgin.do.getCoremetadata(valid_file, 'application/json', users.mainAcct.accessTokenHeader);
  pidgin.ask.seeJsonCoremetadata(valid_file, metadata);

  metadata = await pidgin.do.getCoremetadata(valid_file, 'x-bibtex', users.mainAcct.accessTokenHeader);
  pidgin.ask.seeBibtexCoremetadata(valid_file, metadata);

  // to be implemented to support application/vnd.schemaorg.ld+json format in future
  // metadata = await pidgin.do.getCoremetadata(valid_file, 'application/vnd.schemaorg.ld+json', users.mainAcct.accessTokenHeader);
  // pidgin.ask.seeSchemaorgCoremetadata(valid_file, metadata);
});

Scenario('test core metadata invalid object_id @coreMetadata', async ({ pidgin, users }) => {
  const data = await pidgin.do.getCoremetadata(invalid_id_file, 'application/json', users.mainAcct.accessTokenHeader);
  pidgin.ask.seePidginError(data);
});

Scenario('test core metadata no permission @coreMetadata', async ({ pidgin }) => {
  const invalid_token = { Authorization: 'invalid' };
  const data = await pidgin.do.getCoremetadata(valid_file, 'application/json', invalid_token);
  pidgin.ask.seePidginError(data);
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
