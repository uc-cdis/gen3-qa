let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;

let assert = require('assert');


Feature('SubmitFileTest');

// Nodes, sorted hierarchically by key
let nodes = require("../../sample_data/submitSamples.json");

let test_url = "s3://cdis-presigned-url-test/testdata";

const files = {
  base_file: {
    "program": "dev",
    "project": "test",
    "data": {
      "data_category": "Sequencing Data",
      "data_type": "Unaligned Reads",
      "experimental_strategy": "WGS",
      "data_format": "BAM",
      "file_size": 9,
      "file_name": "testdata",
      "md5sum": "73d643ec3f4beb9020eef0beed440ad0",
      "type": "submitted_unaligned_reads",
      "submitter_id": "submitted_unaligned_reads_001",
      "read_groups": {
        "submitter_id": "read_group_001"
      }
    },
  }
};

Scenario('test submit indexd without authentication', async(I) => {
  let endpoint = "/api/v0/submission/";
  return expect(I.sendPutRequest(
    `${endpoint}${I.getProgramName()}/${I.getProjectName()}/`, {}, "").then(
    (res) => {
      return res.body.message;
    }
  )).to.eventually.equal("You don\'t have access to this data: No authentication is provided");
});

Scenario('test submit indexd', async(I) => {
  // submit basic file without url
  let res = await I.submitFile("/api/v0/submission/", "/index/index/", files.base_file);
  assert(res.hashes.md5 === files.base_file.data.md5sum);

  return expect(I.deleteFile("/api/v0/submission/", files.base_file)).to.eventually.equal(true);
  // TODO do we want to verify the file was also deleted in indexd?
});

Scenario('test submit indexd with URL', async(I) => {
  // add url and submit
  files.base_file.data.urls = test_url;
  let res = await I.submitFile("/api/v0/submission/", "/index/index/", files.base_file);

  // verify indexd has correct hash and url
  assert(res.hashes.md5 === files.base_file.data.md5sum);
  assert(res.urls[0] === test_url);

  // remove url for later tests
  delete files.base_file.data.urls;
  return expect(I.deleteFile("/api/v0/submission/", files.base_file)).to.eventually.equal(true);
  // TODO do we want to verify the file was also deleted in indexd?
});

Scenario('test submit indexd -> update url', async(I) => {
  // submit basic file without url
  let res = await I.submitFile("/api/v0/submission/", "/index/index/", files.base_file);

  // add a url to the data and update it
  files.base_file.data.urls = test_url;
  let url_res = await I.submitFile("/api/v0/submission/", "/index/index/", files.base_file);

  // verify url was added to indexd
  assert(url_res.urls[0] === test_url);

  // remove url attribute for later tests and delete the file
  delete files.base_file.data.urls;
  return expect(I.deleteFile("/api/v0/submission/", files.base_file)).to.eventually.equal(true);
});

BeforeSuite(async (I) => {
  let all_added = await I.addNodes("/api/v0/submission/", Object.values(nodes));
  assert(all_added);
});

AfterSuite(async (I) => {
  let all_removed = await I.deleteNodes("/api/v0/submission/", Object.values(nodes));
  assert(all_removed);
});
