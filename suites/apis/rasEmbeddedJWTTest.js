/*
 Single Passport with single RAS Visas - positive and negative tests (PXP-8795)
 This test plan has a few pre-requisites:
 1. Fence > 4.22.3 must be deployed.
 2. There must be an upstream client previously registered with NIH/RAS and
    the test environment must have its client & secret ID stored into its Fence config.
    e.g., $ cat gen3_secrets_folder/configs/fence-config.yaml | yq .OPENID_CONNECT.ras
          {
              "client_id": "****",
              "client_secret": "****",
              "redirect_url": "{{BASE_URL}}/login/ras/callback"
          }
*/
Feature('DRS access with RAS passport');

const HTTP_MOCKING_ENABLED = true;

const TARGET_ENVIRONMENT = `${process.env.NAMESPACE}.planx-pla.net`;

// temporary until feature is implemented
const nock = require('nock');

const { expect } = require('chai');

const expectedContentsOfTheTestFile = 'test\n'; // eslint-disable-line no-unused-vars

const indexedFiles = {
  drsEmbeddedPassportDataAccessTestFile1: {
    filename: 'test',
    link: 's3://planx-ci-drs-ras-data-access-test/test',
    md5: 'd8e8fca2dc0f896fd7cb4cb0031ba249',
    acl: ['QA'],
    size: 5,
  },
};

// TODO: Introduce a RAS Staging passport here
const requestBody = {
  passports: ['eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1 **** '],
};

BeforeSuite(async ({ I, indexd }) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  console.log('Removing test indexd records if they exist');
  await indexd.do.deleteFileIndices(Object.values(indexedFiles));

  console.log('Adding indexd files used to test DRS-access-based signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexedFiles));
  expect(
    ok, 'unable to add files to indexd as part of the RAS M3 integration test setup',
  ).to.be.true;

  if (HTTP_MOCKING_ENABLED) {
    console.log(`### ## Mocking response for request against: https://${TARGET_ENVIRONMENT}/ga4gh/drs/v1/objects/${indexedFiles.drsEmbeddedPassportDataAccessTestFile1.did}/access/s3`);
    const scope = nock(`https://${TARGET_ENVIRONMENT}`)
      .post(`/ga4gh/drs/v1/objects/${indexedFiles.drsEmbeddedPassportDataAccessTestFile1.did}/access/s3`)
      .reply(200, { url: 'https://some-bucket-name-datacommons.s3.amazonaws.com/some-file.v1.vcf.gz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AAAAAAAAAA%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20211007T162114Z&X-Amz-Expires=3600&X-Amz-Security-Token=BLABLABLA&X-Amz-SignedHeaders=host&user_id=1234&username=bob%40uchicago.edu&X-Amz-Signature=abcd1234' });

    const scope2 = nock('https://some-bucket-name-datacommons.s3.amazonaws.com')
      .get(/.*/)
      .reply(200, 'test\n');

    I.cache.scope = scope;
    I.cache.scope2 = scope2;
  }
});

Scenario('Send DRS request with a single RAS ga4gh passport and confirm the access is authorized @RASJWT4DRS', async ({ I }) => {
  const drsDataAccessResp = await I.sendPostRequest(
    `https://${TARGET_ENVIRONMENT}/ga4gh/drs/v1/objects/${indexedFiles.drsEmbeddedPassportDataAccessTestFile1.did}/access/s3`,
    requestBody,
    {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  );

  console.log(`### ## drsDataAccessResp.data: ${JSON.stringify(drsDataAccessResp.data)}`);
  expect(
    drsDataAccessResp,
    'Should perform seamless AuthN and AuthZ with GA4GH RAS passport',
  ).to.have.property('status', 200);

  expect(drsDataAccessResp.data).to.have.property('url');
  if (String(drsDataAccessResp.data).includes('You don\'t have access permission on this file')) {
    expect.fail('Access denied. Could not produce a successful presigned url from the DRS data access request.');
  }

  const drsDataAccessTestFile1Resp = await I.sendGetRequest(drsDataAccessResp.data.url);
  expect(
    drsDataAccessTestFile1Resp.data,
    'could not obtain the contents of the test file from the signed url returned by the DRS data access request',
  ).to.equal(expectedContentsOfTheTestFile);
});
