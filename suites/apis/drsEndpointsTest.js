Feature('DrsAPI');

const chai = require('chai');

const { expect } = chai;

const files = {
  allowed: {
    filename: 'test_valid',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['jenkins'],
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
    acl: ['jenkins'],
    size: 9,
  },
  http_link: {
    filename: 'test_procol',
    link: 'http://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['jenkins'],
    size: 9,
  },
  invalid_protocol: {
    filename: 'test_invalid_protocol',
    link: 's2://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['jenkins'],
    size: 9,
  },
};

BeforeSuite(async ({ indexd }) => {
  const ok = await indexd.do.addFileIndices(Object.values(files));
  expect(ok).to.be.true;
});

Scenario('get drs object @drs', async ({ drs, indexd }) => {
  const indexdRecord = await indexd.do.getFile(files.allowed);
  console.log('-------------------indexd record---------------------');
  console.log(indexdRecord);
  console.log(Date());
  const drsObject = await drs.do.getDrsObject(files.allowed);
  await drs.complete.checkFile(drsObject);
});

Scenario('get drs no record found @drs', async ({ drs }) => {
  const drsObject = await drs.do.getDrsObject(files.not_allowed);
  await drs.complete.checkRecordExists(drsObject);
});

Scenario('get drs presigned-url @drs', async ({ drs, fence }) => {
  const signedUrlRes = await drs.do.getDrsSignedUrl(files.allowed);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    'Hi Zac!\ncdis-data-client uploaded this!\n',
  );
});

Scenario('get drs invalid access id @drs', async ({ drs, fence }) => {
  const signedUrlRes = await drs.do.createSignedUrl(files.invalid_protocol);
  await fence.ask.responsesEqual(signedUrlRes, drs.props.resInvalidFileProtocol);
});

Scenario('get drs presigned-url no auth header @drs', async ({ drs, fence }) => {
  const signedUrlRes = await drs.do.getDrsSignedUrlWithoutHeader(files.allowed);
  fence.ask.responsesEqual(signedUrlRes, drs.props.noAccessToken);
});

AfterSuite(async ({ indexd }) => {
  await indexd.do.deleteFileIndices(Object.values(files));
});
