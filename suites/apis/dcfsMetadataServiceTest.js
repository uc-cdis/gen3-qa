/*
 This test plan has a few pre-requisites:
 1. MDS (MetaData Service) must be deployed to the target environment
 2. Existing data in the blobstore should not conflict with records injected by the tests
*/
Feature('Metadata Service - PXP-5336');

// temporary until service is deployed to QA
const nock = require('nock')

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.
const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');
const { getAccessTokenHeader, requestUserInput } = require('../../utils/apiUtil');

const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'qa-dcf.planx-pla.net';

const mockData = {
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

BeforeSuite(async (I) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  const scope = nock(`https://${TARGET_ENVIRONMENT}`)
  .post(`/metadata/${mockData.fictitiousRecord1.guid}`)
  .reply(200,
    {},
  )
  .get(`/metadata/metadata?${filter}`)
  .reply(200,
    expectedResponses.positiveQuery
  );
});

// Scenario #1 - Testing POST /metadata/{GUID}: Create record
Scenario('Create records against the metadata svc blobstore - positive test @manual', ifInteractive(
  async (I) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');

    const httpResp = await I.sendPostRequest(
      `https://${TARGET_ENVIRONMENT}/metadata/${mockData.fictitiousRecord1.guid}`,
      mockData.fictitiousRecord1,
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    ).then((res) => {
      console.log(`testing - res: ${res}`);
      return res;
    });

    const result = await interactive(`
            1. [Automated] Send a HTTP POST request with the user's ACCESS TOKEN to create records in the metadata service's database:
              HTTP POST request to: https://${TARGET_ENVIRONMENT}/metadata/metadata/${mockData.fictitiousRecord1.guid}
            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError}
                // Expect an empty JSON payload
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #2 - Testing GET /metadata: Apply filter to retrieve specific records
Scenario('Query metadata for matching records - positive test @manual', ifInteractive(
  async (I) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');

    const filter = 'a=1&b=2';
    const httpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/metadata/metadata?${filter}`,
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    ).then((res) => {
      console.log(`testing - res: ${res}`);
      return res;
    });

    const result = await interactive(`
            1. [Automated] Send a HTTP GET request with the user's ACCESS TOKEN to query the metadata service:
              HTTP GET request to: https://${TARGET_ENVIRONMENT}/metadata/metadata?${filter}
            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError}
                // Expect a JSON payload containing the metadata service record:
                ${expectedResponses.positiveQuery}
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));
