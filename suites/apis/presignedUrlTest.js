let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;

Feature('PresignedUrlAPI');

const files = {
  allowed: {
    filename: 'test_valid',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['test'],
    size: 9,
  },
  not_allowed: {
    filename: 'test_not_allowed',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['acct'],
    size: 9,
  },
  no_link: {
    filename: 'test_no_link',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['test'],
    size: 9,
  },
  http_link: {
    filename: 'test_protocol',
    link: 'http://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['test'],
    size: 9,
  },
  invalid_protocol: {
    filename: 'test_invalid_protocol',
    link: 's2://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['test'],
    size: 9,
  },
};

Scenario('test presigned-url', async(I) => {
  return expect(I.seeFileContentEqual(
    '/user/data/download/',
    files.allowed.did
  )).to.eventually.equal('Hi Zac!\ncdis-data-client uploaded this!\n');
});

Scenario('test presigned-url with file user does not have permission', async(I) => {
  return expect(I.seeFileContentEqual(
    '/user/data/download/',
    files.not_allowed.did
  )).to.eventually.equal('You don\'t have access permission on this file');
});

Scenario('test presigned-url with invalid protocol', async(I) => {
  return expect(I.seeFileContentEqual(
    '/user/data/download/',
    files.invalid_protocol.did,
    ['protocol=s2']
  )).to.eventually.equal('The specified protocol s2 is not supported');
});

Scenario('test presigned-url with protocol not available in indexed document', async(I) => {
  return expect(I.seeFileContentEqual(
    '/user/data/download/',
    files.allowed.did,
    ['protocol=s2']
  )).to.eventually.equal(`File ${files.allowed.did} does not have a location with specified protocol s2.`);
});

Scenario('test presigned-url with protocol not exist for file', async(I) => {
  return expect(I.seeFileContentEqual(
    '/user/data/download/',
    files.http_link.did,
    ['protocol=s3']
  )).to.eventually.equal(`File ${files.http_link.did} does not have a location with specified protocol s3.`);
});

Scenario('test presigned-url no data', async(I) => {
  return expect(I.seeFileContentEqual(
    '/user/data/download/',
    files.no_link.did,
    ['protocol=s3']
  )).to.eventually.equal(`File ${files.no_link.did} does not have a location with specified protocol s3.`);
});

Scenario('test presigned-url no requested protocol, no data', async(I) => {
  return expect(I.seeFileContentEqual(
    '/user/data/download/',
    files.no_link.did
  )).to.eventually.equal(`Can\'t find any file locations.`);
});

BeforeSuite((I) => {
  I.addFileIndices('/index/index/', Object.values(files))
});

AfterSuite((I) => {
  I.deleteFileIndices('/index/index/', Object.values(files))
});
