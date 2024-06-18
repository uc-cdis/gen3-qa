Feature('Guppy @requires-guppy');

const { sleepMS } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

let token;

Before(async ({ I, users, fence }) => {
  // Mutate guppy config to point guppy to pre-defined Canine ETL'ed data
  // more details: https://github.com/uc-cdis/cloud-automation/pull/1667
  await bash.runCommand('gen3 mutate-guppy-config-for-guppy-test');

  await sleepMS(30000);
  // start polling logic to capture new es indices
  const nAttempts = 24; // 2 minutes and then we give up :(
  let guppyStatusCheckResp = '';
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`waiting for the new guppy pod with the expected predefined canine indices - Attempt #${i}...`);
    guppyStatusCheckResp = await I.sendGetRequest(
      `https://${process.env.NAMESPACE}.planx-pla.net/guppy/_status`,
      users.mainAcct.accessTokenHeader,
    );
    if (guppyStatusCheckResp.status === 200
      && (Object.prototype.hasOwnProperty.call(guppyStatusCheckResp.data.indices, 'jenkins_subject_new')
      && Object.prototype.hasOwnProperty.call(guppyStatusCheckResp.data.indices, 'jenkins_file_1'))) {
      console.log(`${new Date()}: all good, proceed with the test...`);
      break;
    } else {
      console.log(`${new Date()}: The expected predefined canine indices did not show up on guppy's status payload yet...`);
      await sleepMS(5000);
      if (i === nAttempts - 1) {
        const errMsg = `${new Date()}: The new guppy pod never came up with the expected indices: Details: ${guppyStatusCheckResp.data}`;
        console.log(errMsg);
        console.log(`err: ${guppyStatusCheckResp.data}`);
        throw new Error(`ERROR: ${errMsg}`);
      }
    }
  }
  // wait a bit for any old pod replicas to go away
  await sleepMS(30000);

  const scope = ['data', 'user'];
  const apiKeyRes = await fence.complete.createAPIKey(scope, users.mainAcct.accessTokenHeader);
  token = await fence.do.getAccessToken(apiKeyRes.data.api_key);
  token = token.data.access_token;
});

// This test fails due to what looks to me like a bug in Guppy that should be fixed.
// I made a ticket for it.
/* Scenario('Query with an invalid token. @guppyAPI', async (I, guppy) => {
  const invalidToken = 'eyJhbGciOiJSUzI1N';
  const queryFile = 'suites/guppy/testData/testQuery1.json';
  const queryResponse = await guppy.do.submitQueryFileToGuppy(
    guppy.props.endpoints.graphqlEndpoint,
    queryFile,
    invalidToken
  );
  expect(queryResponse.status).to.equal(401);
}); */

Scenario('I want a list of patients (subjects) strictly younger than 30 with a past stroke in ascending order of BMI. @guppyAPI', async ({ guppy }) => {
  const queryFile = 'suites/guppy/testData/testQuery1.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse1.json';
  const queryType = 'data';
  await guppy.complete.checkQueryResponseEquals(
    guppy.props.endpoints.graphqlEndpoint,
    queryFile,
    expectedResponseFile,
    token,
    queryType,
  );
});

Scenario('I want a total count of patients matching the filter in the scenario above. @guppyAPI', async ({ guppy }) => {
  const queryFile = 'suites/guppy/testData/testQuery2.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse2.json';
  const queryType = 'aggregation';
  await guppy.complete.checkQueryResponseEquals(
    guppy.props.endpoints.graphqlEndpoint,
    queryFile,
    expectedResponseFile,
    token,
    queryType,
  );
});

Scenario('I want to render a set of visualizations summarizing data in the commons. @guppyAPI', async ({ guppy }) => {
  const queryFile = 'suites/guppy/testData/testQuery6.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse6.json';
  const queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(
    guppy.props.endpoints.graphqlEndpoint,
    queryFile,
    expectedResponseFile,
    token,
    queryType,
  );
});

Scenario('I want to make multiple histograms describing the BMI parameter to gain an understanding of its distribution. @guppyAPI', async ({ guppy }) => {
  const queryFile = 'suites/guppy/testData/testQuery7.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse7.json';
  const queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(
    guppy.props.endpoints.graphqlEndpoint,
    queryFile,
    expectedResponseFile,
    token,
    queryType,
  );
});

Scenario('I want a high-level overview of the data in the database as it pertains to stroke occurrence and age groups represented. @guppyAPI', async ({ guppy }) => {
  const queryFile = 'suites/guppy/testData/testQuery3.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse3.json';
  const queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(
    guppy.props.endpoints.graphqlEndpoint,
    queryFile,
    expectedResponseFile,
    token,
    queryType,
  );
});

// This test fails due to what looks to me like a bug in Guppy that
// needs to be investigated.
// The "max" value calculation is off by < 0.1% of the actual value.
// I want a range-stepped high-level overview of the data in the database
// as it pertains to stroke occurrence and age groups represented
/* Scenario('Range-stepped database check of age groups. @guppyAPI', async (I, guppy) => {
  const queryFile = 'suites/guppy/testData/testQuery4.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse4.json';
  const queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(
    guppy.props.endpoints.graphqlEndpoint,
    queryFile,
    expectedResponseFile,
    token,
    queryType,
  );
}); */

Scenario('I would like to list the fields on the subject document. @guppyAPI', async ({ guppy }) => {
  const queryFile = 'suites/guppy/testData/testQuery5.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse5.json';
  const queryType = 'mapping';
  await guppy.complete.checkQueryResponseEquals(
    guppy.props.endpoints.graphqlEndpoint,
    queryFile,
    expectedResponseFile,
    token,
    queryType,
  );
});

Scenario('I want to make a filtering query without worrying about paginating the results, or whether the result will be > 10k records. @guppyAPI', async ({ guppy }) => {
  const queryFile = 'suites/guppy/testData/testQuery8.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse8.json';
  const queryType = 'download';
  await guppy.complete.checkQueryResponseEquals(
    guppy.props.endpoints.downloadEndpoint,
    queryFile, expectedResponseFile,
    token,
    queryType,
  );
});
