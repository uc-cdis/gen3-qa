Feature('Guppy');

const chai = require('chai');

const { expect } = chai;


var token;

Before(async (users, fence) => {
  const scope = ['data', 'user'];
  const apiKeyRes = await fence.complete.createAPIKey(scope, users.mainAcct.accessTokenHeader);
  token = await fence.do.getAccessToken(apiKeyRes.data.api_key);
  token = token.data.access_token;
});

// This test fails due to what looks to me like a bug in Guppy that should be fixed. I made a ticket for it.
Scenario('I want to make a query to Guppy, but my access token is invalid or expired. @guppyAPI', async (I, guppy) => {
  const invalidToken = 'eyJhbGciOiJSUzI1N';
  const queryFile = 'suites/guppy/testData/testQuery1.json';
  const queryResponse = await guppy.do.submitQueryFileToGuppy(guppy.props.endpoints.graphqlEndpoint, queryFile, invalidToken);
  expect(queryResponse.status).to.equal(401);
});

Scenario('I want a list of patients (cases) strictly younger than 30 with a past stroke in ascending order of BMI. @guppyAPI', async (I, guppy) => {
  const queryFile = 'suites/guppy/testData/testQuery1.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse1.json';
  const queryType = 'data';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want a total count of patients matching the filter in the scenario above. @guppyAPI', async (I, guppy) => {
  const queryFile = 'suites/guppy/testData/testQuery2.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse2.json';
  const queryType = 'aggregation';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want to render a set of visualizations summarizing data in the commons. @guppyAPI', async (I, guppy) => {
  const queryFile = 'suites/guppy/testData/testQuery6.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse6.json';
  const queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want to make multiple histograms describing the BMI parameter to gain an understanding of its distribution. @guppyAPI', async (I, guppy) => {
  const queryFile = 'suites/guppy/testData/testQuery7.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse7.json';
  const queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want a high-level overview of the data in the database as it pertains to stroke occurrence and age groups represented. @guppyAPI', async (I, guppy) => {
  const queryFile = 'suites/guppy/testData/testQuery3.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse3.json';
  const queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

// This test fails due to what looks to me like a bug in Guppy that needs to be investigated. The "max" value calculation is off by < 0.1% of the actual value.
Scenario('I want a range-stepped high-level overview of the data in the database as it pertains to stroke occurrence and age groups represented. @guppyAPI', async (I, guppy) => {
  const queryFile = 'suites/guppy/testData/testQuery4.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse4.json';
  const queryType = 'histogram';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I would like to list the fields on the case document. @guppyAPI', async (I, guppy) => {
  const queryFile = 'suites/guppy/testData/testQuery5.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse5.json';
  const queryType = 'mapping';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.graphqlEndpoint, queryFile, expectedResponseFile, token, queryType);
});

Scenario('I want to make a filtering query without worrying about paginating the results, or whether the result will be > 10k records. @guppyAPI', async (I, guppy) => {
  const queryFile = 'suites/guppy/testData/testQuery8.json';
  const expectedResponseFile = 'suites/guppy/testData/testResponse8.json';
  const queryType = 'download';
  await guppy.complete.checkQueryResponseEquals(guppy.props.endpoints.downloadEndpoint, queryFile, expectedResponseFile, token, queryType);
});
