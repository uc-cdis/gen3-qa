'use strict';

let assert = require('assert');
let util = require('./utilApis');

Feature('GetCoreMetadata');

let endpoint;

// data used for testing files
let base_file_data;

// Used for holding different file versions for testing. Refreshed before every Scenario
let files;

Scenario('test core metadata as json', async(I) => {
  await I.submitFile(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeAddSuccess(files.valid_file);

  let metadata = await I.getJsonCoremetadata(endpoint, files.valid_file);
  I.seeJsonCoremetadata(files.valid_file, metadata);

  await I.deleteNode(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeDeleteSuccess(files.valid_file);
});

Scenario('test core metadata as bibtex', async(I) => {
  await I.submitFile(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeAddSuccess(files.valid_file);

  let metadata = await I.getBibtexCoremetadata(endpoint, files.valid_file);
  I.seeBibtexCoremetadata(files.valid_file, metadata);

  await I.deleteNode(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeDeleteSuccess(files.valid_file);
});

Scenario('test core metadata invalid object_id', async(I) => {
  await I.submitFile(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeAddSuccess(files.valid_file);

  let invalid_file = files.valid_file;
  invalid_file.did = 'invalid_object_id';

  let data = await I.getJsonCoremetadata(endpoint, invalid_file);
  I.seePidginError(data);

  await I.deleteNode(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeDeleteSuccess(files.valid_file);
});

Scenario('test core metadata no permission', async(I) => {
  await I.submitFile(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeAddSuccess(files.valid_file);

  let invalid_token = {
    'Authorization': 'invalid'
  };

  let data = await I.getJsonCoremetadata(endpoint, files.valid_file, invalid_token);
  I.seePidginError(data);

  await I.deleteNode(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeDeleteSuccess(files.valid_file);
});

BeforeSuite(async (I) => {
  // try to clean up any leftover nodes
  await I.findDeleteAllNodes();

  // submit test data
  let nodes = I.getNodePathToFile();
  base_file_data = util.extractFile(nodes);
  await I.addNodes(I.getSheepdogRoot(), Object.values(nodes));
  I.seeAllNodesAddSuccess(Object.values(nodes));

  endpoint = I.getCoreMetadataRoot();
});

Before((I) => {
  // reload the files
  files = util.getFiles(base_file_data);
});

AfterSuite(async (I) => {
  await I.findDeleteAllNodes();
});
