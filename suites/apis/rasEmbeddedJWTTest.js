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

const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

// temporary until feature is implemented
const nock = require('nock');

const axios = require('axios');
const { expect } = require('chai');

// TODO: Introduce a RAS Staging passport here
requestBody = {
  passports: ['eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1 **** '],
};

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  const scope = nock(`https://${process.env.GEN3_COMMONS_HOSTNAME}`)
    .post(`/ga4gh/drs/v1/objects/dg.4DFC/046b37f6-2b5b-4460-9ec6-6b740ee92fc0/access/s3`)
    .reply(200, {})

  I.cache.scope = scope;
});

Scenario('Send DRS request with a single RAS ga4gh passport and confirm the access is authorized @RASJWT4DRS', async ({ I }) => {
  const httpResp2 = await I.sendPostRequest(
    `https://${TARGET_ENVIRONMENT}/ga4gh/drs/v1/objects/dg.4DFC/046b37f6-2b5b-4460-9ec6-6b740ee92fc0/access/s3`,
    requestBody,
    {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  )

  expect(
    httpResp2,
    'Should perform seamless AuthN and AuthZ with GA4GH RAS passport',
  ).to.have.property('status', 200);
  console.log(`### ## httpResp2.data: ${httpResp2.data}`);
  // expect(accessTokenJson.scope).to.include('ga4gh_passport_v1');
});
