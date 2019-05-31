Feature('GetCoreMetadata');

// test data
let valid_file;
let invalid_id_file;

Scenario('test core metadata', async(pidgin, users) => {
  let metadata = await pidgin.do.getCoremetadata(valid_file, 'application/json', users.mainAcct.accessTokenHeader);
  pidgin.ask.seeJsonCoremetadata(valid_file, metadata);

  metadata = await pidgin.do.getCoremetadata(valid_file, 'x-bibtex', users.mainAcct.accessTokenHeader);
  pidgin.ask.seeBibtexCoremetadata(valid_file, metadata);

  // to be implemented to support application/vnd.schemaorg.ld+json format in future
  // metadata = await pidgin.do.getCoremetadata(valid_file, 'application/vnd.schemaorg.ld+json', users.mainAcct.accessTokenHeader);
  // pidgin.ask.seeSchemaorgCoremetadata(valid_file, metadata);
});

Scenario('test core metadata invalid object_id', async(pidgin, users) => {
  let data = await pidgin.do.getCoremetadata(invalid_id_file, 'json', users.mainAcct.accessTokenHeader);
  pidgin.ask.seePidginError(data);
});

Scenario('test core metadata no permission', async(pidgin) => {
  let invalid_token = { 'Authorization': 'invalid' };
  let data = await pidgin.do.getCoremetadata(valid_file, 'json', invalid_token);
  pidgin.ask.seePidginError(data);
});

BeforeSuite(async (nodes, sheepdog) => {
  // try to clean up any leftover nodes
  await sheepdog.complete.findDeleteAllNodes();

  await sheepdog.complete.addNodes(nodes.getPathToFile());

  valid_file = nodes.getFileNode().clone();
  await sheepdog.complete.addNode(valid_file);

  invalid_id_file = nodes.getFileNode().clone();
  invalid_id_file.data.object_id = 'invalid_object_id';
}).retry();

AfterSuite(async (sheepdog) => {
  await sheepdog.complete.findDeleteAllNodes();
});
