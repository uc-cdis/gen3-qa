/*
 This test plan has a few pre-requisites:
 1. MDS (MetaData Service) must be deployed to the target environment
 2. Existing data in the blobstore should not conflict with records injected by the tests
*/
Feature('Metadata Service - PXP-5336');

const stringify = require('json-stringify-safe');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');
const { getAccessTokenHeader, requestUserInput } = require('../../utils/apiUtil');

const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'qa-dcf.planx-pla.net';

const testData = {
  filter: 'a=1&b=2',
  fictitiousRecord1: {
    guid: '91cfab02-b87a-498b-bf0a-14180e6768b7',
    a: 1,
  },
  fictitiousRecord2: {
    guid: '354881f3-a928-4835-9368-6c02d40f75a0',
    b: 2,
  },
};

const expectedResponses = {
  positiveQuery: [
    '91cfab02-b87a-498b-bf0a-14180e6768b7',
    '354881f3-a928-4835-9368-6c02d40f75a0',
  ],
  negativeQuery: [],
  validationErrorQuery: {
    detail: [
      {
        loc: [
          'string',
        ],
        msg: 'string',
        type: 'string',
      },
    ],
  },
};

async function deleteRecord(I, guid) {
  const deleteRes = await I.sendDeleteRequest(
    `https://${TARGET_ENVIRONMENT}/mds-admin/metadata_index/${guid}`,
    getAccessTokenHeader(I.cache.ACCESS_TOKEN),
  ).then((res) => res);
  // console.log(`deletion result: ${stringify(deleteRes)}`);
  if (deleteRes.status !== 204) {
    throw new Error(`Failed to delete record ${guid}: ${deleteRes.data}`);
  }
}

BeforeSuite(async (I) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  console.log('deleting existing test records...');
  if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');

  await deleteRecord(I, testData.fictitiousRecord1.guid);
  await deleteRecord(I, testData.fictitiousRecord2.guid);
});

// Scenario #1 - Testing POST /mds-admin/metadata_index/{GUID}: Create record
Scenario('Create records against the metadata svc blobstore - positive test @manual', ifInteractive(
  async (I) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');

    const httpResp1 = await I.sendPostRequest(
      `https://${TARGET_ENVIRONMENT}/mds-admin/metadata_index/${testData.fictitiousRecord1.guid}`,
      testData.fictitiousRecord1,
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    ).then((res) => res);

    const httpResp2 = await I.sendPostRequest(
      `https://${TARGET_ENVIRONMENT}/mds-admin/metadata_index/${testData.fictitiousRecord2.guid}`,
      testData.fictitiousRecord2,
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    ).then((res) => res);

    const result = await interactive(`
            1. [Automated] Send two HTTP POST requests with the user's ACCESS TOKEN to create records in the metadata service's database:
              HTTP POST request to:
              https://${TARGET_ENVIRONMENT}/mds-admin/metadata_index/${testData.fictitiousRecord1.guid}
              and
              https://${TARGET_ENVIRONMENT}/mds-admin/metadata_index/${testData.fictitiousRecord2.guid}
            Manual verification:
              Response status request #1: ${httpResp1.status} // Expect a HTTP 201
              Response status request #2: ${httpResp2.status} // Expect a HTTP 201
              Response 1: ${stringify(httpResp1.data)}
              ExpectedResponse 1: ${expectedResponses.positiveQuery[0]}
              Automated check: ${httpResp1.data === expectedResponses.positiveQuery[0]}
              Response 2: ${stringify(httpResp2.data)}
              ExpectedResponse 2: ${expectedResponses.positiveQuery[1]}
              Automated check: ${httpResp2.data === expectedResponses.positiveQuery[1]}
                // Expect the correspondent GUIDs in both responses
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));


// Scenario #2 - Testing GET /metadata_index: return keys from stored records
Scenario('Get existing keys from metadata records - positive test @manual', ifInteractive(
  async (I) => {
    if (!I.cache.ACCESS_TOKEN) {
      I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    }

    const httpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/mds-admin/metadata_index`,
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    ).then((res) => res);

    const result = await interactive(`
            1. [Automated] Send a HTTP GET request with the user's ACCESS TOKEN
               to retrieve the GUIDs (keys only) from records stored previously
              HTTP GET request to: https://${TARGET_ENVIRONMENT}/mds-admin/metadata_index

            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 200
              Response data: ${stringify(httpResp.data)}
                // Expect GUIDs
                ${expectedResponses.positiveQuery[0]}
                ${expectedResponses.positiveQuery[1]}
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #3 - Testing GET /metadata: Apply filter to retrieve specific records
Scenario('Query metadata for matching records - positive test @manual', ifInteractive(
  async (I) => {
    if (!I.cache.ACCESS_TOKEN) {
      I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    }

    const httpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/metadata/metadata?${testData.filter}`,
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    ).then((res) => res);

    const result = await interactive(`
            1. [Automated] Send a HTTP GET request with the user's ACCESS TOKEN
               to query the metadata service:
              HTTP GET request to: https://${TARGET_ENVIRONMENT}/mds-admin/metadata?${testData.filter}
            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 200
              Response data: ${stringify(httpResp.data)}
                // Expect a JSON payload containing the metadata service records
                   whose parameters match the filter's criteria:
                ${expectedResponses.positiveQuery}
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));
