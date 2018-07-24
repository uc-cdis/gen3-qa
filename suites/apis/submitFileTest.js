'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;


Feature('SubmitFileTest');


const clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

const extractFile = function(nodes) {
  let file_node_name = Object.keys(nodes).find((node_name) => { return nodes[node_name].category === 'data_file' });
  let bfd = clone(nodes[file_node_name].data);
  delete nodes[file_node_name];
  return bfd;
};

// list for non data_file nodes
let nodes, nodes_list;

let test_url = "s3://cdis-presigned-url-test/testdata";

// data used for testing files
let base_file_data;

// Used for holding different file versions for testing. Refreshed before every Scenario
let files;

const getFiles = function(base_data) {
  let valid_file = clone(base_data);

  let invalid_prop = clone(base_data);
  invalid_prop.file_size = "hello";

  let missing_required = clone(base_data);
  delete missing_required.md5sum;

  return {
    valid_file: {
      "data": valid_file
    },
    invalid_prop: {
      "data": invalid_prop
    },
    missing_required: {
      "data": missing_required
    }
  };
};


Scenario('test submit file without authentication', async(I) => {
  let endpoint = I.getSheepdogRoot();
  return expect(I.sendPutRequest(
    `${endpoint}${I.getProgramName()}/${I.getProjectName()}/`, {}, "").then(
    (res) => {
      return res.body.message;
    }
  )).to.eventually.equal("You don\'t have access to this data: No authentication is provided");
});


Scenario('test submit and delete file', async(I) => {
  // submit basic file without url
  await I.submitFile(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeAddSuccess(files.valid_file);

  let res = await I.getIndexdFile(I.getIndexdRoot(), files.valid_file);
  I.seeIndexdEqualsFile(res, files.valid_file);

  // delete from sheepdog and indexd
  await I.deleteNode(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeDeleteSuccess(files.valid_file);
  await I.deleteFileIndex(I.getIndexdRoot(), files.valid_file);
  I.seeFileDeleteSuccess(files.valid_file);
});


Scenario('test submit file with URL', async(I) => {
  // add url and submit
  files.valid_file.data.urls = test_url;
  await I.submitFile(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeAddSuccess(files.valid_file);

  let res = await I.getIndexdFile(I.getIndexdRoot(), files.valid_file);
  I.seeIndexdEqualsFile(res, files.valid_file);

  // remove url for later tests
  delete files.valid_file.data.urls;

  // delete from sheepdog and indexd
  await I.deleteNode(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeDeleteSuccess(files.valid_file);
  await I.deleteFileIndex(I.getIndexdRoot(), files.valid_file);
  I.seeFileDeleteSuccess(files.valid_file);
});


Scenario('test update file with URL', async(I) => {
  // submit basic file without url
  await I.submitFile(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeAddSuccess(files.valid_file);

  let orig_res = await I.getIndexdFile(I.getIndexdRoot(), files.valid_file);
  I.seeIndexdEqualsFile(orig_res, files.valid_file);

  // add a url to the data and update it
  files.valid_file.data.urls = test_url;
  await I.submitFile(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeUpdateSuccess(files.valid_file);
  let new_res = await I.getIndexdFile(I.getIndexdRoot(), files.valid_file);
  I.seeIndexdEqualsFile(new_res, files.valid_file);

  // remove url attribute for later tests and delete the file
  delete files.valid_file.data.urls;

  // delete from sheepdog and indexd
  await I.deleteNode(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeDeleteSuccess(files.valid_file);
  await I.deleteFileIndex(I.getIndexdRoot(), files.valid_file);
  I.seeFileDeleteSuccess(files.valid_file);
});


Scenario('test submit file invalid property', async(I) => {
  await I.submitFile(I.getSheepdogRoot(), files.invalid_prop);

  I.seeSheepdogHasTransactionalError(
    files.invalid_prop.add_res, "Internal server error. Sorry, something unexpected went wrong!");
});


Scenario('test update file with invalid property', async(I) => {
  await I.submitFile(I.getSheepdogRoot(), files.valid_file);
  I.seeNodeAddSuccess(files.valid_file);

  let res = await I.getIndexdFile(I.getIndexdRoot(), files.valid_file);
  I.seeIndexdEqualsFile(res, files.valid_file);

  // update with an invalid property value
  files.invalid_prop.data.id = files.valid_file.data.id;
  files.invalid_prop.did = files.valid_file.did;
  files.invalid_prop.rev = files.valid_file.rev;
  await I.submitFile(I.getSheepdogRoot(), files.invalid_prop);

  I.seeSheepdogHasTransactionalError(
    files.invalid_prop.add_res, "Internal server error. Sorry, something unexpected went wrong!");

  // only need to call delete on one of the files
  await I.deleteNode(I.getSheepdogRoot(), files.invalid_prop);
  I.seeNodeDeleteSuccess(files.invalid_prop);
  await I.deleteFileIndex(I.getIndexdRoot(), files.invalid_prop);
  I.seeFileDeleteSuccess(files.invalid_prop);
});


BeforeSuite(async (I) => {
  // Cleanup any leftover nodes from previous Suites
  await I.findDeleteAllNodes();

  // Get nodes path and extract the file node
  nodes = I.getNodePathToFile();
  base_file_data = extractFile(nodes);

  // Sort the nodes and add them all
  nodes_list = I.sortNodes(Object.values(nodes));
  await I.addNodes(I.getSheepdogRoot(), Object.values(nodes));
  I.seeAllNodesAddSuccess(Object.values(nodes));
});


Before((I) => {
  // reload the files
  files = getFiles(base_file_data);
});


AfterSuite(async (I) => {
  await I.deleteNodes(I.getSheepdogRoot(), Object.values(nodes));
  I.seeAllNodesDeleteSuccess(Object.values(nodes));
});
