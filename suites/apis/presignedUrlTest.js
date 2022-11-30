Feature('PresignedUrlAPI @requires-indexd @requires-fence');

const chai = require('chai');

const { expect } = chai;

const { Gen3Response } = require('../../utils/apiUtil');

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
    filename: 'test_protocol',
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

Scenario('get presigned-url', async ({ fence }) => {
  const signedUrlRes = await fence.do.createSignedUrl(files.allowed.did);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    'Hi Zac!\ncdis-data-client uploaded this!\n',
  );
});

Scenario('get presigned-url user does not have permission', async ({ fence }) => {
  const signedUrlRes = await fence.do.createSignedUrl(files.not_allowed.did);
  fence.ask.responsesEqual(signedUrlRes, fence.props.resMissingFilePermission);
});

Scenario('get presigned-url with invalid protocol', async ({ fence }) => {
  const signedUrlRes = await fence.do.createSignedUrl(
    files.invalid_protocol.did,
    ['protocol=s2'],
  );
  if (process.env.DEBUG === 'true') {
    console.log(`debug: presigned url response: ${signedUrlRes.data}`);
  }
  fence.ask.responsesEqual(signedUrlRes, fence.props.resInvalidFileProtocol);
});

Scenario('get presigned-url with protocol not available in indexed document', async ({ fence }) => {
  const signedUrlRes = await fence.do.createSignedUrl(files.allowed.did, [
    'protocol=s2',
  ]);
  fence.ask.responsesEqual(
    signedUrlRes,
    new Gen3Response({
      status: 404,
      fenceError: `File ${files.allowed.did} does not have a location with specified protocol s2.`,
    }),
  );
});

Scenario('get presigned-url with protocol not exist for file', async ({ fence }) => {
  const signedUrlRes = await fence.do.createSignedUrl(files.http_link.did, [
    'protocol=s3',
  ]);
  fence.ask.responsesEqual(
    signedUrlRes,
    new Gen3Response({
      status: 404,
      fenceError: `File ${files.http_link.did} does not have a location with specified protocol s3.`,
    }),
  );
});

Scenario('get presigned-url no data', async ({ fence }) => {
  const signedUrlRes = await fence.do.createSignedUrl(files.no_link.did, [
    'protocol=s3',
  ]);
  fence.ask.responsesEqual(
    signedUrlRes,
    new Gen3Response({
      status: 404,
      fenceError: `File ${files.no_link.did} does not have a location with specified protocol s3.`,
    }),
  );
});

Scenario('get presigned-url no requested protocol, no data', async ({ fence }) => {
  const signedUrlRes = await fence.do.createSignedUrl(files.no_link.did);
  fence.ask.responsesEqual(signedUrlRes, fence.props.resNoFileProtocol);
});

BeforeSuite(async ({ indexd }) => {
  const ok = await indexd.do.addFileIndices(Object.values(files));
  expect(ok).to.be.true;
});

AfterSuite(async ({ indexd }) => {
  try {
    await indexd.do.deleteFileIndices(Object.values(files));
  } catch (error) {
    console.err(error);
  }
});
