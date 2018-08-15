'use strict';

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

Scenario('get presigned-url', async(I, fence) => {
  let signed_url_res = await fence.do.createSignedUrl(files.allowed.did);
  await fence.complete.checkFileEquals(signed_url_res, 'Hi Zac!\ncdis-data-client uploaded this!\n');
});


Scenario('get presigned-url user does not have permission', async(fence) => {
  let signed_url_res = await fence.do.createSignedUrl(files.not_allowed.did);
  fence.ask.hasError(signed_url_res, 401, 'You don&#39;t have access permission on this file');
});


Scenario('get presigned-url with invalid protocol', async(fence) => {
  let signed_url_res = await fence.do.createSignedUrl(
    files.invalid_protocol.did,
    ['protocol=s2']
  );
  fence.ask.hasError(signed_url_res, 400, 'The specified protocol s2 is not supported')
});


Scenario('get presigned-url with protocol not available in indexed document', async(fence) => {
  let signed_url_res = await fence.do.createSignedUrl(
    files.allowed.did,
    ['protocol=s2']
  );
  fence.ask.hasError(
    signed_url_res,
    404,
    `File ${files.allowed.did} does not have a location with specified protocol s2.`
  );
});


Scenario('get presigned-url with protocol not exist for file', async(fence) => {
  let signed_url_res = await fence.do.createSignedUrl(
    files.http_link.did,
    ['protocol=s3']
  );
  fence.ask.hasError(
    signed_url_res,
    404,
    `File ${files.http_link.did} does not have a location with specified protocol s3.`
  )
});

Scenario('get presigned-url no data', async(fence) => {
  let signed_url_res = await fence.do.createSignedUrl(
    files.no_link.did,
    ['protocol=s3']
  );
  fence.ask.hasError(
    signed_url_res,
    404,
    `File ${files.no_link.did} does not have a location with specified protocol s3.`
  )
});

Scenario('get presigned-url no requested protocol, no data', async(fence) => {
  let signed_url_res = await fence.do.createSignedUrl(files.no_link.did);
  fence.ask.hasError(
    signed_url_res,
    404,
    'Can&#39;t find any file locations.'
  )
});

BeforeSuite((indexd) => {
  indexd.do.addFileIndices(Object.values(files));
});

AfterSuite((indexd) => {
  indexd.do.deleteFileIndices(Object.values(files))
});
