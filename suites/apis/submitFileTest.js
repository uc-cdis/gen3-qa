Feature('SubmitFileTest');

// Used to construct valid and invalid file nodes
let baseFileNode;
// Used for holding different file versions for testing. Refreshed before every Scenario
let files;
// Used adding url to file nodes
const testUrl = 's3://cdis-presigned-url-test/testdata';

const makeFiles = function (baseNode) {
  const validFile = baseNode.clone();

  const invalidProp = baseNode.clone();
  invalidProp.data.file_size = 'hello';

  const missingRequired = baseNode.clone();
  delete missingRequired.data.md5sum;

  return {
    validFile,
    invalidProp,
    missingRequired,
  };
};

BeforeSuite(async (sheepdog, nodes) => {
  // Cleanup any leftover nodes from previous Suites
  await sheepdog.complete.findDeleteAllNodes();

  // add nodes up to, but not including, the file node
  await sheepdog.complete.addNodes(nodes.getPathToFile());
  baseFileNode = nodes.getFileNode();
});

Before(() => {
  // clone the base file for "clean" files to work with before each test
  files = makeFiles(baseFileNode);
});

AfterSuite(async (sheepdog, nodes) => {
  await sheepdog.complete.deleteNodes(nodes.getPathToFile());

  // try to delete anything else that may be remaining
  await sheepdog.complete.findDeleteAllNodes();
});

Scenario('submit and delete file', async (sheepdog, indexd) => {
  // submit basic file without url
  await sheepdog.complete.addNode(files.validFile);
  await indexd.complete.checkFile(files.validFile);
  await sheepdog.complete.deleteNode(files.validFile);
  await indexd.complete.deleteFile(files.validFile);
});

Scenario('submit file with URL', async (sheepdog, indexd) => {
  // add url and submit
  files.validFile.data.urls = testUrl;
  await sheepdog.complete.addNode(files.validFile);
  await indexd.complete.checkFile(files.validFile);
  await sheepdog.complete.deleteNode(files.validFile);
  await indexd.complete.deleteFile(files.validFile);
});

Scenario('submit file then update with URL', async (sheepdog, indexd) => {
  // submit basic file without url
  await sheepdog.complete.addNode(files.validFile);
  await indexd.complete.checkFile(files.validFile);

  // add a url to the data and update it
  files.validFile.data.urls = testUrl;
  await sheepdog.complete.updateNode(files.validFile);
  await indexd.complete.checkFile(files.validFile);

  // delete from sheepdog and indexd
  await sheepdog.complete.deleteNode(files.validFile);
  await indexd.complete.deleteFile(files.validFile);
});

Scenario('submit file invalid property', async (sheepdog) => {
  await sheepdog.do.addNode(files.invalidProp);
  sheepdog.ask.hasInternalServerError(files.invalidProp.addRes);
});

Scenario('update file with invalid property', async (sheepdog, indexd) => {
  // submit valid file
  await sheepdog.complete.addNode(files.validFile);
  await indexd.complete.checkFile(files.validFile);

  // update file with invalid data
  files.invalidProp.data.id = files.validFile.data.id;
  files.invalidProp.did = files.validFile.did;
  files.invalidProp.rev = files.validFile.rev;

  await sheepdog.do.addNode(files.invalidProp);
  sheepdog.ask.hasInternalServerError(files.invalidProp.addRes);

  await sheepdog.complete.deleteNode(files.invalidProp);
  await indexd.complete.deleteFile(files.invalidProp);
});
