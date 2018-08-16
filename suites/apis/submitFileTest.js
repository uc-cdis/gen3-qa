'use strict';

Feature('SubmitFileTest');

// Used to construct valid and invalid file nodes
let base_file_node;
// Used for holding different file versions for testing. Refreshed before every Scenario
let files;
// Used adding url to file nodes
let test_url = "s3://cdis-presigned-url-test/testdata";

Scenario('submit and delete file @asdfg', async(sheepdog, indexd) => {
  // submit basic file without url
  await sheepdog.complete.addNode(files.valid_file);
  await indexd.complete.checkFile(files.valid_file);
  await sheepdog.complete.deleteNode(files.valid_file);
  await indexd.complete.deleteFile(files.valid_file);
});


Scenario('test submit file with URL', async(sheepdog, indexd) => {
  // add url and submit
  files.valid_file.data.urls = test_url;
  await sheepdog.complete.addNode(files.valid_file);
  await indexd.complete.checkFile(files.valid_file);
  await sheepdog.complete.deleteNode(files.valid_file);
  await indexd.complete.deleteFile(files.valid_file);
});


Scenario('test update file with URL', async(sheepdog, indexd) => {
  // submit basic file without url
  await sheepdog.complete.addNode(files.valid_file);
  await indexd.complete.checkFile(files.valid_file);

  // add a url to the data and update it
  files.valid_file.data.urls = test_url;
  await sheepdog.complete.updateNode(files.valid_file);
  await indexd.complete.checkFile(files.valid_file);

  // delete from sheepdog and indexd
  await sheepdog.complete.deleteNode(files.valid_file);
  await indexd.complete.deleteFile(files.valid_file);
});


Scenario('submit file invalid property', async(sheepdog) => {
  await sheepdog.do.addNode(files.invalid_prop);
  sheepdog.ask.hasInternalServerError(files.invalid_prop.add_res)
});


Scenario('update file with invalid property', async(sheepdog, indexd) => {
  // submit valid file
  await sheepdog.complete.addNode(files.valid_file);
  await indexd.complete.checkFile(files.valid_file);

  // update file with invalid data
  files.invalid_prop.data.id = files.valid_file.data.id;
  files.invalid_prop.did = files.valid_file.did;
  files.invalid_prop.rev = files.valid_file.rev;

  await sheepdog.do.addNode(files.invalid_prop);
  sheepdog.ask.hasInternalServerError(files.invalid_prop.add_res);

  await sheepdog.complete.deleteNode(files.invalid_prop);
  await indexd.complete.deleteFile(files.invalid_prop);
});


const _makeFiles = function(base_node) {
  let valid_file = base_node.clone();

  let invalid_prop = base_node.clone();
  invalid_prop.data.file_size = "hello";

  let missing_required = base_node.clone();
  delete missing_required.data.md5sum;

  return {
    valid_file: valid_file,
    invalid_prop: invalid_prop,
    missing_required: missing_required
  };
};

BeforeSuite(async (sheepdog, nodes) => {
  // Cleanup any leftover nodes from previous Suites
  await sheepdog.complete.findDeleteAllNodes();

  // add nodes up to, but not including, the file node
  await sheepdog.complete.addNodes(nodes.toFileAsList);
  base_file_node = nodes.fileNode;
});


Before(() => {
  // clone the base file for "clean" files to work with before each test
  files = _makeFiles(base_file_node);
});


AfterSuite(async (sheepdog, nodes) => {
  await sheepdog.complete.deleteNodes(nodes.toFileAsList);

  // try to delete anything else that may be remaining
  await sheepdog.complete.findDeleteAllNodes();
});
